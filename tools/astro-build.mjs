import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const astroCli = path.join(root, "node_modules", "astro", "bin", "astro.mjs");

const child = spawn(process.execPath, [astroCli, "build"], {
  cwd: root,
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1",
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Astro build terminated by ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
