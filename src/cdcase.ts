import type { Game } from './games'
import { Turntable, U } from './turntable'

/**
 * A CD jewel case built from CSS 3D faces, so the cover and back-cover text stay crisp DOM: a lid over the
 * cover booklet, and a tray with the printed back cover and spines. It sits on a Turntable, which spins it
 * and cross-fades it into the game's trailer (or screenshot slideshow) when the card opens.
 *
 * Geometry is in case units: a real jewel case is 142 x 125 x 10.5 mm, and one unit is U px (--u in CSS).
 */

const W = 142
const H = 125
const DEPTH = 10.5 // lid (2.5) + tray (8)

function div(className: string, ...children: (Node | string)[]) {
  const node = document.createElement('div')
  node.className = className
  node.append(...children)
  return node
}

function text(tag: string, className: string, content: string) {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = content
  return node
}

function img(className: string, src: string) {
  const node = document.createElement('img')
  node.className = className
  node.src = src
  node.alt = ''
  node.loading = 'lazy'
  node.decoding = 'async'
  node.draggable = false
  return node
}

/** Decorative barcode: bar widths seeded from the title, so each game gets its own. */
function barcode(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const stops: string[] = []
  let x = 0
  for (let i = 0; x < 100; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995)
    const w = 1 + ((h >>> 0) % 4) * 0.9
    stops.push(`${i % 2 ? '#fff' : '#111'} ${x}% ${Math.min(100, x + w)}%`)
    x += w
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

/** The four sides of a slab from z0 to z1 (case units); the caller provides its front and back. */
function edges(prefix: string, z0: number, z1: number, spine?: Node) {
  const at = `translateZ(${z0 * U}px)`
  const side = (name: string, transform: string, ...children: Node[]) => {
    const face = div(`cd-face cd-edge ${prefix}-edge cd-edge--${name}`, ...children)
    face.style.transform = `${at} ${transform}`
    face.style.setProperty('--t', String(z1 - z0))
    return face
  }
  return [
    side('left', 'rotateY(-90deg)', ...(spine ? [spine] : [])),
    side('right', 'rotateY(90deg)'),
    side('top', 'rotateX(90deg)'),
    side('bottom', 'rotateX(-90deg)'),
  ]
}

export function cdCase(viewer: HTMLElement, game: Game) {
  const c = game.case

  // ---- lid: clear plastic over the cover booklet ----
  const front = div('cd-face cd-front', div('cd-hinge'), img('cd-cover', c.cover), div('cd-sheen'))
  front.style.transform = `translateZ(${2.5 * U}px)`
  const lid = div('cd-slab', front, ...edges('cd-lid', 0, 2.5))

  // ---- tray: the printed tray card on the back, wrapping round to the spines ----
  const badges = div('cd-badges', ...c.badges.map((b) => text('span', 'cd-badge', b)))
  const code = div('cd-barcode')
  code.style.backgroundImage = barcode(game.id)
  const features = document.createElement('ul')
  features.className = 'cd-features'
  features.append(...c.features.map((f) => text('li', '', f)))
  const back = div(
    'cd-face cd-back',
    div('cd-back-head', text('p', 'cd-back-title', game.title), text('p', 'cd-back-tagline', c.tagline)),
    div('cd-back-main', img('cd-back-shot', c.screenshot), div('cd-back-copy', text('p', 'cd-blurb', c.blurb), features)),
    div('cd-back-foot', badges, text('p', 'cd-legal', c.legal), code),
  )
  back.style.transform = `translateZ(${-8 * U}px) rotateY(180deg)`
  const tray = div('cd-slab', back, ...edges('cd-tray', -8, 0, text('span', 'cd-spine', game.title)))

  const spinEl = div('cd-spin', tray, lid)
  const root = div('cd', spinEl)
  root.style.setProperty('--case', c.color)
  root.style.setProperty('--case-ink', c.ink)

  return new Turntable({
    viewer,
    root,
    spinEl,
    width: W,
    height: H,
    depth: DEPTH,
    centerZ: DEPTH / 2 - 2.5,
    poster: c.screenshot,
    trailer: c.trailer,
    sound: true,
    gallery: c.gallery,
  })
}
