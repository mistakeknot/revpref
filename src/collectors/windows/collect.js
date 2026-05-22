import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getWindowsCollectorScriptPath() {
  return resolve(__dirname, "inventory.ps1");
}

export function buildWindowsCollectorArgs(options = {}) {
  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    getWindowsCollectorScriptPath()
  ];

  if (options.includeMsix) {
    args.push("-IncludeMsix");
  }

  if (options.includeWinget) {
    args.push("-IncludeWinget");
  }

  return args;
}

export async function collectWindowsInventory(options = {}) {
  const command = process.platform === "win32" ? "powershell.exe" : "pwsh";
  const args = buildWindowsCollectorArgs(options);
  const { stdout, stderr } = await run(command, args);

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }

  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Windows collector exited with code ${code}: ${stderr.trim()}`));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}
