// Slowly turning cyclone drawn as text cells (after the "cyclone radar" reference).
// The centre is kept clear for the name; setFocus(angle) brightens one sector.

(function () {
  const TAU = Math.PI * 2;
  const N = 35; // cells across

  const hash = (i, j) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  function Cyclone(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const pixel = css.getPropertyValue("--pixel").trim() || "#d8c6a8";
    const accent = css.getPropertyValue("--accent").trim() || "#e0607e";
    const reduced = !!opts.reduced;

    const half = (N - 1) / 2;
    const cells = [];
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const x = (i - half) / half, y = (j - half) / half;
        const r = Math.hypot(x, y);
        if (r <= 1) cells.push({ i, j, x, y, r, th: Math.atan2(y, x), n: hash(i, j) });
      }

    let size = 0, dpr = 1, raf = 0, running = false;
    let clear = { w: 0, h: 0 }; // half-extent of the clear zone, in -1..1 units
    let focus = null, focusAngle = 0, focusAmt = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.floor(Math.min(rect.width, rect.height));
      canvas.width = canvas.height = Math.max(1, Math.floor(size * dpr));
      if (opts.clearEl && size) {
        const b = opts.clearEl.getBoundingClientRect();
        clear = { w: b.width / size + 0.06, h: b.height / size + 0.06 };
      }
      draw(performance.now());
    }

    function density(c, rot) {
      const phase = 2 * (c.th - rot) - 6.5 * c.r;
      const arm = Math.pow((Math.cos(phase) + 1) / 2, 1.6);
      const env = smooth(0.2, 0.42, c.r) * (1 - smooth(0.6, 0.84, c.r));
      return arm * env + (c.n - 0.5) * 0.2;
    }

    function draw(now) {
      if (!size) return;
      const t = now / 1000;
      const rot = reduced ? 0.5 : t * 0.035;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const g = size / N;
      ctx.font = `${g * 1.05}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const c of cells) {
        if (Math.abs(c.x) < clear.w && Math.abs(c.y) < clear.h) continue;
        const v = density(c, rot);
        if (v < 0.16) continue;

        let a = 0.5;
        if (!reduced) a += Math.sin(t * 1.6 + c.n * 40) * 0.08;
        let hot = false;
        if (focusAmt > 0.01) {
          const d = Math.abs(((c.th - focusAngle + Math.PI) % TAU + TAU) % TAU - Math.PI);
          if (d < 0.5) { a += (1 - d / 0.5) * 0.5 * focusAmt; hot = d < 0.22 && v > 0.62; }
        }
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = hot ? accent : pixel;
        // text cells, like a btop graph
        const glyph = v > 0.68 ? "■" : v > 0.48 ? "□" : v > 0.3 ? "▪" : "·";
        ctx.fillText(glyph, (c.i + 0.5) * g, (c.j + 0.5) * g);
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      const target = focus === null ? 0 : 1;
      focusAmt += (target - focusAmt) * 0.12;
      draw(now);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (reduced || running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    new ResizeObserver(resize).observe(canvas);
    if (opts.clearEl) new ResizeObserver(resize).observe(opts.clearEl);

    return {
      start, stop,
      setFocus(angle) {
        focus = angle;
        if (angle !== null) focusAngle = angle;
        if (reduced) { focusAmt = angle === null ? 0 : 1; draw(performance.now()); }
      },
    };
  }

  window.Cyclone = Cyclone;
})();
