(function () {
  const S = window.SITE;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover)").matches;
  const G = window.gsap;
  const FX = !!(G && window.Flip && window.ScrambleTextPlugin) && !reduced;
  if (FX) G.registerPlugin(window.Flip, window.ScrambleTextPlugin);
  const CHARS = "!<>-_\\/[]{}=+*^?#$%&01";
  const { Ascii } = window;

  // ---------- text fx ----------
  // Elements with class "t" hold plain text only; they are what gets scrambled.
  function scramble(el, text, { duration, delay = 0 } = {}) {
    if (!FX) { el.textContent = text; return; }
    G.killTweensOf(el);
    G.to(el, {
      duration: duration ?? Math.min(0.9, 0.2 + text.length * 0.01),
      delay,
      ease: "none",
      scrambleText: { text, chars: CHARS, speed: 0.9 },
    });
  }
  function revealText(root, base = 0) {
    root.querySelectorAll(".t").forEach((el, i) => {
      const text = el.dataset.t ?? (el.dataset.t = el.textContent);
      if (!FX) return;
      el.textContent = "";
      scramble(el, text, { delay: base + Math.min(i * 0.025, 0.6) });
    });
  }
  function scrambleOut(root) {
    const els = [...root.querySelectorAll(".t")].slice(0, 80);
    if (!FX || !els.length) return Promise.resolve();
    return new Promise((done) =>
      G.to(els, { duration: 0.14, ease: "none", scrambleText: { text: " ", chars: "░▒▓/\\|" }, onComplete: done })
    );
  }
  // ---------- media: ascii ⇄ photo, with a loader ----------
  function mediaHTML({ img, alt }) {
    const file = img ? img.split("/").pop() : "";
    return `<canvas aria-hidden="true"></canvas>
      ${img ? `<img src="${esc(img)}" alt="${esc(alt || "")}">
      <div class="loader"><span is-="spinner" variant-="dots"></span><span>${esc(file)}</span><span is-="progress" style="--progress-value:0"></span><span class="pct">0%</span></div>
      <span class="hint">${canHover ? "hover: ascii" : "tap: ascii"}</span>` : ""}`;
  }
  function mountMedia(frame, text) {
    const img = frame.querySelector("img");
    const a = Ascii.AsciiCanvas(frame.querySelector("canvas"), img ? { img } : { text });
    if (!img) return;
    const loader = frame.querySelector(".loader");
    const run = () => {
      if (!FX) { img.style.clipPath = "none"; loader.classList.add("done"); return; }
      const prog = loader.querySelector("[is-~=progress]"), pct = loader.querySelector(".pct"), o = { p: 0 };
      a.glitch(700);
      G.timeline()
        .to(o, { p: 100, duration: 0.9, ease: "steps(20)", onUpdate: () => {
          prog.style.setProperty("--progress-value", o.p);
          pct.textContent = Math.round(o.p) + "%";
        } })
        .fromTo(img, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "steps(14)" }, 0.35)
        .add(() => loader.classList.add("done"));
    };
    img.complete && img.naturalWidth ? run() : img.addEventListener("load", run, { once: true });
    const on = () => { frame.classList.add("ascii-mode"); a.glitch(); };
    const off = () => frame.classList.remove("ascii-mode");
    if (canHover) { frame.addEventListener("pointerenter", on); frame.addEventListener("pointerleave", off); }
    else frame.addEventListener("click", () => (frame.classList.contains("ascii-mode") ? off() : on()));
  }

  // ---------- work timeline helpers ----------
  const T0 = 2021, SPAN = (2030 - T0) * 12;
  const months = (ym) => { const [y, m] = ym.split("-").map(Number); return (y - T0) * 12 + (m - 1); };
  const pct = (m) => (Math.max(0, Math.min(SPAN, m)) / SPAN) * 100;
  const now = new Date();
  const nowPct = pct((now.getFullYear() - T0) * 12 + now.getMonth());
  const pad = (n) => String(n).padStart(2, "0");

  // ---------- awards helpers ----------
  const RANKS = ["1ST", "TOP 10", "3RD", "4TH", "AWARD"];
  const tuiBar = (n, max, width = 24) => {
    const f = Math.round((n / max) * width);
    return "█".repeat(f) + "░".repeat(width - f);
  };
  const badge = (rank) => `<span is-="badge" ${rank === "1ST" ? "" : 'variant-="foreground2"'}>${esc(rank)}</span>`;

  // ---------- contact helpers ----------
  const L = S.links;
  const LINKS = [
    { key: "e", label: "email", value: L.email, href: "mailto:" + L.email, act: "copy", copy: L.email, wide: true },
    { key: "l", label: "linkedin", value: "abinav-pallathoor", href: L.linkedin, act: "open ↗" },
    { key: "g", label: "github", value: "AbinavPallathoor", href: L.github, act: "open ↗" },
    { key: "y", label: "youtube", value: "@Abinav.P", href: L.youtube, act: "open ↗" },
    { key: "i", label: "itch.io", value: "abinav-pallathoor", href: L.itch, act: "open ↗" },
    { key: "p", label: "printables", value: "@AbinavPallat_1000678", href: L.printables, act: "open ↗" },
    { key: "c", label: "cv", value: "Abinav_Pallathoor_CV.pdf", href: L.cv, act: "download ↓", download: true },
  ];
  // figlet "small" glyphs shown in each contact tile
  const GLYPH = {
    e: "  ____  \n / __ \\ \n/ / _` |\n\\ \\__,_|\n \\____/",
    l: " _      \n(_)_ _  \n| | ' \\ \n|_|_||_|",
    g: "      _    \n __ _| |_  \n/ _` | ' \\ \n\\__, |_||_|\n|___/",
    c: " ____ __\n/ _\\ V /\n\\__|\\_/",
    y: "      _   \n _  _| |_ \n| || |  _|\n \\_, |\\__|\n |__/",
    i: " _ _   \n(_) |_ \n| |  _|\n|_|\\__|",
    p: " _ __ _ _ \n| '_ \\ '_|\n| .__/_|  \n|_|",
  };
  const dubaiTime = () =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

  // ---------- sections ----------
  // Each section fills pane A and (optionally) pane B. Sections with a list get
  // keyboard/hover selection via `list` (selector for rows) and `detail(i)`.
  const sections = [
    {
      key: "about",
      titles: () => ["me.jpg", "about.md"],
      hints: () => (canHover ? "hover photo: ascii view" : "tap photo: ascii view"),
      A: () => `<div class="media about-photo fill">${mediaHTML({ img: S.photo, alt: "Abinav at his desk, working on a circuit" })}</div>
        <div class="about-links">
          <div class="label t">find me</div>
          <div class="socials">${LINKS.filter((l) => l.key !== "c")
            .map((l) => `<a href="${esc(l.href)}"${l.copy ? "" : ' target="_blank" rel="noopener"'}><span class="k t">${l.label}</span><span class="t">${esc(l.value)}</span></a>`)
            .join("")}
            <a href="${esc(L.portfolioVideo)}" target="_blank" rel="noopener"><span class="k t">video</span><span class="t">maker portfolio ↗</span></a></div>
        </div>`,
      B: () => `<div class="about-b fill spread">
        <p class="t bio">${esc(S.bio)}</p>
        <dl class="kv">${S.about.map(([k, v]) => `<dt class="t">${esc(k.toLowerCase())}</dt><dd class="t">${esc(v)}</dd>`).join("")}</dl>
        <div>
          <div class="label t">highlights</div>
          <div class="hl">${S.highlights
            .map(([r, t, m]) => `${badge(r)}<b class="t">${esc(t)}</b><span class="meta t">${esc(m)}</span>`)
            .join("")}</div>
        </div></div>`,
      mount: () => mountMedia($("bodyA").querySelector(".media")),
    },
    {
      key: "work",
      titles: (i = 0) => ["timeline · ↑↓ to inspect", "inspect › " + S.work[i].short],
      hints: () => (canHover ? "↑↓ j k / hover a row: inspect" : "tap a row: inspect"),
      list: ".g-row",
      count: S.work.length,
      A: () => {
        const years = [];
        for (let y = T0; y < 2030; y++) years.push(`<span style="left:${pct((y - T0) * 12)}%">'${String(y).slice(2)}</span>`);
        return `<div class="gantt fill">
          <div class="g-axis"><span></span><span class="g-track">${years.join("")}</span></div>
          <div class="g-rows">
          ${S.work.map((w, i) => `<button class="g-row" data-i="${i}" aria-selected="${i === 0}">
              <span class="g-label"><span class="i"><span>${i + 1}</span></span><img src="${esc(w.logo)}" alt="">
                <span class="nm t">${esc(w.short)}</span>
                <span class="role t">${esc(w.title)}</span></span>
              <span class="g-track">
                <i class="g-bar ${w.kind}" style="left:${pct(months(w.start))}%;width:${pct(months(w.end) + 1) - pct(months(w.start))}%"></i>
                <i class="g-now" style="left:${nowPct}%"></i>
                ${i === 1 ? '<span class="g-hint" id="gHint">◀ hover or tap a row</span>' : ""}
              </span>
            </button>`).join("")}
          </div>
        </div>
        <div class="legend"><span><i class="sw work"></i>work</span><span><i class="sw edu"></i>education</span><span><i class="sw now"></i>today</span></div>`;
      },
      detail: (i) => {
        const w = S.work[i];
        return `<div class="inspect"><div>
            <div class="inspect-head"><img src="${esc(w.logo)}" alt="">
              <div><h2 class="t big">${esc(w.title)}</h2><div class="meta t">${esc(w.when)} · ${esc(w.org)}</div></div></div>
            ${w.points.length ? `<ul class="bullets">${w.points.map((p) => `<li class="t">${esc(p)}</li>`).join("")}</ul>` : ""}
          </div>
          ${w.related && w.related.length ? `<div class="related"><div class="label t">related</div><ul>${w.related
            .map((r) => { const [kind, ...rest] = r.split(" · "); return `<li><span class="kind t">${esc(kind)}</span> <span class="t">${esc(rest.join(" · "))}</span></li>`; })
            .join("")}</ul></div>` : ""}
        </div>`;
      },
    },
    {
      key: "projects",
      titles: (i = 0) => [`projects (${S.projects.length})`, S.projects[i].id.toLowerCase().replace(/\s+/g, "-")],
      hints: () => (canHover ? "↑↓ j k / hover: preview · photo hover: ascii" : "tap a project: preview"),
      list: ".row",
      count: S.projects.length,
      A: () => `<div class="rows compact">${S.projects
        .map((p, i) => `<button class="row" data-i="${i}" aria-selected="${i === 0}">
            <span class="i"><span>${pad(i + 1)}</span></span><span class="t">${esc(p.id)}</span><span class="tag t">${esc(p.tag.toLowerCase())}</span><span class="sub t">${esc(p.text)}</span></button>`)
        .join("")}</div>`,
      detail: (i) => {
        const p = S.projects[i];
        return `<div class="media proj-media fill">${mediaHTML({ img: p.img, alt: p.id })}</div>
          <div class="proj-head"><h2 class="t big">${esc(p.id)}</h2>${badge(p.tag)}</div>
          <p class="t" style="margin-top:.3lh">${esc(p.text)}</p>
          ${p.url ? `<p style="margin-top:.3lh"><a class="proj-link" href="${esc(p.url)}" target="_blank" rel="noopener">open ↗</a></p>` : ""}`;
      },
      mountDetail: (i) => mountMedia($("bodyB").querySelector(".media"), S.projects[i].glyph || S.projects[i].id),
    },
    {
      key: "awards",
      titles: () => ["stats", `awards (${S.awards.length}) · linkedin ↗`],
      hints: () => (canHover ? "hover: cross-highlight · click: open on LinkedIn" : "tap an award: open on LinkedIn"),
      A: () => {
        const count = (r) => S.awards.filter((a) => a[0] === r).length;
        const max = Math.max(...RANKS.map(count));
        const cols = [2021, 2022, 2023, 2024, 2025, 2026, null].map((y) => {
          const items = S.awards.map((a, k) => [a, k]).filter(([a]) => a[3] === y);
          return `<div class="yc"><div class="yc-stack">${items
            .map(([a, k]) => `<button class="yc-dot ${a[0] === "1ST" ? "gold" : ""}" data-k="${k}" aria-label="${esc(a[1])}"></button>`)
            .join("")}</div><span>${y === null ? "n/d" : "'" + String(y).slice(2)}</span></div>`;
        }).join("");
        return `<div class="label t">by placing</div>
          ${RANKS.map((r) => `<div class="tally-row"><span class="lbl t">${r.toLowerCase()}</span><span class="tui-bar t">${tuiBar(count(r), max)}</span><b class="t">${count(r)}</b></div>`).join("")}
          <div class="label t" style="margin-top:1lh">by year</div>
          <div class="years fill">${cols}</div>
          <div class="legend" style="padding-left:0"><span>■ 1st place</span><span>□ other</span></div>`;
      },
      B: () => `<div class="aw-rows">${S.awards
        .map(([r, t, m], k) => `<a class="aw-row" data-k="${k}" href="${esc(L.honors)}" target="_blank" rel="noopener" title="Open on LinkedIn">${badge(r)}<b class="t">${esc(t)} <span class="ext">↗</span></b><span class="meta t">${esc(m)}</span></a>`)
        .join("")}</div>`,
      mount: () => {
        const root = $("panes");
        const hl = (k, on) => root.querySelectorAll(`[data-k="${k}"]`).forEach((el) => el.classList.toggle("hl", on));
        root.querySelectorAll("[data-k]").forEach((el) => {
          el.addEventListener("pointerenter", () => hl(el.dataset.k, true));
          el.addEventListener("pointerleave", () => hl(el.dataset.k, false));
          el.addEventListener("focus", () => hl(el.dataset.k, true));
          el.addEventListener("blur", () => hl(el.dataset.k, false));
          if (el.classList.contains("yc-dot")) el.addEventListener("click", () => window.open(L.honors, "_blank", "noopener"));
        });
      },
    },
    {
      key: "skills",
      titles: () => ["skills", "fastfetch"],
      hints: () => (canHover ? "↑↓ j k / hover a skill" : "tap a skill"),
      list: ".row",
      count: S.skills.length,
      A: () => {
        let html = "", last = "";
        S.skills.forEach((s, i) => {
          if (s.group !== last) {
            last = s.group;
            html += `<div class="group-label t">${{ SW: "software", HW: "hardware", DS: "design" }[s.group]}</div>`;
          }
          html += `<button class="row" data-i="${i}" aria-selected="${i === 0}"><span class="i"><span>${pad(i + 1)}</span></span><span class="t">${esc(s.name)}</span><span></span><span class="sub t">${esc(s.sub)}</span></button>`;
        });
        return `<div class="rows compact">${html}</div>`;
      },
      detail: (i) => {
        const s = S.skills[i];
        const group = { SW: "software", HW: "hardware", DS: "design" }[s.group];
        const used = s.usedIn || [];
        return `<div class="ff">
          <pre class="ff-art" id="ffArt"></pre>
          <div class="ff-info">
            <div class="ff-user"><span class="acc t">abinav</span>@<span class="acc t">robotics</span></div>
            <div class="dim">─────────────────</div>
            <dl class="kv">
              <dt class="t">skill</dt><dd class="t">${esc(s.name)}</dd>
              <dt class="t">stack</dt><dd class="t">${esc(s.sub)}</dd>
              <dt class="t">group</dt><dd class="t">${group}</dd>
              ${used.map((u, k) => `<dt class="t">${k ? "" : "used in"}</dt><dd class="t">${esc(u)}</dd>`).join("")}
            </dl>
            <div class="ff-colors" aria-hidden="true">${["#1e1212", "#4a302b", "#a08e7b", "#d8c6a8", "#ecdfc8", "#e0607e"].map((c) => `<i style="background:${c}"></i>`).join("")}</div>
          </div></div>`;
      },
      mountDetail: (i, prevArt) => {
        const pre = $("ffArt");
        pre.textContent = prevArt || "";
        Ascii.morphArt(pre, Ascii.SKILL_ART[S.skills[i].art], { reduced: !FX });
      },
    },
    {
      key: "contact",
      titles: () => ["links", "compose"],
      hints: () => (canHover ? LINKS.map((l) => `<kbd>${l.key}</kbd> ${l.label}`).join(" · ") : "tap a link · write below"),
      A: () => `<div class="links">${LINKS.map((l) => `
          <a class="link-row${l.wide ? " wide" : ""}" href="${esc(l.href)}" ${l.download ? "download" : 'target="_blank" rel="noopener"'} data-key="${l.key}">
            <span class="k">[${l.key}]</span><span class="lbl t">${l.label}</span><span class="act dim t">${l.act}</span><pre class="glyph" aria-hidden="true">${esc(GLYPH[l.key])}</pre><span class="val t">${esc(l.value)}</span></a>`).join("")}
        </div>
        <dl class="kv contact-meta">
          <dt class="t">local time</dt><dd><span class="t" id="dxb">${dubaiTime()}</span> <span class="dim">Dubai, GST</span></dd>
          <dt class="t">status</dt><dd class="t">open to work · remote</dd>
        </dl>`,
      B: () => `<form class="compose" id="compose">
          <label><span class="t">name</span><input name="name" type="text" autocomplete="name" placeholder="your name"></label>
          <label><span class="t">subject</span><input name="subject" type="text" placeholder="internship / project / hello"></label>
          <label class="grow"><span class="t">message</span><textarea name="message" placeholder="type here…"></textarea></label>
          <div class="send-row"><button class="send" type="submit">send ⏎</button>
          <span class="note t">opens your mail app with this filled in · nothing is stored</span></div>
        </form>`,
      mount: () => {
        $("bodyA").querySelectorAll(".link-row").forEach((a) => {
          const l = LINKS.find((x) => x.key === a.dataset.key);
          if (!l.copy) return;
          a.addEventListener("click", async (e) => {
            e.preventDefault();
            const act = a.querySelector(".act");
            try { await navigator.clipboard.writeText(l.copy); act.textContent = "copied ✓"; }
            catch (err) { location.href = l.href; }
            setTimeout(() => (act.textContent = l.act), 1600);
          });
        });
        $("compose").addEventListener("submit", (e) => {
          e.preventDefault();
          const f = new FormData(e.target);
          const body = `${f.get("message") || ""}\n\n— ${f.get("name") || ""}`;
          location.href = `mailto:${L.email}?subject=${encodeURIComponent(f.get("subject") || "Hello")}&body=${encodeURIComponent(body)}`;
        });
      },
    },
  ];
  const COUNT = sections.length;

  // ---------- shell ----------
  const panes = $("panes"), paneA = $("paneA"), paneB = $("paneB"), bodyA = $("bodyA"), bodyB = $("bodyB");
  const tabs = $("tabs"), orbit = $("orbit"), banner = $("banner");
  const BANNER = S.banner.join("\n");
  banner.textContent = BANNER;
  const portrait = matchMedia("(max-aspect-ratio: 4/5)");
  const cyclone = window.Cyclone($("cyclone"), { reduced, clearEl: $("heroId") });

  const ind = document.createElement("span");
  ind.className = "tab-ind";
  tabs.appendChild(ind);
  const homeTab = document.createElement("button");
  homeTab.className = "tab home-tab";
  homeTab.innerHTML = `<span class="n">0</span>home`;
  homeTab.addEventListener("click", () => goHome());
  tabs.appendChild(homeTab);

  sections.forEach((s, i) => {
    const t = document.createElement("button");
    t.className = "tab";
    t.innerHTML = `<span class="n">${i + 1}</span>${s.key}`;
    t.addEventListener("click", () => go(i));
    tabs.appendChild(t);
    s.tab = t;

    const angle = -Math.PI / 2 + (i * Math.PI * 2) / COUNT;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const o = document.createElement("button");
    o.className = "orbit-link";
    o.innerHTML = `<span class="n">[${i + 1}]</span> ${s.key}`;
    o._place = () => {
      if (portrait.matches) {
        const col = cos > 0.3 ? 1 : cos < -0.3 ? -1 : 0;
        o.style.left = 50 + col * 50 + "%";
        o.style.top = sin < 0 ? "-2%" : "102%";
        o.style.transform = `translate(${-50 * (1 + col)}%, ${sin < 0 ? -100 : 0}%)`;
      } else if (Math.abs(cos) > 0.3) {
        o.style.left = 50 + Math.sign(cos) * 48 + "%";
        o.style.top = 50 + sin * 47 + "%";
        o.style.transform = `translate(${cos > 0 ? 0 : -100}%, -50%)`;
      } else {
        o.style.left = "50%";
        o.style.top = 50 + sin * 48 + "%";
        o.style.transform = `translate(-50%, ${sin < 0 ? -100 : 0}%)`;
      }
    };
    o._place();
    const enter = () => {
      cyclone.setFocus(angle);
      document.body.classList.add("art");
      Ascii.morphArt(banner, Ascii.ART[s.key], { reduced: !FX, duration: 360 });
    };
    const leave = () => {
      cyclone.setFocus(null);
      document.body.classList.remove("art");
      Ascii.morphArt(banner, BANNER, { reduced: !FX, duration: 360 });
    };
    o.addEventListener("click", () => go(i));
    o.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && enter());
    o.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && leave());
    o.addEventListener("focus", enter);
    o.addEventListener("blur", leave);
    orbit.appendChild(o);
  });
  portrait.addEventListener("change", () => [...orbit.children].forEach((o) => o._place()));
  $("homeLink").addEventListener("click", () => goHome());

  let cur = -1, sel = 0, busy = false, queued = null;

  function moveInd(animate) {
    const t = cur >= 0 ? sections[cur].tab : null;
    if (!t) return;
    const to = { left: t.offsetLeft + "px", width: t.offsetWidth + "px" };
    if (FX && animate) G.to(ind, { ...to, duration: 0.3, ease: "steps(8)" });
    else Object.assign(ind.style, to);
  }

  // ---------- list selection ----------
  function setTitles(a, b, animate) {
    const ta = $("titleA"), tb = $("titleB");
    if (animate) { scramble(ta, a, { duration: 0.5 }); scramble(tb, b, { duration: 0.5 }); }
    else { ta.textContent = a; tb.textContent = b; }
  }

  function select(i, { scroll = false } = {}) {
    const s = sections[cur];
    if (!s || !s.list) return;
    i = Math.max(0, Math.min(s.count - 1, i));
    const hint = $("gHint");
    if (hint) hint.remove();
    if (i === sel) return;
    const prevArt = $("ffArt") ? $("ffArt").textContent : "";
    sel = i;
    bodyA.querySelectorAll(s.list).forEach((r) => r.setAttribute("aria-selected", r.dataset.i == i ? "true" : "false"));
    const row = bodyA.querySelector(`${s.list}[data-i="${i}"]`);
    if (row && scroll) row.scrollIntoView({ block: "nearest" });
    bodyB.innerHTML = s.detail(i);
    const [ta, tb] = s.titles(i);
    setTitles(ta, tb, FX);
    if (s.mountDetail) s.mountDetail(i, prevArt);
    revealText(bodyB);
  }

  function bindList(s) {
    bodyA.querySelectorAll(s.list).forEach((r) => {
      const i = +r.dataset.i;
      r.addEventListener("click", () => select(i));
      r.addEventListener("focus", () => select(i));
      // pointermove (not pointerenter) so rows sliding under a still cursor never select
      if (canHover) r.addEventListener("pointermove", (e) => (e.movementX || e.movementY) && select(i));
    });
  }

  // ---------- section switching: scramble out → stepped Flip → morph in ----------
  function setHash(key) {
    if ((location.hash.slice(1) || null) === (key || null)) return;
    history.pushState(null, "", key ? "#" + key : location.pathname + location.search);
  }

  async function go(i, { fromHash = false } = {}) {
    i = ((i % COUNT) + COUNT) % COUNT;
    if (busy) { queued = i; return; }
    if (!fromHash) setHash(sections[i].key);
    const first = cur < 0;
    document.body.classList.remove("art", "home");
    document.body.classList.add("open");
    cyclone.setFocus(null);
    if (i === cur) return;
    busy = true;

    const s = sections[i];
    sections.forEach((x, k) => x.tab.setAttribute("aria-current", k === i ? "true" : "false"));
    if (!first) await scrambleOut(panes);
    const state = FX && !first ? window.Flip.getState([paneA, paneB]) : null;

    cur = i;
    sel = 0;
    panes.dataset.sec = s.key;
    bodyA.innerHTML = s.A();
    bodyB.innerHTML = s.B ? s.B() : "";
    paneB.hidden = !(s.B || s.detail);
    bodyA.scrollTop = bodyB.scrollTop = 0;
    const [ta, tb] = s.titles(0);
    setTitles(ta, tb, FX);
    if (s.mount) s.mount();
    if (s.list) {
      bindList(s);
      bodyB.innerHTML = s.detail(0);
      if (s.mountDetail) s.mountDetail(0, "");
    }
    $("hints").innerHTML = s.hints() + (canHover ? " · <kbd>←→</kbd> section · <kbd>0</kbd>/<kbd>esc</kbd> home" : " · swipe ←→ · 0 home");
    $("pos").textContent = `${i + 1}/${COUNT}`;
    moveInd(!first);

    if (FX) {
      if (state) window.Flip.from(state, { duration: 0.42, ease: "steps(10)", absolute: true, scale: false });
      [paneA, paneB].forEach((p) => { p.classList.remove("trace"); void p.offsetWidth; p.classList.add("trace"); });
      revealText(bodyA, 0.1);
      revealText(bodyB, 0.2);
    }
    busy = false;
    if (queued !== null) { const q = queued; queued = null; if (q !== cur) go(q); }
  }

  function goHome({ fromHash = false } = {}) {
    cur = -1;
    document.body.classList.remove("open");
    document.body.classList.add("home");
    if (!fromHash) setHash(null);
    Ascii.morphArt(banner, BANNER, { reduced: !FX, duration: 420 });
  }

  // ---------- input ----------
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest("input, textarea")) {
      if (e.key === "Escape") e.target.blur();
      return;
    }
    const s = sections[cur];
    const k = e.key;
    if ((k === "Escape" || k === "0") && cur >= 0) goHome();
    else if (k === "ArrowRight") go(cur + 1);
    else if (k === "ArrowLeft") go(cur < 0 ? COUNT - 1 : cur - 1);
    else if (s && s.list && (k === "ArrowDown" || k === "j")) select(sel + 1, { scroll: true });
    else if (s && s.list && (k === "ArrowUp" || k === "k")) select(sel - 1, { scroll: true });
    else if (/^[1-9]$/.test(k) && +k <= COUNT) go(+k - 1);
    else if (s && s.key === "contact" && LINKS.some((l) => l.key === k)) bodyA.querySelector(`[data-key="${k}"]`).click();
    else return;
    e.preventDefault();
  });

  let tx = 0, ty = 0;
  document.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (cur < 0 || e.target.closest("input, textarea")) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  const route = () => {
    const k = sections.findIndex((s) => s.key === location.hash.slice(1));
    if (k < 0) { if (cur >= 0) goHome({ fromHash: true }); }
    else go(k, { fromHash: true });
  };
  addEventListener("popstate", route);
  addEventListener("resize", () => moveInd(false));
  if (document.fonts) document.fonts.ready.then(() => moveInd(false));

  setInterval(() => { const d = $("dxb"); if (d) d.textContent = dubaiTime(); }, 30000);

  route();
  cyclone.start();
})();
