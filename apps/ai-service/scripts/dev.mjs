import { spawn } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const python = path.join(
  root,
  ".venv",
  isWin ? "Scripts/python.exe" : "bin/python",
);

function loadEnvFile(filePath) {
  const env = { ...process.env };
  if (!existsSync(filePath)) return env;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    env[key] = val;
  }
  return env;
}

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

const childEnv = loadEnvFile(envFile);
const port = childEnv.AI_SERVICE_PORT || "8001";

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
    String(port),
  ],
  { cwd: root, stdio: "inherit", env: childEnv },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
