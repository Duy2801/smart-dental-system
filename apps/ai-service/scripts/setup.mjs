import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const venvPython = path.join(
  root,
  ".venv",
  isWin ? "Scripts/python.exe" : "bin/python",
);
const venvPip = path.join(
  root,
  ".venv",
  isWin ? "Scripts/pip.exe" : "bin/pip",
);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: isWin });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const systemPython = isWin ? "python" : "python3";

if (!existsSync(venvPython)) {
  console.log("[ai-service] Tạo .venv…");
  run(systemPython, ["-m", "venv", ".venv"]);
}

console.log("[ai-service] Cài requirements…");
run(venvPip, ["install", "-r", "requirements.txt"]);

const envExample = path.join(root, ".env.example");
const envFile = path.join(root, ".env");
if (!existsSync(envFile) && existsSync(envExample)) {
  copyFileSync(envExample, envFile);
  console.log("[ai-service] Đã tạo .env từ .env.example");
}

console.log("[ai-service] Setup xong. Chạy: pnpm dev");
