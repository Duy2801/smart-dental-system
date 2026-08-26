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

const systemPython = isWin ? "py" : "python3.12";
const systemPythonArgs = isWin ? ["-3.12"] : [];

if (!existsSync(venvPython)) {
  console.log("[ai-service] Tạo .venv bằng Python 3.12…");
  run(systemPython, [...systemPythonArgs, "-m", "venv", ".venv"]);
}

const versionCheck = spawnSync(
  venvPython,
  ["-c", "import sys; raise SystemExit(0 if (3, 11) <= sys.version_info[:2] <= (3, 13) else 1)"],
  { cwd: root, stdio: "ignore" },
);
if (versionCheck.status !== 0) {
  console.error(
    "[ai-service] YOLO + DeepLab yêu cầu Python 3.11 đến 3.13. " +
      "Hãy xóa apps/ai-service/.venv, cài Python 3.12 rồi chạy setup lại.",
  );
  process.exit(1);
}

console.log("[ai-service] Cài requirements…");
run(venvPip, ["install", "-r", "requirements.txt"]);

console.log("[ai-service] Kiểm tra model Dental Pano…");
run(venvPython, [path.resolve(root, "../../download_models.py")]);

const envExample = path.join(root, ".env.example");
const envFile = path.join(root, ".env");
if (!existsSync(envFile) && existsSync(envExample)) {
  copyFileSync(envExample, envFile);
  console.log("[ai-service] Đã tạo .env từ .env.example");
}

console.log("[ai-service] Setup xong. Chạy: pnpm dev");
