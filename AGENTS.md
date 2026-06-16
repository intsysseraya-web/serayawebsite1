# Seraya Website Agent Guide

This repository is the deployment and operating repository for the Seraya System Integration website. The website frontend is now synchronized from the Lovable/TanStack app in `H:\brep\baytech\seraya`; keep deployment credentials, repo-local scripts, and operational docs in this repository.

## Project Shape

- Current frontend shape: Lovable/TanStack Start + Vite + React source synchronized into this repo.
- This phase is frontend/local-run focused. Do not add Cloudflare Workers, full-stack server deployment, or production deployment changes unless the user explicitly asks for that phase.
- Source Lovable repo: `H:\brep\baytech\seraya`.
- Target deployment repo: `H:\brep\baytech\serayawebsite1`.
- Main app source lives in `src/`; public assets live in `public/`.
- Legacy static-root files such as `index.html`, `works.html`, `case-study.html`, `about.html`, `styles.css`, and `script.js` are retired after sync.
- Deployment/config files such as `_headers`, `wrangler.toml`, `netlify.toml`, and `DEPLOY-SPACESHIP.txt` are target-owned and should not be overwritten by the Lovable sync script.

## Lovable Sync Workflow

Use the repo-local sync script to bring Lovable frontend source into this repository:

```powershell
.\tools\sync-lovable.ps1 -DryRun
.\tools\sync-lovable.ps1 -Apply
```

The script copies an explicit allowlist from `H:\brep\baytech\seraya`, including `src/`, `public/`, `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `components.json`, `bun.lock`, `bunfig.toml`, `package-lock.json` when present, and `.lovable/project.json`.

The script intentionally excludes generated or unrelated source material such as `node_modules/`, `dist/`, `.tanstack/`, `.nitro/`, `.wrangler/`, `old_site/`, `.git/`, and `.lovable/plan.md`.

The script must preserve target-owned files and folders, including `AGENTS.md`, `_headers`, `wrangler.toml`, `netlify.toml`, `DEPLOY-SPACESHIP.txt`, `.secret.example.json`, `.secret.json`, and `tools/*`.

Run the sync behavior test after changing the script:

```powershell
.\tools\test-sync-lovable.ps1
```

### Future Sync Delivery

- This initial migration can go through a PR and merge into `main`.
- After the initial migration is merged, routine Lovable sync-only updates do not need the PR workflow.
- For sync-only updates, run `.\tools\sync-lovable.ps1 -Apply`, verify locally, then commit directly on `main` or fast-forward/merge into `main` using repo-local Git helpers.
- Create a PR only when the change goes beyond routine sync, such as changing deployment architecture, GitHub credential tooling, production deployment config, or broad content/design direction.

## Project GitHub PAT

- This project uses a repo-local GitHub PAT. Do not rely on the global `gh auth` login for authenticated GitHub work in this repository.
- The real token belongs in local-only `.secret.json`, copied from `.secret.example.json`.
- Never commit `.secret.json`, `.secret.*.json`, `.env`, `.env.*`, or raw tokens.
- Do not put the PAT in a command line, remote URL, PR body, commit message, issue, log, or screenshot.
- If `.secret.json` is missing or still contains the placeholder token, stop and ask the user to add the PAT. Do not silently fall back to another GitHub credential.

Use these helpers for authenticated GitHub and Git operations:

```powershell
.\tools\gh-project.ps1 pr status
.\tools\gh-project.ps1 pr create --base main --head zhiyi/example --title "Title" --body-file .\pr-body.md
.\tools\git-project.ps1 fetch origin
.\tools\git-project.ps1 pull --ff-only origin main
.\tools\git-project.ps1 push -u origin zhiyi/example
```

Plain local read-only Git commands such as `git status`, `git diff`, `git log`, and `git branch` may be run directly.

## Development Commands

After syncing Lovable source, install dependencies and run the app from this repository root:

```powershell
npm install
npm run dev
npm run build
npm run preview
```

For sync-script work, verify with:

```powershell
.\tools\test-sync-lovable.ps1
git diff --check
```

For UI/content changes, inspect desktop and mobile layouts when practical.

## Encoding Rules

- Keep source files UTF-8. Do not save web/code files as Windows "Unicode" / UTF-16.
- If a file contains NUL bytes, fix encoding before changing behavior in that file.
- Keep line endings consistent with `.gitattributes`.

## Design And Content

- Treat this as a business website first. Discuss positioning and information architecture before large implementation changes.
- Preserve the current Seraya hardware/system-integration positioning unless the user changes direction.
- Keep copy concise, credible, and procurement-friendly.
- Avoid fake case studies, fake inventory, fake legal pages, or placeholder claims in final public content.
- External stock/CDN assets should be treated as temporary unless explicitly approved for production use.
- Preserve the existing visual/content direction unless the user asks for a redesign or repositioning.

## Editing Workflow

- For migration/sync changes, read `tools\sync-lovable.ps1`, `tools\test-sync-lovable.ps1`, and this file before editing.
- For frontend changes, read the relevant `src/routes/*`, `src/styles.css`, `src/legacy-shim.css`, and relevant `public/` assets before editing.
- Keep diffs narrow. Do not reformat unrelated large files.
- Do not commit generated, downloaded, dependency, or local preview artifacts unless explicitly requested.
- Report verification honestly with the exact commands run and any remaining gaps.
