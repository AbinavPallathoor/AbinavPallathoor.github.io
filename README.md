# abinav.is-a.dev

Portfolio: a plain-looking grid of project cards, each with a 3D model on a turntable. Click a card to open its details.

Vite + TypeScript + three.js + GSAP (Flip). Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Edit content
- Projects: `src/projects.ts`. Each project has a `date` (`YYYY`, `YYYY/MM` or `YYYY/MM/DD`). Cards sort newest first, and undated ones go last.
- Models: compressed GLBs in `public/models/` (Draco). `model.rotation` (degrees, y is up) and `model.scale` fix orientation and size.
- Documents linked from cards: `public/docs/`.

## Run locally
    npm install
    npm run dev

## Also served
- `/tui/`: the previous TUI portfolio
- `/old/`: the site before that
- `/assets/Abinav_Pallathoor_CV.pdf`, `app-ads.txt`, and the Search Console verification file, all at their old paths
