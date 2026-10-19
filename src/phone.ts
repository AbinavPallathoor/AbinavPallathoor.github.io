import type { App } from './apps'
import { Turntable, U } from './turntable'

/**
 * A phone built from CSS 3D faces, with the app on its screen. It sits on a Turntable: opening the card
 * turns it to face you and zooms into the screen until it fills the viewer, where the app's recording
 * takes over.
 *
 * Geometry is in units (one unit is U px, --u in CSS) and is handed to style.css as CSS variables. The
 * screen has the recordings' shape (592 x 1296), so the zoomed-in screen and the open viewer line up.
 */

const W = 74
const H = 156
const DEPTH = 8
const RADIUS = 10 // body corners
const SCREEN_W = 68
const SCREEN_H = (SCREEN_W * 1296) / 592
const SCREEN_R = 7

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

/** The rim between front and back: flat strips for the straight sides, stacked outlines for the corners. */
function frame() {
  const side = (name: string, transform: string) => {
    const face = div(`ph-edge ph-edge--${name}`)
    face.style.transform = transform
    return face
  }
  const z = `translateZ(${(-DEPTH / 2) * U}px)`
  const slices = []
  for (let i = 1; i < DEPTH; i++) {
    const slice = div('ph-slice')
    slice.style.transform = `translateZ(${(i - DEPTH / 2) * U}px)`
    slices.push(slice)
  }
  return [
    ...slices,
    side('left', `${z} rotateY(-90deg)`),
    side('right', `${z} rotateY(90deg)`),
    side('top', `${z} rotateX(90deg)`),
    side('bottom', `${z} rotateX(-90deg)`),
  ]
}

export function phone(viewer: HTMLElement, app: App) {
  const p = app.phone

  // ---- front: the app on screen, behind a black bezel ----
  const screen = document.createElement('img')
  screen.className = 'ph-screen'
  screen.src = p.screenshot
  screen.alt = ''
  screen.decoding = 'async'
  screen.draggable = false
  const front = div('ph-face ph-front', screen, div('ph-hole'), div('ph-sheen'))
  front.style.transform = `translateZ(${(DEPTH / 2) * U}px)`

  // ---- back: a single camera, the app's name and some small print ----
  const camera = div('ph-camera', div('ph-lens'), div('ph-flash'))
  const back = div(
    'ph-face ph-back',
    camera,
    text('p', 'ph-name', app.title),
    text('p', 'ph-print', p.print),
  )
  back.style.transform = `translateZ(${(-DEPTH / 2) * U}px) rotateY(180deg)`

  const spinEl = div('ph-spin', ...frame(), back, front)
  const root = div('ph', spinEl)
  root.style.setProperty('--phone', p.color)
  root.style.setProperty('--phone-ink', p.ink)
  // The measurements, for style.css (in units of --u).
  const sizes = { w: W, h: H, d: DEPTH, r: RADIUS, sw: SCREEN_W, sh: SCREEN_H, sr: SCREEN_R }
  for (const [name, value] of Object.entries(sizes)) root.style.setProperty(`--${name}`, String(value))

  return new Turntable({
    viewer,
    root,
    spinEl,
    width: W,
    height: H,
    depth: DEPTH,
    screen: { width: SCREEN_W, height: SCREEN_H, radius: SCREEN_R },
    poster: p.screenshot,
    trailer: p.video,
    gallery: p.gallery,
  })
}
