import gsap from 'gsap'
import type { Game } from './games'

/**
 * A CD jewel case built from CSS 3D faces, so the cover and back-cover text stay crisp DOM. Closed, it
 * turns slowly like the hardware models (drag to spin it). Opening the card starts the trailer straight
 * away and cross-fades from the case to the video (or, for a game without one, to a slideshow of its
 * screenshots); closing fades back.
 *
 * Geometry is in case units: the case is W x H units and CSS draws one unit as --u (3px). The case is
 * scaled to fit its viewer every frame, which follows the viewer smoothly while the card animates.
 */

const U = 3 // px per case unit; keep in sync with --u in style.css
const W = 142 // case width (a real jewel case is 142 x 125 mm)
const H = 125
const DEPTH = 10.5 // lid (2.5) + tray (8)
const TURNTABLE_SPEED = 0.35 // rad/s, same as the models
const TILT = -0.16 // rad; looking down on the case a little
const FILL = 0.8 // share of the viewer the case fills
const SLIDE_HOLD = 3.5 // s each screenshot stays up in a slideshow
const SLIDE_FADE = 1.2 // s cross-fade between screenshots

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

const cases: CdCase[] = []
let ticking = false
let lastTime = 0

/** One ticker for every case: reads all viewer sizes first, then writes, so layout isn't thrashed. */
function tick() {
  const now = performance.now()
  const dt = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now
  const live = cases.filter((c) => c.visible && c.root.style.visibility !== 'hidden')
  const sizes = live.map((c) => [c.viewer.clientWidth, c.viewer.clientHeight] as const)
  live.forEach((c, i) => c.update(dt, ...sizes[i]))
}

export class CdCase {
  readonly viewer: HTMLElement
  readonly root: HTMLElement
  visible = false

  private spinEl: HTMLElement
  /** What the open card shows: the trailer's <video>, or the slideshow. */
  private media: HTMLElement
  private video?: HTMLVideoElement
  private sound?: HTMLButtonElement
  private trailer?: string
  private slides: HTMLImageElement[] = []
  private slide = 0
  private slideTimer?: gsap.core.Tween
  private userMuted = true // trailers start muted; the sound button turns it on

  private yaw = -0.6
  private tilt = TILT
  private spin = 0 // extra spin from dragging, decays back to the turntable speed
  private dragging = false
  private isOpen = false
  private timeline?: gsap.core.Timeline
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

  constructor(viewer: HTMLElement, game: Game) {
    this.viewer = viewer
    const c = game.case
    this.trailer = c.trailer

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

    this.spinEl = div('cd-spin', tray, lid)
    this.root = div('cd', this.spinEl)
    this.root.setAttribute('aria-hidden', 'true')
    this.root.style.setProperty('--case', c.color)
    this.root.style.setProperty('--case-ink', c.ink)

    viewer.append(this.root)
    if (c.trailer) {
      // ---- the trailer, filling the open viewer ----
      const video = (this.video = document.createElement('video'))
      video.className = 'cd-video'
      video.poster = c.screenshot
      video.preload = 'none'
      video.loop = true
      video.playsInline = true

      const sound = (this.sound = document.createElement('button'))
      sound.type = 'button'
      sound.className = 'cd-sound'
      sound.addEventListener('click', () => {
        video.muted = this.userMuted = !video.muted
        this.syncSound()
      })
      gsap.set(sound, { autoAlpha: 0 })
      this.media = video
      this.trailer = c.trailer
      viewer.append(video, sound)

      // Start fetching the trailer as soon as someone shows interest, so it can start on the click.
      const card = viewer.closest('.card')
      const warm = () => this.loadTrailer()
      card?.addEventListener('pointerenter', warm, { once: true })
      card?.addEventListener('focus', warm, { once: true })
    } else {
      // ---- no trailer: a slideshow of screenshots instead ----
      this.slides = (c.gallery ?? [c.screenshot]).map((src) => img('cd-slide', src))
      this.media = div('cd-video cd-slides', ...this.slides)
      viewer.append(this.media)
    }
    gsap.set(this.media, { autoAlpha: 0 })

    this.bindDrag()
    this.watchVisibility()

    cases.push(this)
    if (!ticking) {
      ticking = true
      lastTime = performance.now()
      gsap.ticker.add(tick)
    }
  }

  private loadTrailer() {
    if (!this.video || !this.trailer || this.video.src) return
    this.video.preload = 'auto'
    this.video.src = this.trailer
  }

  private syncSound() {
    if (!this.video || !this.sound) return
    const muted = this.video.muted
    this.sound.textContent = muted ? 'sound: off' : 'sound: on'
    this.sound.setAttribute('aria-label', muted ? 'Unmute trailer' : 'Mute trailer')
  }

  private async play() {
    if (!this.video) return this.startSlides()
    this.loadTrailer()
    this.video.currentTime = 0
    this.video.muted = this.userMuted
    try {
      await this.video.play()
    } catch {
      // No click to vouch for sound (e.g. opened from a link): play muted instead.
      this.video.muted = true
      await this.video.play().catch(() => {})
    }
    this.syncSound()
  }

  private pause() {
    this.video?.pause()
    this.slideTimer?.kill()
  }

  /** Shows the first screenshot, then cross-fades to the next every few seconds. */
  private startSlides() {
    this.slideTimer?.kill()
    if (!this.slides.length) return
    this.slide = 0
    gsap.killTweensOf(this.slides)
    gsap.set(this.slides, { autoAlpha: 0, zIndex: '' })
    gsap.set(this.slides[0], { autoAlpha: 1 })
    if (this.slides.length < 2 || this.reducedMotion.matches) return
    const advance = () => {
      const from = this.slides[this.slide]
      this.slide = (this.slide + 1) % this.slides.length
      const to = this.slides[this.slide]
      // The new one fades in on top (later in the DOM wins, so lift it), then the old one drops out.
      to.style.zIndex = '1'
      from.style.zIndex = ''
      gsap.fromTo(to, { autoAlpha: 0 }, { autoAlpha: 1, duration: SLIDE_FADE, ease: 'power1.inOut',
        onComplete: () => void gsap.set(from, { autoAlpha: 0 }) })
      this.slideTimer = gsap.delayedCall(SLIDE_HOLD + SLIDE_FADE, advance)
    }
    this.slideTimer = gsap.delayedCall(SLIDE_HOLD, advance)
  }

  open(duration: number) {
    if (this.isOpen) return
    this.isOpen = true
    this.dragging = false
    this.timeline?.kill()
    // Straight away, while the click still counts as permission to play (sound too, if it's been turned on).
    void this.play()

    // The nearest turn that shows the front, so the case turns to face you as it fades.
    const front = Math.round(this.yaw / (2 * Math.PI)) * 2 * Math.PI
    const tl = gsap.timeline()
    tl.to(this, { yaw: front, tilt: 0, duration, ease: 'power3.inOut' }, 0)
      .to(this.root, { autoAlpha: 0, duration: duration * 0.6, ease: 'power1.in' }, 0)
      .to(this.media, { autoAlpha: 1, duration: duration * 0.7, ease: 'power1.out' }, duration * 0.2)
    if (this.sound) tl.to(this.sound, { autoAlpha: 1, duration: 0.3 }, duration)
    this.finish(tl)
  }

  close(duration: number) {
    if (!this.isOpen) return
    this.isOpen = false
    this.timeline?.kill()

    const tl = gsap.timeline({ onComplete: () => this.pause() })
    if (this.sound) tl.to(this.sound, { autoAlpha: 0, duration: 0.15 }, 0)
    tl.to(this.media, { autoAlpha: 0, duration: duration * 0.6, ease: 'power1.in' }, 0)
      .to(this.root, { autoAlpha: 1, duration: duration * 0.7, ease: 'power1.out' }, duration * 0.2)
      .to(this, { tilt: TILT, duration, ease: 'power2.inOut' }, 0)
    this.finish(tl)
  }

  private finish(tl: gsap.core.Timeline) {
    this.timeline = tl
    if (this.reducedMotion.matches) tl.progress(1)
  }

  /** Called by the shared ticker with the viewer's current size. */
  update(dt: number, vw: number, vh: number) {
    if (!this.isOpen && !this.dragging) {
      const speed = this.reducedMotion.matches ? 0 : TURNTABLE_SPEED
      this.spin *= Math.exp(-dt * 3)
      this.yaw += (speed + this.spin) * dt
    }

    const scale = (FILL * Math.min(vw / W, vh / H)) / U
    this.root.style.perspective = `${W * U * scale * 3.5}px`
    this.spinEl.style.transform =
      `scale3d(${scale}, ${scale}, ${scale}) ` +
      `rotateX(${this.tilt}rad) rotateY(${this.yaw}rad) translateZ(${(DEPTH / 2 - 2.5) * U}px)`
    // A highlight that slides across the cover as the case turns.
    this.root.style.setProperty('--sheen', `${50 + 60 * Math.sin(this.yaw)}%`)
  }

  /** Horizontal drag spins the closed case; vertical drags still scroll the page on touch. */
  private bindDrag() {
    let lastX = 0
    let lastT = 0
    this.viewer.addEventListener('pointerdown', (e) => {
      if (this.isOpen) return
      this.dragging = true
      lastX = e.clientX
      lastT = e.timeStamp
      this.viewer.setPointerCapture(e.pointerId)
    })
    this.viewer.addEventListener('pointermove', (e) => {
      if (!this.dragging) return
      const dx = e.clientX - lastX
      const dt = Math.max(1, e.timeStamp - lastT) / 1000
      this.yaw += dx * 0.01
      this.spin = (dx * 0.01) / dt - TURNTABLE_SPEED
      lastX = e.clientX
      lastT = e.timeStamp
    })
    const end = () => (this.dragging = false)
    this.viewer.addEventListener('pointerup', end)
    this.viewer.addEventListener('pointercancel', end)
  }

  private watchVisibility() {
    new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting
        // Don't keep playing a trailer nobody can see.
        if (!this.visible) this.video?.pause()
        else if (this.isOpen && this.video?.src) void this.video.play().catch(() => {})
      },
      { rootMargin: '100px' },
    ).observe(this.viewer)
  }
}
