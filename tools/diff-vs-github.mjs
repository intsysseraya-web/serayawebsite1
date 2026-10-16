/**
 * 本地工作副本 vs GitHub 仓库文件比对（只读，不做任何 git 操作）。
 *
 * 为什么需要：本工作副本不是 git 仓库（没有 `.git`），但需要知道「哪些文件与远端
 * 仓库不同、因此需要上传」，同时不能把行尾差异误报成内容改动。
 * 做法：对每个本地文件按 git 规则计算 blob hash（`sha1("blob <len>\0" + content)`），
 * 与 GitHub API 返回的 tree 中同路径的 sha 比对。相同即无需上传。
 *
 * **已知假阳性**：`.gitattributes` 声明 `*.ps1` / `*.cmd` / `*.bat` 为 `eol=crlf`，
 * 但远端 blob 存的是 LF。这些文件一旦 checkout 到本机就会被判为「MODIFIED」，
 * 内容可能完全一致。判断方法是比字节差是否约等于行数 —— 那是纯行尾差异。
 *
 * 用法：node tools/diff-vs-github.mjs [owner/repo] [branch]
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const REPO = process.argv[2] ?? "intsysseraya-web/serayawebsite1";
const BRANCH = process.argv[3] ?? "main";
const ROOT = process.cwd();

/** 与 .gitignore 保持一致的忽略规则（本仓库实际生效的那些） */
const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "dist-ssr",
  ".output",
  ".worktrees",
  ".tanstack",
  ".nitro",
  ".wrangler",
  ".vinxi",
  ".superpowers",
  "docs",
  "verification-evidence",
  ".npm-cache",
]);
const IGNORE_FILES = [
  /^\.env$/,
  /^\.env\..+$/,
  /^\.secret\.json$/,
  /^\.secret\..+\.json$/,
  /\.log$/,
  /^npm-.*\.log$/,
];
const IGNORE_EXCEPTIONS = new Set([".env.example", ".secret.example.json"]);

function ignoredFile(name) {
  if (IGNORE_EXCEPTIONS.has(name)) return false;
  return IGNORE_FILES.some((re) => re.test(name));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.isFile()) {
      if (ignoredFile(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function gitBlobHash(path) {
  const buf = readFileSync(path);
  const header = Buffer.from(`blob ${buf.length}\0`, "utf8");
  return createHash("sha1")
    .update(Buffer.concat([header, buf]))
    .digest("hex");
}

const res = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`, {
  headers: { "user-agent": "seraya-diff", accept: "application/vnd.github+json" },
});
if (!res.ok) {
  console.error(`GitHub API ${res.status}: ${await res.text()}`);
  process.exit(2);
}
const tree = await res.json();
const remote = new Map();
for (const node of tree.tree) {
  if (node.type === "blob") remote.set(node.path, node.sha);
}

const localFiles = walk(ROOT)
  .map((f) => relative(ROOT, f).split(sep).join("/"))
  .sort();

const changed = [];
const same = [];
for (const path of localFiles) {
  const sha = gitBlobHash(join(ROOT, path.split("/").join(sep)));
  if (!remote.has(path)) changed.push({ path, why: "NEW" });
  else if (remote.get(path) !== sha) changed.push({ path, why: "MODIFIED" });
  else same.push(path);
}

const localSet = new Set(localFiles);
const deleted = [...remote.keys()].filter((p) => !localSet.has(p)).sort();

console.log(
  `repo: ${REPO}@${BRANCH}  (remote blobs: ${remote.size}, local files: ${localFiles.length})`,
);
console.log("");
const group = (label, items, fn) => {
  if (!items.length) return;
  console.log(`--- ${label} (${items.length}) ---`);
  for (const it of items) console.log(fn(it));
  console.log("");
};

group(
  "需要新增 (NEW)",
  changed.filter((c) => c.why === "NEW"),
  (c) => `A  ${c.path}`,
);
group(
  "需要更新 (MODIFIED)",
  changed.filter((c) => c.why === "MODIFIED"),
  (c) => `M  ${c.path}`,
);
group("仓库里存在、本地已删除（需决定是否删远端）", deleted, (p) => `D  ${p}`);

console.log(`--- 无需上传 (${same.length}) ---`);
console.log(same.join("\n"));
