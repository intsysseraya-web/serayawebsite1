# Seraya Website Agent Guide

This repository is a static multi-page website for Seraya System Integration. Keep changes focused, conservative, and consistent with the current HTML/CSS/JavaScript structure.

## Project Shape

- Current shape: static HTML/CSS/JavaScript served from the repository root.
- Before introducing a framework, build system, CSS framework, or new production dependency, explain the trade-offs and get explicit approval.
- Main pages are `index.html`, `works.html`, `case-study.html`, and `about.html`.
- Shared styles live in `styles.css`; shared browser behavior lives in `script.js`.
- Deployment/config files include `_headers`, `wrangler.toml`, `netlify.toml`, and `DEPLOY-SPACESHIP.txt`.

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

- Local preview: `npm run preview`, which serves `http://127.0.0.1:8880/`.
- Alternate preview: `py -3 preview-server.py` after confirming the file is UTF-8.
- There is no current production build step. For site changes, verify with browser preview plus `git diff --check`.
- For UI/content changes, inspect desktop and mobile layouts when practical.

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

- Read the relevant HTML file, `styles.css`, and `script.js` before editing.
- Keep diffs narrow. Do not reformat unrelated large files.
- Do not commit generated, downloaded, or local preview artifacts unless explicitly requested.
- Report verification honestly with the exact commands run and any remaining gaps.
