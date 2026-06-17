#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");

const requireFromProject = createRequire(`${process.cwd()}/package.json`);

const linuxX64NativePackages = [
  {
    name: "lightningcss-linux-x64-gnu",
    spec: "lightningcss-linux-x64-gnu@1.32.0",
  },
  {
    name: "@tailwindcss/oxide-linux-x64-gnu",
    spec: "@tailwindcss/oxide-linux-x64-gnu@4.2.4",
  },
];

if (process.platform !== "linux" || process.arch !== "x64") {
  process.exit(0);
}

const missing = linuxX64NativePackages.filter(({ name }) => {
  try {
    requireFromProject(name);
    return false;
  } catch {
    return true;
  }
});

if (missing.length === 0) {
  process.exit(0);
}

console.log(
  `[native-deps] Installing missing Linux native packages: ${missing.map(({ name }) => name).join(", ")}`,
);

const npmArgs = [
  "install",
  "--no-save",
  "--no-package-lock",
  "--include=optional",
  "--ignore-scripts",
  "--prefer-online",
  "--fetch-retries=5",
  "--fetch-retry-mintimeout=20000",
  "--fetch-retry-maxtimeout=120000",
  ...missing.map(({ spec }) => spec),
];

const npmExecPath = process.env.npm_execpath;
const command = npmExecPath ? process.execPath : "npm";
const args = npmExecPath ? [npmExecPath, ...npmArgs] : npmArgs;
const result = spawnSync(command, args, { stdio: "inherit" });

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

for (const { name } of missing) {
  requireFromProject(name);
}
