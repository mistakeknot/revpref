# Read-only Windows inventory sketch for RevPref.
# Produces approximate app records from uninstall registry keys and startup commands.

$ErrorActionPreference = "Continue"

$uninstallRoots = @(
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
)

$startupCommands = Get-CimInstance Win32_StartupCommand -ErrorAction SilentlyContinue

$apps = foreach ($root in $uninstallRoots) {
  foreach ($item in Get-ItemProperty $root -ErrorAction SilentlyContinue) {
    if (-not $item.DisplayName) {
      continue
    }

    $startupEntries = @(
      $startupCommands |
        Where-Object {
          $_.Name -like "*$($item.DisplayName)*" -or
          ($item.InstallLocation -and $_.Command -like "*$($item.InstallLocation)*")
        } |
        ForEach-Object {
          [pscustomobject]@{
            name = $_.Name
            type = "startup-command"
            enabled = $true
            source = $_.Location
          }
        }
    )

    [pscustomobject]@{
      id = ($item.PSChildName -replace "[{}]", "").ToLowerInvariant()
      name = $item.DisplayName
      platform = "windows"
      source = "registry"
      vendor = $item.Publisher
      installPath = $item.InstallLocation
      installedAt = $null
      sizeBytes = if ($item.EstimatedSize) { [int64]$item.EstimatedSize * 1024 } else { 0 }
      isSystem = $false
      isUserProtected = $false
      startupEntries = $startupEntries
      usage = @{
        lastForegroundAt = $null
        foregroundSeconds30d = 0
        launchCount30d = 0
        backgroundSeconds30d = 0
      }
      uninstall = @{
        kind = "handoff"
        command = $item.UninstallString
      }
    }
  }
}

$apps |
  Sort-Object name -Unique |
  ConvertTo-Json -Depth 8
