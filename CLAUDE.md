# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal portfolio (abinav.is-a.dev): sections of project cards (Hardware, Software, Gamedev) that expand in place when clicked. Hardware cards show a 3D model on a turntable; Gamedev cards show a CD jewel case that cross-fades into the trailer when opened. Software is a placeholder. Vite + TypeScript + three.js + GSAP (Flip, ScrollTo). No framework, no tests, no linter.

## Commands

- `npm run dev`: Vite dev server
- `npm run build`: `tsc --noEmit` type-check, then `vite build` into `dist/`. This is the only check there is, so run it after changes.
- `npm run preview`: serve the built `dist/`

Deploy: pushing to `main` runs `.github/workflows/deploy.yml` (Node 22, `npm ci && npm run build`, uploads `dist/` to GitHub Pages). There is no `vite.config`, so the base path is `/`; asset URLs are still built with `import.meta.env.BASE_URL` and should stay that way.

## Architecture

- `index.html` holds the static page shell (header, section headings, footer); `src/main.ts` builds the cards into `#hardware` and `#gamedev` at runtime. `cardShell()` builds the shared card markup; each section fills the viewer differently.
- `src/projects.ts` is the hardware content: an array of `Project` objects, sorted newest first by `date` (`YYYY`, `YYYY/MM` or `YYYY/MM/DD`; a bare year sorts after that year's months; undated go last). `model.rotation` is degrees with y up (CAD exports are often z-up, hence `[-90, 0, 0]`), `model.scale` is relative to the auto-fit. `doc()` links point into `public/docs/`.
- `src/stage.ts` (`Stage`): **one shared offscreen WebGLRenderer** for all cards. Each card gets its own `Scene`/camera and a plain 2D `<canvas>`; every frame the renderer draws a card's scene into the bottom-left of the shared buffer and `drawImage`s it into that card's canvas. This keeps a single WebGL context while letting models live in normal DOM stacking (cards overlap during Flip animations). Models load lazily via `IntersectionObserver`, are centered and scaled to a unit bounding sphere, and decode with Draco from `public/draco/`. Off-screen viewers are skipped.
- `src/games.ts` is the gamedev content, shown in array order rather than by date (`Game`: cover, back-cover screenshot and copy, trailer, case colour; files in `public/games/<id>/`). `src/cdcase.ts` (`CdCase`) builds the case from CSS 3D faces (not three.js, so the text stays DOM). Geometry is in case units (142 x 125, a real jewel case in mm), one unit = `--u` in CSS = `U` in TS; keep them in sync. A shared `gsap.ticker` callback writes each visible case's transform every frame and rescales it to its viewer's current size, which is how it follows the card's Flip animation. `open()` starts the trailer immediately (muted by default; inside the click, so sound is allowed once the user turns it on) and cross-fades the case out and the video in (a game with no trailer gets a slideshow of its `gallery` screenshots instead; `portrait: true` marks a vertical phone trailer, which `.card--portrait` lays out beside the text); `close()` reverses it. `main.ts` calls them from `setOpen`. Don't put `opacity`, `filter` or `overflow` on the `preserve-3d` containers (`.cd-spin`, `.cd-slab`): that flattens the 3D.
- `src/main.ts` open/close logic (`setOpen`): GSAP Flip animates cards, dates and viewers, but the `.card-body` text block is deliberately *not* flipped (that would re-wrap text every frame). It is pinned absolutely at its final position/width and slid from its old offset instead. Grid heights are held by easing `min-height` from a plain tween, set before `Flip.from`. Never let a grid lose its height mid-transition (a CSS tween briefly clears the inline value on start), or the page shortens and the browser clamps the scroll position. And don't pin `height` instead: Flip records the end layout at that moment, and a fixed grid height squashes the open card's row (cards are `overflow: hidden`, so their row may shrink). The open card spans the full grid width and stays in its original row via the `--open-row` CSS variable set on the grid (not the card, because Flip clears the card's inline styles). Window scroll is tweened alongside. Interrupted animations are killed and restarted from current positions. Open state is mirrored to the URL hash (`/#axis-x` deep-links to a card). `prefers-reduced-motion` makes durations 0 and stops the turntable.
- A drag on a viewer spins the model or case, and `main.ts` suppresses the click that would otherwise toggle the card. Clicks inside an open card only close it from the viewer or ✕, so text stays selectable.
- `src/squiggle.ts`: seeded-PRNG hand-drawn SVG zigzag, redrawn only when the viewport width changes.

## Assets and legacy paths

- Trailers are H.264 MP4 (no ffmpeg here; macOS `avconvert -p Preset1280x720` works) and load only when a game card is hovered or opened.
- `public/models/*.glb` are Draco-compressed copies. The source CAD exports (`.fbx` etc.) live in `/Assets/`, which is gitignored. Compress with Draco only; never decimate/simplify meshes.
- `public/tui/` (previous TUI portfolio) and `public/old/` (the site before that) are served as-is at `/tui/` and `/old/`; they are standalone static sites, not part of the TS build.
- Keep these at their existing URLs: `/assets/Abinav_Pallathoor_CV.pdf`, `/app-ads.txt`, `/googlee03674d1f2e23b86.html`, and the `google-site-verification` meta tag in `index.html`.
