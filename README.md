# abinav.is-a.dev

A single-screen personal site styled as a TUI app: a text-cell cyclone home screen, then tiled panes that morph between sections
(GSAP Flip + ScrambleText) with WebTUI components. Plain HTML/CSS/JS; GSAP and WebTUI load from jsDelivr. Plain HTML/CSS/JS, so there's no build step.

## Edit content
Everything is in `js/data.js`. Social links live in `links` (shown on about and contact); awards link to the LinkedIn honors page (`links.honors`).
- `projects[...].url`: e.g. DUALS on Google Play, Stay in the Light on itch.io
- `projects[...].img`: a photo in `assets/projects/` (shown as live ASCII art, real photo on hover/tap);
  without one, `glyph` (a short word) is drawn as ASCII instead
- `work[...]`: `start`/`end` (`YYYY-MM`) drive the timeline; `logo` lives in `assets/logos/`
- `awards`: `[rank, title, detail, year]`; year `null` shows under "n/d"
- `skills[...]`: `art` picks a logo from `Ascii.SKILL_ART` in `js/ascii.js`; `usedIn` lists where the CV mentions it
- `banner`: generated with pyfiglet (`ansi_shadow` font)

## Run locally
    python3 -m http.server 8765   # then open http://localhost:8765

## Navigate
`1`–`6` or ←/→ switch sections, `esc` goes home. In lists (work, projects, skills) use ↑/↓ or `j`/`k`, or hover/tap.
On contact, `e` `l` `g` `c` open each link. Phones: tap, and swipe left/right between sections.

## Deploy (GitHub Pages + is-a.dev)
1. Create the repo `AbinavPallathoor.github.io` and push these files to `main`.
   Pages serves it at https://abinavpallathoor.github.io.
2. Fork https://github.com/is-a-dev/register and add `domains/abinav.json`:
   ```json
   {
     "owner": { "username": "AbinavPallathoor", "email": "abinav.pallathoor@gmail.com" },
     "records": { "CNAME": "abinavpallathoor.github.io" }
   }
   ```
   Open a PR with the live link and a screenshot.
3. After it merges: repo Settings → Pages → Custom domain `abinav.is-a.dev` → Enforce HTTPS.
   (The `CNAME` file in this repo already contains `abinav.is-a.dev`.)
