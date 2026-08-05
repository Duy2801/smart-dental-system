import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const python = path.join(
  root,
  ".venv",
  isWin ? "Scripts/python.exe" : "bin/python",
);

if (!existsSync(python)) {
  console.error(
    "[ai-service] Chưa có .venv. Chạy một lần:\n  pnpm --filter ai-service setup",
  );
  process.exit(1);
}

const envExample = path.join(root, ".env.example");
const envFile = path.join(root, ".env");
if (!existsSync(envFile) && existsSync(envExample)) {
  copyFileSync(envExample, envFile);
  console.log("[ai-service] Đã tạo .env từ .env.example");
}

const child = spawn(
  python,
  [
    "-m",
    "uvicorn",
    "app.main:app",
    "--reload",
    "--host",
    "127.0.0.1",
    "--port",
    "8000",
  ],
  { cwd: root, stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
