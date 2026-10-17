const HEIGHT = 110
const PAD = 8 // keeps the stroke from clipping at the top/bottom
const TENSION = 0.75 // 0 = straight zigzag, 1 = full Catmull-Rom curves

/** Small seeded PRNG so the squiggle looks the same on every load. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let drawnWidth = 0

/** Hand-drawn zigzag spanning the full viewport width. */
export function drawSquiggle(svg: SVGSVGElement) {
  const width = document.documentElement.clientWidth
  if (width === drawnWidth) return
  drawnWidth = width

  const rand = mulberry32(42)
  const pts: [number, number][] = []
  let x = -10
  let up = true
  while (x < width + 40) {
    const amp = 0.35 + rand() * 0.65
    const mid = HEIGHT / 2
    const y = up ? mid - amp * (mid - PAD) : mid + amp * (mid - PAD)
    pts.push([x, y + (rand() - 0.5) * 10])
    // Occasionally add a flat run, like the long strokes in the drawing.
    x += rand() < 0.12 ? 60 + rand() * 50 : 18 + rand() * 30
    up = !up
  }

  // Catmull-Rom through every point: peaks stay pointy-ish, the strokes between them bow a little.
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)]
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)]
    const k = TENSION / 6
    const c1 = [x1 + (x2 - x0) * k, y1 + (y2 - y0) * k]
    const c2 = [x2 - (x3 - x1) * k, y2 - (y3 - y1) * k]
    d += ` C${c1.map((v) => v.toFixed(1))} ${c2.map((v) => v.toFixed(1))} ${x2.toFixed(1)},${y2.toFixed(1)}`
  }

  svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`)
  svg.querySelector('path')!.setAttribute('d', d)
}
