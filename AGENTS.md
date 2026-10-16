# Seraya Website Agent Guide

This repository is the deployment and operating repository for the Seraya System Integration website. The website frontend is now synchronized from the Lovable/TanStack app in `H:\brep\baytech\seraya`; keep deployment credentials, repo-local scripts, and operational docs in this repository.

## Project Shape

- Current frontend shape: Lovable/TanStack Start + Vite + React source synchronized into this repo.
- This phase is frontend/local-run focused. Do not add Cloudflare Workers, full-stack server deployment, or production deployment changes unless the user explicitly asks for that phase.
- Source Lovable repo: `H:\brep\baytech\seraya`.
- Target deployment repo: `H:\brep\baytech\serayawebsite1`.
- Treat the Lovable source repo as a read-only upstream for this workspace. Do not commit, amend, branch, push, open PRs, or otherwise manage Git state in `H:\brep\baytech\seraya` unless the user explicitly asks for Lovable-source repo maintenance in this thread.
- Lovable-source repo changes are handled in separate conversations. In this repository, all Git delivery work belongs to `H:\brep\baytech\serayawebsite1`.
- Main app source lives in `src/`; public assets live in `public/`.
- Legacy static-root files such as `index.html`, `works.html`, `case-study.html`, `about.html`, `styles.css`, and `script.js` are retired after sync.
- Deployment/config files such as `_headers`, `wrangler.toml`, `netlify.toml`, and `DEPLOY-SPACESHIP.txt` are target-owned and should not be overwritten by the Lovable sync script.

## Lovable Sync Workflow

Use the repo-local sync script to bring Lovable frontend source into this repository:

```powershell
.\tools\sync-lovable.ps1 -DryRun
.\tools\sync-lovable.ps1 -Apply
```

For the routine "take Lovable main, sync it here, and create a local commit" flow, use:

```powershell
.\tools\sync-lovable-main.ps1
```

That wrapper requires a clean target repo, stashes dirty Lovable-source work if needed, pulls `origin/main` in `H:\brep\baytech\seraya`, runs the sync script, and creates a local commit in this deployment repo. Verify locally before pushing and deploying.

The script copies an explicit allowlist from `H:\brep\baytech\seraya`, including `src/`, `public/`, `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `components.json`, `bun.lock`, `bunfig.toml`, `package-lock.json` when present, and `.lovable/project.json`.

After copying, the script reapplies target-local deployment patches, including the Cloudflare Pages Nitro preset in `vite.config.ts`, the Linux native-dependency `prebuild` script in `package.json`, and local generated-directory ignores.

The script intentionally excludes generated or unrelated source material such as `node_modules/`, `dist/`, `.tanstack/`, `.nitro/`, `.wrangler/`, `old_site/`, `.git/`, and `.lovable/plan.md`.

The script must preserve target-owned files and folders, including `AGENTS.md`, `_headers`, `wrangler.toml`, `netlify.toml`, `DEPLOY-SPACESHIP.txt`, `.secret.example.json`, `.secret.json`, and `tools/*`.

The sync workflow may read files from the Lovable source repo, but it must not write, format, lint-fix, commit, or push anything in that source repo.

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

## Verification Tooling

This repo has two dependency-free verification harnesses. They are the expected way to
produce evidence for UI, content, navigation or RFQ changes — do not claim a layout or
interaction works without running them. Neither adds an npm dependency (they use Node's
built-in `fetch`/`WebSocket` and the locally installed Chrome/Edge via CDP).

```powershell
# 1) Start the dev server, then:
node tools/verify-site.mjs http://localhost:8081      # routes, content, product data, /api/rfq behaviour
node tools/verify-browser.mjs http://localhost:8081   # real-browser layout, tap targets, menu, form, screenshots
```

`verify-browser.mjs` writes full-page screenshots to `verification-evidence/` (created on
demand; treat the output as a local artifact, not something to commit).

What each harness is for:

- `tools/verify-site.mjs` — server-rendered content and HTTP behaviour: every route returns
  200, legacy 301s, page-internal `#` links resolve to real targets, declared product counts
  equal the cards actually rendered, single GPUs are absent from the systems catalogue,
  H100 / RTX PRO 6000 variants keep distinct specifications, quote links carry SKU context,
  and `/api/rfq` returns 422 / 429 / 503 / 200 for the corresponding inputs.
- `tools/verify-browser.mjs` — only real rendering can answer these: horizontal overflow at
  375/390/768/1024/1440 and at 200% zoom, anchor targets landing below the sticky header,
  44px tap targets, mobile drawer open/close/Escape/focus return, duplicate-submit
  suppression, and whether images decode without distortion.
- `tools/cdp-driver.mjs` — the shared Chrome DevTools Protocol driver both harnesses use.

When you add a page or change navigation, extend `verify-site.mjs` route and anchor lists so
the new surface is covered.

## Site Architecture Notes

- **Product data has one source per product kind.** GPU cards, SXM modules and accelerator
  SKUs live in `src/data/gpu-catalog.ts`. Complete systems, storage and networking live in
  `src/data/systems.ts`. Pages render from those; do not hand-write specs into a route.
  Counts shown to users must be computed from the data, never hard-coded.
- **GPU data is two layers.** `MODEL_FAMILIES` is what a customer recognises as a model
  ("H100", "RTX PRO 6000 Blackwell"); `GpuProduct` records are the quotable versions inside a
  family (H100 SXM / NVL / PCIe). Group by the explicit `familyId` field — never by truncating
  or fuzzy-matching product names. Public copy must distinguish the **model count** from the
  **version count**; do not use one number for both.
- **Specifications must be verifiable.** Every entry carries `verified` / `unverifiedNotes` /
  `specSource`. Anything not confirmed against vendor documentation stays marked as
  unverified and is surfaced as such in the UI — never fill a gap from memory.
- **Three page layers, three jobs.** The catalogue (`src/lib/buy-page.ts`) helps pick a model;
  a model detail page (`src/lib/model-detail.ts`) explains versions; the shared form
  (`src/lib/rfq-form.ts`) collects the requirement. Keep each layer to its own job: do not put
  full spec tables in catalogue cards or a full form in every card.
- **Model detail pages are data-driven and URL-stateful.** `renderModelDetail` is a reusable
  template over any family; `?version=<sku>` selects a version and `?version=none` is the
  explicit "help me choose" state. State lives in the URL (via TanStack Router
  `validateSearch`), so direct links, refresh and back all work. Never default to the first
  version in the array — an unselected state must stay unselected.
  Note: TanStack Start drops bare boolean-style search params (`?assist=1`) during SSR search
  normalisation, which is why the "help me choose" state uses an explicit `?version=none`.
- **RFQ has one pipeline.** `src/lib/rfq.ts` holds paths, field groups, validation, glossary and
  email templates; `src/lib/rfq-form.ts` renders the form; `src/lib/rfq.server.ts` does delivery;
  `src/lib/rfq-http.ts` serves `/api/rfq` from `src/server.ts`. The form shows five core fields
  by default with supplementary fields inside a collapsed `<details>`. `sku` and `config` are
  **hidden context**, never customer-facing fields. The form is a plain POST that works without
  JavaScript, and success is only ever shown after the server confirms delivery. With no
  delivery channel configured the endpoint returns 503 on purpose.
- **Styling layers, in load order:** `public/legacy/styles.css` (component CSS and tokens) →
  `src/legacy-shim.css` (brand overrides + page-level components) → `src/fixes.css` (the
  current repair layer). Add new cross-page rules to `src/fixes.css` and say which requirement
  they serve, rather than appending to the end of the 2,700-line legacy file. When overriding a
  legacy rule, match its specificity — `.reveal` does not beat `.reveal-ready .reveal`.
- **Anchors need the JS fix as well as CSS.** Pages are rendered through
  `dangerouslySetInnerHTML`, so the browser's own fragment scroll is lost when React replaces
  the HTML. `initHashScroll()` in `public/legacy/script.js` re-runs the scroll after hydration;
  `scroll-margin-top` alone is not sufficient.
- **Catalogue → form context** travels via `data-rfq-model` / `data-rfq-sku` / `data-rfq-config`
  on buttons, written into the form's hidden fields by `initCatalogRfqContext()`. Detail pages
  do not need this: they render the hidden fields server-side for the selected version.

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
