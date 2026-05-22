# Read-only Windows inventory collector for RevPref.
# Emits normalized app records from registry uninstall keys, startup entries,
# optional MSIX packages, and optional WinGet package metadata.

param(
  [switch]$IncludeMsix,
  [switch]$IncludeWinget
)

$ErrorActionPreference = "Continue"
try {
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $OutputEncoding = [Console]::OutputEncoding
} catch {
  # Older hosts may not allow changing console output encoding. Collection can continue.
}

function Normalize-Token {
  param([AllowNull()][string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return "unknown" }
  $token = $Value.ToLowerInvariant() -replace "[^a-z0-9]+", "-"
  $token = $token.Trim("-")
  if ([string]::IsNullOrWhiteSpace($token)) { return "unknown" }
  return $token
}

function ConvertTo-StableId {
  param(
    [string]$Namespace,
    [string]$Primary,
    [AllowNull()][string]$Fallback
  )

  $base = if ([string]::IsNullOrWhiteSpace($Primary)) { $Fallback } else { $Primary }
  return "windows.$Namespace.$(Normalize-Token $base)"
}

function ConvertFrom-InstallDate {
  param([AllowNull()][object]$Value)
  if (-not $Value) { return $null }
  $text = [string]$Value
  if ($text -match "^\d{8}$") {
    try {
      return ([datetime]::ParseExact($text, "yyyyMMdd", $null)).ToUniversalTime().ToString("o")
    } catch {
      return $null
    }
  }
  return $null
}

function Get-UninstallEntries {
  $roots = @(
    @{ Path = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"; Scope = "machine"; RegistryView = "64" },
    @{ Path = "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"; Scope = "machine"; RegistryView = "32" },
    @{ Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"; Scope = "user"; RegistryView = "user" }
  )

  foreach ($root in $roots) {
    foreach ($item in Get-ItemProperty $root.Path -ErrorAction SilentlyContinue) {
      if (-not $item.DisplayName) { continue }
      [pscustomobject]@{
        kind = "registry"
        keyName = $item.PSChildName
        keyPath = $item.PSPath
        scope = $root.Scope
        registryView = $root.RegistryView
        displayName = $item.DisplayName
        displayVersion = $item.DisplayVersion
        publisher = $item.Publisher
        installLocation = $item.InstallLocation
        installDate = ConvertFrom-InstallDate $item.InstallDate
        estimatedSizeBytes = if ($item.EstimatedSize) { [int64]$item.EstimatedSize * 1024 } else { 0 }
        uninstallString = $item.UninstallString
        quietUninstallString = $item.QuietUninstallString
        systemComponent = ($item.SystemComponent -eq 1)
        releaseType = $item.ReleaseType
        parentKeyName = $item.ParentKeyName
        windowsInstaller = ($item.WindowsInstaller -eq 1)
        noRemove = ($item.NoRemove -eq 1)
      }
    }
  }
}

function Get-StartupEntries {
  $entries = @()
  $runKeys = @(
    @{ Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"; Scope = "user"; Type = "run-key" },
    @{ Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce"; Scope = "user"; Type = "run-once-key" },
    @{ Path = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"; Scope = "machine"; Type = "run-key" },
    @{ Path = "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"; Scope = "machine"; Type = "run-key-32" },
    @{ Path = "HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce"; Scope = "machine"; Type = "run-once-key" }
  )

  foreach ($runKey in $runKeys) {
    $item = Get-ItemProperty $runKey.Path -ErrorAction SilentlyContinue
    if (-not $item) { continue }
    foreach ($property in $item.PSObject.Properties) {
      if ($property.Name -like "PS*") { continue }
      $entries += [pscustomobject]@{
        name = $property.Name
        type = $runKey.Type
        enabled = $true
        source = $runKey.Path
        scope = $runKey.Scope
        command = [string]$property.Value
      }
    }
  }

  $startupFolders = @(
    @{ Path = [Environment]::GetFolderPath("Startup"); Scope = "user" },
    @{ Path = [Environment]::GetFolderPath("CommonStartup"); Scope = "machine" }
  )

  foreach ($folder in $startupFolders) {
    if ([string]::IsNullOrWhiteSpace($folder.Path) -or -not (Test-Path $folder.Path)) { continue }
    foreach ($file in Get-ChildItem -Path $folder.Path -File -ErrorAction SilentlyContinue) {
      $entries += [pscustomobject]@{
        name = $file.BaseName
        type = "startup-folder"
        enabled = $true
        source = $file.FullName
        scope = $folder.Scope
        command = $file.FullName
      }
    }
  }

  return $entries
}

function Get-WinGetPackages {
  if (-not $IncludeWinget) { return @() }
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) { return @() }

  try {
    $raw = @(& winget list --accept-source-agreements --disable-interactivity --nowarn 2>$null)
    $headerIndex = -1
    for ($i = 0; $i -lt $raw.Count; $i++) {
      if ($raw[$i] -match "^\s*Name\s+Id\s+Version") {
        $headerIndex = $i
        break
      }
    }
    if ($headerIndex -lt 0) { return @() }

    $packages = @()
    foreach ($line in $raw[($headerIndex + 2)..($raw.Count - 1)]) {
      $text = [string]$line
      if ([string]::IsNullOrWhiteSpace($text)) { continue }
      if ($text.TrimStart().StartsWith("-")) { continue }
      if ($text -match "^(?<Name>.+?)\s{2,}(?<Id>[A-Za-z0-9][A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+)\s{2,}(?<Rest>.+?)\s+(?<Source>winget)\s*$") {
        $name = $Matches.Name.Trim()
        $id = $Matches.Id.Trim()
        $source = $Matches.Source.Trim()
        $rest = $Matches.Rest.Trim()
        $version = if ($rest -match "^(\S+)") { $Matches[1] } else { $null }
        $packages += [pscustomobject]@{
          Name = $name
          Id = $id
          Version = $version
          Publisher = $null
          Source = $source
        }
      }
    }

    return $packages
  } catch {
    Write-Verbose "WinGet metadata unavailable: $($_.Exception.Message)"
    return @()
  }
}

function Find-WinGetMatch {
  param(
    [object]$Entry,
    [array]$Packages
  )
  if (-not $Packages -or $Packages.Count -eq 0) { return $null }
  $name = [string]$Entry.displayName
  $publisher = [string]$Entry.publisher

  return $Packages |
    Where-Object {
      $_.Name -eq $name -or
      ($_.Name -and $name -like "*$($_.Name)*") -or
      ($publisher -and $_.Publisher -and $publisher -like "*$($_.Publisher)*")
    } |
    Select-Object -First 1
}

function Test-StartupMatch {
  param(
    [object]$App,
    [object]$Startup
  )

  $nameToken = Normalize-Token $App.displayName
  $keyToken = Normalize-Token $App.keyName
  $installLocation = [string]$App.installLocation
  $command = ([string]$Startup.command).ToLowerInvariant()
  $startupName = Normalize-Token $Startup.name

  if ($installLocation -and $command.Contains($installLocation.ToLowerInvariant())) { return $true }
  if ($nameToken -ne "unknown" -and ($startupName.Contains($nameToken) -or $command.Contains($nameToken.Replace("-", "")))) { return $true }
  if ($keyToken -ne "unknown" -and $command.Contains($keyToken)) { return $true }
  return $false
}

function ConvertTo-AppRecord {
  param(
    [object]$Entry,
    [array]$StartupEntries,
    [array]$WinGetPackages
  )

  $winget = Find-WinGetMatch -Entry $Entry -Packages $WinGetPackages
  $matchedStartup = @($StartupEntries | Where-Object { Test-StartupMatch -App $Entry -Startup $_ })
  $isSystem = [bool]($Entry.systemComponent -or $Entry.parentKeyName -or $Entry.releaseType -or $Entry.noRemove)
  $id = ConvertTo-StableId -Namespace "registry" -Primary $Entry.keyName -Fallback $Entry.displayName

  [pscustomobject]@{
    id = $id
    name = $Entry.displayName
    platform = "windows"
    source = "registry"
    vendor = $Entry.publisher
    installPath = if ([string]::IsNullOrWhiteSpace($Entry.installLocation)) { $null } else { $Entry.installLocation }
    installedAt = $Entry.installDate
    sizeBytes = [int64]$Entry.estimatedSizeBytes
    isSystem = $isSystem
    isUserProtected = $false
    identifiers = @{
      registryKey = $Entry.keyName
      registryPath = $Entry.keyPath
      registryView = $Entry.registryView
      scope = $Entry.scope
      wingetId = if ($winget) { $winget.Id } else { $null }
      packageName = $null
      packageFamilyName = $null
    }
    startupEntries = @($matchedStartup | ForEach-Object {
      [pscustomobject]@{
        name = $_.name
        type = $_.type
        enabled = $_.enabled
        source = $_.source
        scope = $_.scope
        command = $_.command
      }
    })
    usage = @{
      lastForegroundAt = $null
      foregroundSeconds30d = 0
      launchCount30d = 0
      backgroundSeconds30d = 0
    }
    resourceUsage = @{
      uploadBytes7d = 0
      downloadBytes7d = 0
    }
    uninstall = @{
      kind = "handoff"
      command = $Entry.uninstallString
      quietCommand = $Entry.quietUninstallString
    }
    metadata = @{
      displayVersion = $Entry.displayVersion
      windowsInstaller = $Entry.windowsInstaller
      releaseType = $Entry.releaseType
      collectedAt = (Get-Date).ToUniversalTime().ToString("o")
    }
  }
}

function Get-MsixAppRecords {
  if (-not $IncludeMsix) { return @() }
  $packages = Get-AppxPackage -ErrorAction SilentlyContinue
  foreach ($package in $packages) {
    [pscustomobject]@{
      id = ConvertTo-StableId -Namespace "msix" -Primary $package.PackageFamilyName -Fallback $package.Name
      name = $package.Name
      platform = "windows"
      source = "msix"
      vendor = $package.Publisher
      installPath = $package.InstallLocation
      installedAt = $null
      sizeBytes = 0
      isSystem = [bool]$package.IsFramework
      isUserProtected = $false
      identifiers = @{
        registryKey = $null
        registryPath = $null
        registryView = $null
        scope = "user"
        wingetId = $null
        packageName = $package.PackageFullName
        packageFamilyName = $package.PackageFamilyName
      }
      startupEntries = @()
      usage = @{
        lastForegroundAt = $null
        foregroundSeconds30d = 0
        launchCount30d = 0
        backgroundSeconds30d = 0
      }
      resourceUsage = @{
        uploadBytes7d = 0
        downloadBytes7d = 0
      }
      uninstall = @{
        kind = "msix-handoff"
        command = $null
        quietCommand = $null
      }
      metadata = @{
        displayVersion = [string]$package.Version
        windowsInstaller = $false
        releaseType = $null
        collectedAt = (Get-Date).ToUniversalTime().ToString("o")
      }
    }
  }
}

$startupEntries = @(Get-StartupEntries)
$wingetPackages = @(Get-WinGetPackages)
$registryRecords = @(Get-UninstallEntries | ForEach-Object {
  ConvertTo-AppRecord -Entry $_ -StartupEntries $startupEntries -WinGetPackages $wingetPackages
})
$msixRecords = @(Get-MsixAppRecords)

@($registryRecords + $msixRecords) |
  Sort-Object id -Unique |
  ConvertTo-Json -Depth 12
