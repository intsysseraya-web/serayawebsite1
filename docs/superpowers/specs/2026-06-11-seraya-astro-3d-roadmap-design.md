# Seraya Astro 3D Roadmap Design

Date: 2026-06-11
Status: Approved for planning

## Purpose

Rebuild the Seraya System Integration website from a hand-maintained static HTML/CSS/JavaScript site into a modern, content-first Astro site with a full 3D technical-lab hero experience.

The goal is not to make a generic animated landing page. The goal is to preserve Seraya's real business substance, then present it as a high-end hardware integration lab: precise, technical, procurement-friendly, and memorable.

## Current Site Read

The current site has useful business material but the presentation is too close to a playful ecommerce/demo catalog.

Keep and elevate:

- `one accountable contact`: turn into procurement and warranty-route clarity.
- `batch-matched`, `burn-in`, `manifest`, and `build/test/ship`: make these the proof system.
- `RFQ to configuration to staging`: make this the core workflow.
- `quick-config`, `BYO parts`, and `trade-in`: translate into configure, integrate, validate, and recover/refurbish.
- Kuala Lumpur / regional hardware supply positioning.

Change or remove:

- Casual jokes that reduce procurement confidence.
- Demo catalog language such as "14 reference SKUs (demo)".
- Fake or illustrative proof, especially the case-study metric labelled "illustrative metrics".
- External temporary assets unless explicitly approved for production.

## Positioning

Selected direction: Technical Lab.

Seraya should read as a hardware integration lab for GPU workstations, edge nodes, rack systems, and validated supply programs. The site can be visually advanced and 3D-led, but every section must still support a practical buyer question:

- What can Seraya configure?
- How does Seraya reduce compatibility and warranty risk?
- What evidence does a buyer get before delivery?
- How does an RFQ become a tested, documented system?

## Recommended Stack

Use:

- Astro for the site framework.
- TypeScript for typed components, content schemas, and 3D code.
- Tailwind CSS for the styling system, using the current Tailwind/Astro Vite plugin path.
- React only as an Astro island dependency for the 3D hero if React Three Fiber is chosen.
- Three.js / React Three Fiber for the flagship 3D hero island.
- GSAP for DOM-level scroll choreography and section reveals.
- Playwright/browser screenshot verification for visual QA.

Why Astro:

- Astro's island architecture lets most pages render as static HTML while only specific interactive areas ship JavaScript.
- Astro content collections can manage structured content such as reference systems, program models, and proof modules with schema validation and TypeScript safety.
- Cloudflare Pages supports Astro with `npm run build` and `dist` as the build output.

References checked:

- Astro Islands: https://docs.astro.build/en/concepts/islands/
- Astro Content Collections: https://docs.astro.build/en/guides/content-collections/
- Cloudflare Pages Astro guide: https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/
- Tailwind with Astro: https://tailwindcss.com/docs/installation/framework-guides/astro
- GSAP accessible animation: https://gsap.com/resources/a11y/

## Architecture

Proposed structure:

```text
src/
  components/
    layout/
    sections/
    systems/
    proof/
    three/
  content/
    systems/
    programs/
    proof/
  data/
  layouts/
  pages/
    index.astro
    systems.astro
    method.astro
    programs.astro
    company.astro
    contact.astro
  styles/
    global.css
  scripts/
public/
  assets/
    brand/
    media/
    fallbacks/
```

Page model:

- Home: 3D technical-lab hero, proof strip, capability modules, integration method, reference systems, RFQ.
- Systems: reference configurations, not fake inventory. Each entry should make clear that final configuration is RFQ-based.
- Method: RFQ intake, compatibility matrix, sourcing, staging, burn-in, manifest, handoff.
- Programs: program models and real proof only. If a case is not verifiable, label it as a program model instead of a case study.
- Company: Kuala Lumpur base, regional demand, trading-led integration partner, contact route.
- Contact: RFQ guidance, email-first workflow, what information to send.

## 3D Experience Rules

The 3D hero is the flagship moment, but it must not control the whole site.

Rules:

- The page must still communicate without WebGL.
- Provide a static hero fallback image.
- Lazy load the 3D island.
- Respect `prefers-reduced-motion`.
- Provide a reduced-motion or no-3D mode for users and devices that need it.
- Avoid flashing, large forced camera sweeps, and motion that blocks reading.
- Set mobile performance gates before launch.
- Verify the canvas is nonblank in browser screenshots.

Initial scene concept:

- A diagnostic hardware bench rather than a literal stock photo.
- Visual vocabulary: GPU board geometry, circuit traces, airflow/thermal field, status readouts, compatibility matrix, bench-test glow.
- The scene should support the copy instead of becoming decorative noise.

## Visual System

The design should move away from generic ecommerce cards and toward a precise technical-lab system.

Core language:

- Dark lab surfaces, restrained contrast, sharp technical spacing.
- Purple accent can remain but should be used as instrumentation, not as a one-note purple theme.
- Grids, spec rows, protocol steps, validation states, and component manifests.
- Strong first viewport, then dense but scannable buyer information.
- Avoid fake dashboards, fake metrics, fake inventory, and fake certifications.

## Content Adaptation

Existing content should be translated rather than discarded.

Mapping:

- "Friendly neighborhood system integrator" -> hardware integration lab with direct human accountability.
- "Quick-config towers" -> validated reference configurations.
- "BYO parts" -> customer-supplied component integration.
- "Old gear? We'll take it" -> recovery, refurbish, responsible processing.
- "Same-day response" -> responsive RFQ intake.
- "One accountable contact" -> single warranty and coordination path.
- "Build exactly what you need" -> custom compatibility and configuration support.
- "Batch-matched" -> controlled sourcing and manifest discipline.
- "Tell us / recommend / build-test-ship" -> RFQ to validation pipeline.

Content rules:

- Keep copy concise and credible.
- Use buyer-focused headings.
- Keep RFQ as the conversion model.
- Do not create fake checkout, fake stock status, fake case studies, fake metrics, or placeholder claims.
- If a page uses a reference configuration, call it a reference configuration.
- If a page uses an illustrative program, call it a program model.

## Migration Strategy

Selected strategy: Parallel V2 build.

Do not mutate the current site into Astro piece by piece in production shape. Build the Astro version cleanly in a branch/worktree, keep the current site available, then cut over only after gates pass.

Rejected options:

- Incremental wrapper: lower disruption but preserves too much of the current static structure.
- Big-bang rewrite: fast but mixes framework migration, content rewrite, 3D, and deployment risk.

## Roadmap

Phase 1: Foundation

- Create the Astro project structure.
- Add TypeScript and Tailwind.
- Add layout, metadata, route, and asset conventions.
- Keep deployment simple: `npm run build` outputs `dist`.
- Update Cloudflare/Netlify configuration only after the new build path is proven.

Gate:

- Build succeeds.
- Routes exist for the current public pages.
- No production secrets are introduced.
- Old assets and pages are not deleted until the replacement path is verified.

Phase 2: Content model

- Convert current pages into the new IA.
- Define systems/programs/proof content collections or equivalent typed data.
- Replace demo catalog language with reference configuration language.
- Replace illustrative case-study claims with program model wording unless real proof exists.

Gate:

- Every public claim has a source, is visibly qualified, or is removed.
- RFQ path is clear from every major page.

Phase 3: Visual system

- Build the technical-lab component system.
- Define tokens, surfaces, section rhythm, cards, spec rows, proof strips, and RFQ modules.
- Localize or replace external temporary visual assets.

Gate:

- Desktop and mobile screenshots show coherent hierarchy.
- Text does not overlap or overflow.
- The site still reads as a business website, not a game or generic AI landing page.

Phase 4: Full 3D hero

- Prototype the hero island.
- Decide between vanilla Three.js and React Three Fiber based on bundle/performance/maintainability evidence.
- Add fallback image and reduced-motion behavior.
- Connect scroll choreography only after base scene performance is acceptable.

Gate:

- Canvas renders on desktop.
- Mobile fallback is acceptable.
- Reduced-motion mode avoids heavy animation.
- No blank or broken hero in browser verification.

Phase 5: QA and launch

- Run build checks.
- Run accessibility and SEO checks.
- Verify desktop, tablet, mobile, and narrow desktop widths.
- Verify Cloudflare/Netlify build settings.
- Publish by PR using the repo-local PAT helpers when GitHub authentication is needed.

Gate:

- Build passes.
- Visual QA passes.
- Main pages return expected status.
- `dist` build output is deployable.

## Working Rules

- Do not introduce the framework until the spec and plan are approved.
- Keep the current site available until the replacement build is verified.
- Keep source files UTF-8.
- Fix `script.js` encoding before editing or migrating behavior from it.
- Do not commit `.secret.json`, `.env`, raw tokens, or local preview artifacts.
- Add `.superpowers/` to the ignored local-artifact policy before any implementation PR if the visual companion remains in use.
- Treat external CDN/stock assets as temporary unless explicitly approved.
- Use local browser verification for meaningful UI changes.

## Skill Stack

Recommended skills to install or use for the implementation plan:

- `anthropics/skills@frontend-design`
- `astrolicious/agent-skills@astro`
- `wshobson/agents@tailwind-design-system`
- `greensock/gsap-skills@gsap-core`
- `greensock/gsap-skills@gsap-scrolltrigger`
- `greensock/gsap-skills@gsap-performance`
- `cloudai-x/threejs-skills@threejs-fundamentals`
- `cloudai-x/threejs-skills@threejs-animation`
- `addyosmani/web-quality-skills@web-quality-audit`
- `coreyhaines31/marketingskills@seo-audit`

Use them in this order:

1. Frontend/design and Astro foundation.
2. Tailwind design-system rules.
3. Three.js/R3F prototype.
4. GSAP choreography.
5. SEO/web-quality audit before launch.

## Open Decisions For Implementation Planning

- Choose vanilla Three.js or React Three Fiber after a small prototype compares bundle size, code clarity, and mobile behavior.
- Decide whether `Programs` is a standalone page or folded into `Method` until real proof material exists.
- Decide whether to preserve old URLs exactly or redirect `works.html` to `/systems/` and `case-study.html` to `/programs/`.
- Decide which current external images/logos can be approved, replaced, or generated as production assets.
