import gsap from 'gsap'

/**
 * A CSS 3D object on a turntable inside a card's viewer, with the media the open card shows: a trailer
 * <video>, or a slideshow of screenshots when there is none. Closed, the object turns slowly like the
 * hardware models (drag to spin it). Opening the card starts the media straight away and hands over to it:
 * an object with a `screen` (a phone) turns to face you and zooms in until its screen fills the viewer,
 * then the media takes over from the screen; anything else (a CD case) turns to face you and cross-fades
 * into the media. Closing reverses it.
 *
 * Geometry is in object units; CSS draws one unit as --u, which must match U. The object is rescaled to
 * its viewer every frame, which is how it follows the viewer while the card animates.
 */

export const U = 3 // px per unit; keep in sync with --u in style.css
const TURNTABLE_SPEED = 0.35 // rad/s, same as the models
const TILT = -0.16 // rad; looking down on the object a little
const FILL = 0.8 // share of the viewer the closed object fills
const PERSPECTIVE = 3.5 // perspective distance, in object widths
const SLIDE_HOLD = 3.5 // s each screenshot stays up in a slideshow
const SLIDE_FADE = 1.2 // s cross-fade between screenshots

export type TurntableOptions = {
  viewer: HTMLElement
  /** Holds the perspective; fades out when the media takes over. Contains `spinEl`. */
  root: HTMLElement
  /** The preserve-3d element that gets turned and scaled. */
  spinEl: HTMLElement
  /** Size in units; the closed object is fitted to the viewer by this. */
  width: number
  height: number
  depth: number
  /** Moves the object along z (units) so it turns about its middle. */
  centerZ?: number
  /** A screen on the front face, centred, in units. Opening zooms in until it fills the viewer. */
  screen?: { width: number; height: number; radius: number }
  /** Shown before the trailer plays. */
  poster: string
  trailer?: string
  /** The trailer has a sound track: show a sound button. */
  sound?: boolean
  /** Without a trailer, the open card cycles through these instead. */
  gallery?: string[]
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

const turntables: Turntable[] = []
let lastTime = 0

/** One ticker for every object: reads all viewer sizes first, then writes, so layout isn't thrashed. */
function tick() {
  const now = performance.now()
  const dt = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now
  const live = turntables.filter((t) => t.visible && t.root.style.visibility !== 'hidden')
  const sizes = live.map((t) => [t.viewer.clientWidth, t.viewer.clientHeight] as const)
  live.forEach((t, i) => t.update(dt, ...sizes[i]))
}

export class Turntable {
  readonly viewer: HTMLElement
  readonly root: HTMLElement
  visible = false

  private o: TurntableOptions
  /** What the open card shows: the trailer's <video>, or the slideshow. */
  private media: HTMLElement
  private video?: HTMLVideoElement
  private sound?: HTMLButtonElement
  private slides: HTMLImageElement[] = []
  private slide = 0
  private slideTimer?: gsap.core.Tween
  private userMuted = true // trailers start muted; the sound button turns it on

  private yaw = -0.6
  private tilt = TILT
  /** 0 = fitted to the viewer, 1 = zoomed in until the screen fills it. */
  private zoom = 0
  private spin = 0 // extra spin from dragging, decays back to the turntable speed
  private dragging = false
  private isOpen = false
  private timeline?: gsap.core.Timeline
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

  constructor(o: TurntableOptions) {
    this.o = o
    this.viewer = o.viewer
    this.root = o.root
    o.root.setAttribute('aria-hidden', 'true')
    o.viewer.append(o.root)

    if (o.trailer) {
      const video = (this.video = document.createElement('video'))
      video.className = 'tt-media'
      video.poster = o.poster
      video.preload = 'none'
      video.loop = true
      video.playsInline = true
      video.muted = true
      this.media = video
      o.viewer.append(video)

      if (o.sound) {
        const sound = (this.sound = document.createElement('button'))
        sound.type = 'button'
        sound.className = 'tt-sound'
        sound.addEventListener('click', () => {
          video.muted = this.userMuted = !video.muted
          this.syncSound()
        })
        gsap.set(sound, { autoAlpha: 0 })
        o.viewer.append(sound)
      }

      // Start fetching the trailer as soon as someone shows interest, so it can start on the click.
      const card = o.viewer.closest('.card')
      const warm = () => this.loadTrailer()
      card?.addEventListener('pointerenter', warm, { once: true })
      card?.addEventListener('focus', warm, { once: true })
    } else {
      this.slides = (o.gallery ?? [o.poster]).map((src) => img('tt-slide', src))
      this.media = document.createElement('div')
      this.media.className = 'tt-media tt-slides'
      this.media.append(...this.slides)
      o.viewer.append(this.media)
    }
    gsap.set(this.media, { autoAlpha: 0 })

    this.bindDrag()
    this.watchVisibility()

    turntables.push(this)
    if (turntables.length === 1) {
      lastTime = performance.now()
      gsap.ticker.add(tick)
    }
  }

  private loadTrailer() {
    if (!this.video || !this.o.trailer || this.video.src) return
    this.video.preload = 'auto'
    this.video.src = this.o.trailer
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

    // The nearest turn that shows the front, so the object turns to face you.
    const front = Math.round(this.yaw / (2 * Math.PI)) * 2 * Math.PI
    const tl = gsap.timeline()
    if (this.o.screen) {
      // Zoom into the screen; once it fills the viewer, the media takes its place.
      tl.to(this, { yaw: front, tilt: 0, zoom: 1, duration, ease: 'power3.inOut' }, 0)
        .to(this.media, { autoAlpha: 1, duration: duration * 0.25, ease: 'none' }, duration * 0.75)
        .set(this.root, { autoAlpha: 0 }, duration)
    } else {
      tl.to(this, { yaw: front, tilt: 0, duration, ease: 'power3.inOut' }, 0)
        .to(this.root, { autoAlpha: 0, duration: duration * 0.6, ease: 'power1.in' }, 0)
        .to(this.media, { autoAlpha: 1, duration: duration * 0.7, ease: 'power1.out' }, duration * 0.2)
    }
    if (this.sound) tl.to(this.sound, { autoAlpha: 1, duration: 0.3 }, duration)
    this.finish(tl)
  }

  close(duration: number) {
    if (!this.isOpen) return
    this.isOpen = false
    this.timeline?.kill()

    const tl = gsap.timeline({ onComplete: () => this.pause() })
    if (this.sound) tl.to(this.sound, { autoAlpha: 0, duration: 0.15 }, 0)
    if (this.o.screen) {
      // The screen is back under the media before it fades, then the object pulls back out.
      tl.set(this.root, { autoAlpha: 1 }, 0)
        .to(this.media, { autoAlpha: 0, duration: duration * 0.25, ease: 'none' }, 0)
        .to(this, { zoom: 0, tilt: TILT, duration, ease: 'power3.inOut' }, 0)
    } else {
      tl.to(this.media, { autoAlpha: 0, duration: duration * 0.6, ease: 'power1.in' }, 0)
        .to(this.root, { autoAlpha: 1, duration: duration * 0.7, ease: 'power1.out' }, duration * 0.2)
        .to(this, { tilt: TILT, duration, ease: 'power2.inOut' }, 0)
    }
    this.finish(tl)
  }

  private finish(tl: gsap.core.Timeline) {
    this.timeline = tl
    if (this.reducedMotion.matches) tl.progress(1)
  }

  /** Called by the shared ticker with the viewer's current size. */
  update(dt: number, vw: number, vh: number) {
    const { width, height, depth, centerZ = 0, screen } = this.o
    if (!this.isOpen && !this.dragging) {
      const speed = this.reducedMotion.matches ? 0 : TURNTABLE_SPEED
      this.spin *= Math.exp(-dt * 3)
      this.yaw += (speed + this.spin) * dt
    }

    let scale = (FILL * Math.min(vw / width, vh / height)) / U
    if (screen) {
      // The front face sits nearer the eye than the middle, so perspective draws it a little larger.
      const near = (PERSPECTIVE * width) / (PERSPECTIVE * width - depth / 2)
      const fill = Math.max(vw / screen.width, vh / screen.height) / U / near
      scale += (fill - scale) * this.zoom
      // Round the viewer's corners like the screen's, so the zoomed-in screen fits it exactly.
      this.viewer.style.setProperty('--screen-r', `${screen.radius * U * scale * near * this.zoom}px`)
    }

    this.root.style.perspective = `${width * U * scale * PERSPECTIVE}px`
    this.o.spinEl.style.transform =
      `scale3d(${scale}, ${scale}, ${scale}) ` +
      `rotateX(${this.tilt}rad) rotateY(${this.yaw}rad) translateZ(${centerZ * U}px)`
    // A highlight that slides across the front as the object turns.
    this.root.style.setProperty('--sheen', `${50 + 60 * Math.sin(this.yaw)}%`)
  }

  /** Horizontal drag spins the closed object; vertical drags still scroll the page on touch. */
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
