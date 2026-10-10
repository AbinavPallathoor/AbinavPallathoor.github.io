// ASCII helpers: photo/text → character canvas, hand-drawn art, and an
// AsciiMorph-style collapse/expand transition between two pieces of art.

(function () {
  const RAMP = " .:-=+*#%@";
  const NOISE = "!<>-_\\/[]{}=+*^?#$%&01";
  const trim = (s) => s.replace(/^\n/, "");

  // Shown in the cyclone's eye when a section word is hovered.
  const ART = {
    about: String.raw`
  .------.
 /  o  o  \
|    __    |
 \  '--'  /
  '------'`,
    work: String.raw`
    ______
 __/______\__
|     []     |
|------------|
|____________|`,
    projects: String.raw`
   [=====]
  |  o o  |
  |  ===  |
 /|_______|\
   d     b`,
    awards: String.raw`
 .--------.
 \  1ST   /
  \      /
   '-..-'
    _||_
   [____]`,
    skills: String.raw`
.------------.
| > ros2 run |
| > fusion   |
| > make     |
'------------'`,
    contact: String.raw`
.------------.
|\          /|
| '.      .' |
|   '-..-'   |
'------------'`,
  };

  // fastfetch-style logos for the skills section.
  const SKILL_ART = {
    ros: String.raw`
        ___________
      /    ROS 2    \    ___
     /  _ _ _ _ _ _  \__/ o \
    |  |_|_|_|_|_|_|  |___ _/
     \_______________/
      ||  ||    ||  ||`,
    python: String.raw`
      .--------.
      | o      |
  .---'  .-----'---.
  |      |         |
  |   .--'   .-----'
  '---|      |
      |    o |
      '------'`,
    cpp: String.raw`
     ______
    / ____/   __      __
   / /     __/ /_  __/ /_
  / /___  /_  __/ /_  __/
  \____/   /_/     /_/`,
    unity: String.raw`
         ________
        /\       \
       /  \       \
      /    \_______\
      \    /       /
       \  /       /
        \/_______/`,
    sql: String.raw`
     .-~~~~~~~~~~-.
    (              )
    |~-.________.-~|
    |    SELECT    |
    |~-.________.-~|
    |     FROM     |
     '-.________.-'`,
    web: String.raw`
       /\          /\
      / /   ___   \ \
     / /   / /     \ \
     \ \  / /      / /
      \ \/_/      / /
       \/         \/`,
    mcu: String.raw`
      | | | | | | | |
    .-----------------.
   -|  ESP32 / STM32  |-
   -|    .-------.    |-
   -|    |:::::::|    |-
   -|    '-------'    |-
    '-----------------'
      | | | | | | | |`,
    pcb: String.raw`
  .--------------------.
  | o--.     .--[===]  |
  |    '--.  |    o    |
  | [==]--'--+---.  o  |
  |  o       '---'---o |
  |   [===]--------o   |
  '--------------------'`,
    fab: String.raw`
     ______________
    |  __________  |
    | |__________| |
     \            /
      \__________/
          \  /
     ======\/======
     ##############
     ##############`,
    fusion: String.raw`
        .-''''''-.
      .'  .----.  '.
     /   /      \   \
    |   |   ()   |   |
     \   \      /   /
      '.  '----'  .'
        '-......-'`,
    blender: String.raw`
           ______
      ____/      \
     /   /  .--.  \
     \__|  ( () )  |
        \   '--'  /
         '-.____.-'`,
    cura: String.raw`
      ______________
     /_____________/|
    /_____________/ |
   /_____________/ /|
  |_____________|/ /
  |_____________| /
  |_____________|/`,
  };

  const css = getComputedStyle(document.documentElement);
  const INK = css.getPropertyValue("--pixel").trim() || "#d8c6a8";

  // Sample a source (image or text) into a grid of intensities.
  function sample(src, cols, rows) {
    const c = document.createElement("canvas");
    c.width = cols; c.height = rows;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = "#000";
    x.fillRect(0, 0, cols, rows);
    if (src.img) {
      // object-fit: cover, compensating for tall character cells
      const iw = src.img.naturalWidth, ih = src.img.naturalHeight;
      const target = cols / (rows * 2);
      let sw = iw, sh = iw / target;
      if (sh > ih) { sh = ih; sw = ih * target; }
      x.drawImage(src.img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, cols, rows);
    } else {
      // text is drawn 2x tall then squashed, since character cells are ~2:1
      x.fillStyle = "#fff";
      x.textAlign = "center";
      x.textBaseline = "middle";
      let fs = rows * 2 * 0.8;
      x.font = `900 ${fs}px sans-serif`;
      while (x.measureText(src.text).width > cols * 0.86 && fs > 4) x.font = `900 ${(fs -= 1)}px sans-serif`;
      x.save();
      x.scale(1, 0.5);
      x.fillText(src.text, cols / 2, rows + fs * 0.06);
      x.restore();
    }
    const d = x.getImageData(0, 0, cols, rows).data;
    const cells = [];
    for (let i = 0; i < cols * rows; i++)
      cells.push((0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255);
    if (!src.img) return cells;
    // stretch contrast so dark and washed-out photos both read
    const sorted = [...cells].sort((p, q) => p - q);
    const lo = sorted[Math.floor(sorted.length * 0.04)], hi = sorted[Math.floor(sorted.length * 0.96)];
    const span = Math.max(0.05, hi - lo);
    return cells.map((l) => Math.pow(Math.min(1, Math.max(0, (l - lo) / span)), 1.15) * 0.92);
  }

  function AsciiCanvas(canvas, src, { cell = 6.5 } = {}) {
    const ctx = canvas.getContext("2d");
    let cells = [], cols = 0, rows = 0, cw = 0, ch = 0, dpr = 1, raf = 0;

    function layout() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      cols = Math.max(24, Math.min(140, Math.round(r.width / cell)));
      cw = r.width / cols;
      ch = cw * 2;
      rows = Math.max(4, Math.floor(r.height / ch));
      ch = r.height / rows;
      cells = sample(src, cols, rows);
      draw(0);
    }

    // noise: 0..1 fraction of cells shown as random glyphs
    function draw(noise) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${ch * 0.92}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = INK;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const l = cells[y * cols + x];
          let chr = RAMP[Math.min(RAMP.length - 1, Math.floor(l * RAMP.length))];
          if (noise && Math.random() < noise) chr = NOISE[(Math.random() * NOISE.length) | 0];
          if (chr === " ") continue;
          ctx.globalAlpha = 0.35 + l * 0.65;
          ctx.fillText(chr, x * cw, y * ch);
        }
      ctx.globalAlpha = 1;
    }

    function glitch(ms = 320) {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        draw(1 - p);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    if (src.img && !src.img.complete) src.img.addEventListener("load", layout, { once: true });
    new ResizeObserver(layout).observe(canvas);
    return { glitch, layout };
  }

  // AsciiMorph-style: collapse the old art from the outside in (edges turn to / and *),
  // then expand the new art from the centre out.
  function morphArt(pre, next, { duration = 520, reduced = false } = {}) {
    next = trim(next);
    const prev = pre.textContent;
    if (reduced || !prev.trim()) { pre.textContent = next; return; }
    cancelAnimationFrame(pre._morph);
    const grid = (s) => s.split("\n");
    const a = grid(prev), b = grid(next);
    const H = Math.max(a.length, b.length);
    const W = Math.max(...a.map((l) => l.length), ...b.map((l) => l.length));
    const cy = (H - 1) / 2, cx = (W - 1) / 2;
    const dist = (x, y) => Math.max(Math.abs(x - cx) / (cx || 1), Math.abs(y - cy) / (cy || 1));
    const at = (g, x, y) => (g[y] && g[y][x]) || " ";
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const out = [];
      for (let y = 0; y < H; y++) {
        let line = "";
        for (let x = 0; x < W; x++) {
          const d = dist(x, y);
          let c;
          if (t < 0.5) {
            const edge = 1 - t * 2; // shrinking radius
            c = d > edge ? " " : d > edge - 0.12 && at(a, x, y) !== " " ? (Math.random() < 0.5 ? "/" : "*") : at(a, x, y);
          } else {
            const edge = (t - 0.5) * 2; // growing radius
            c = d > edge ? " " : d > edge - 0.12 && at(b, x, y) !== " " ? (Math.random() < 0.5 ? "\\" : "*") : at(b, x, y);
          }
          line += c;
        }
        out.push(line.replace(/\s+$/, ""));
      }
      pre.textContent = t < 1 ? out.join("\n") : next;
      if (t < 1) pre._morph = requestAnimationFrame(step);
    };
    pre._morph = requestAnimationFrame(step);
  }

  window.Ascii = { ART, SKILL_ART, AsciiCanvas, morphArt, trim };
})();
