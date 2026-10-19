import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './style.css'

import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { projects, type CardInfo } from './projects'
import { games } from './games'
import { apps } from './apps'
import { Stage } from './stage'
import type { Turntable } from './turntable'
import { cdCase } from './cdcase'
import { phone } from './phone'
import { drawSquiggle } from './squiggle'

gsap.registerPlugin(Flip, ScrollToPlugin)

const root = document.querySelector<HTMLElement>('main')!
const grids = [...document.querySelectorAll<HTMLElement>('.grid')]
const stage = new Stage()
/** The CD case or phone in each game or app card, so opening the card can open it too. */
const turntables = new Map<HTMLElement, Turntable>()
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

// ---------- cards ----------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

/** The card shell; the caller fills its viewer. */
function cardShell(p: CardInfo) {
  const card = el('article', 'card')
  card.id = p.id
  card.tabIndex = 0
  card.setAttribute('role', 'button')
  card.setAttribute('aria-expanded', 'false')
  card.setAttribute('aria-label', p.title)

  // Undated cards keep an empty line here so every card's model sits at the same height.
  const date = el('p', 'card-date')
  if (p.status) date.append(el('span', 'card-status', p.status))
  if (p.date) {
    const time = el('time', undefined, p.date)
    time.dateTime = p.date.replaceAll('/', '-')
    date.append(time)
  }
  if (!date.childNodes.length) date.textContent = '\u00a0'

  const viewer = el('div', 'card-viewer')

  const body = el('div', 'card-body')
  body.append(el('h3', 'card-title', p.title), el('p', 'card-summary', p.summary))

  const more = el('div', 'card-more')
  more.append(el('p', 'card-details', p.details))
  if (p.links.length) more.append(el('p', 'card-links-label', 'Links →'))
  const links = el('ul', 'card-links')
  for (const link of p.links) {
    const a = el('a', undefined, link.label)
    a.href = link.href
    // External sites and PDFs open in a new tab.
    if (link.href.startsWith('http') || link.href.endsWith('.pdf')) {
      a.target = '_blank'
      a.rel = 'noopener'
    }
    const li = el('li')
    li.append(a)
    links.append(li)
  }
  more.append(links)
  body.append(more)

  const close = el('button', 'card-close', '✕')
  close.type = 'button'
  close.setAttribute('aria-label', `Close ${p.title}`)

  card.append(date, viewer, body, close)
  return { card, viewer }
}

const hardwareGrid = document.querySelector<HTMLElement>('#hardware')!
for (const p of projects) {
  const { card: c, viewer } = cardShell(p)
  stage.add(viewer, p.model)
  hardwareGrid.append(c)
}

const softwareGrid = document.querySelector<HTMLElement>('#software')!
for (const a of apps) {
  const { card: c, viewer } = cardShell(a)
  c.classList.add('card--app', 'card--portrait')
  turntables.set(c, phone(viewer, a))
  softwareGrid.append(c)
}

const gamedevGrid = document.querySelector<HTMLElement>('#gamedev')!
for (const g of games) {
  const { card: c, viewer } = cardShell(g)
  c.classList.add('card--game')
  if (g.case.portrait) c.classList.add('card--portrait')
  turntables.set(c, cdCase(viewer, g))
  gamedevGrid.append(c)
}

// ---------- open / close ----------

let openCard: HTMLElement | null = null
const BODY_PROPS = 'transform,position,gridArea,left,top,width'
let activeFlip: gsap.core.Timeline | undefined
let gridTweens: gsap.core.Tween[] = []

/** Scroll position that brings an (already re-laid-out) card fully into view, or null if it fits. */
function scrollToFit(card: HTMLElement) {
  const r = card.getBoundingClientRect()
  const margin = 16
  if (r.top < margin || r.height > innerHeight - 2 * margin) return scrollY + r.top - margin
  if (r.bottom > innerHeight - margin) return scrollY + r.bottom - innerHeight + margin
  return null
}

/**
 * Where a card's text sits relative to the card's top-left corner. Measured from the title, not the
 * body box: the open body has extra top padding, which would make the text jump when it's toggled.
 */
function bodyOffset(card: HTMLElement) {
  const c = card.getBoundingClientRect()
  const b = card.querySelector('.card-title')!.getBoundingClientRect()
  return { x: b.left - c.left, y: b.top - c.top }
}

/**
 * Keep an open card in the row it sits in when everything is closed. It spans the full width, so the
 * cards that shared its row (and everything after) flow on below it.
 */
function placeOpenCard() {
  if (!openCard) return
  const grid = openCard.parentElement!
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
  const index = [...grid.children].indexOf(openCard)
  // Set on the grid, not the card: Flip resets the card's inline styles when it finishes.
  grid.style.setProperty('--open-row', String(Math.floor(index / cols) + 1))
}
const gridResize = new ResizeObserver(placeOpenCard)
for (const grid of grids) gridResize.observe(grid)

function setOpen(next: HTMLElement | null, { updateHash = true } = {}) {
  if (next === openCard) return

  const cards = root.querySelectorAll<HTMLElement>('.card')
  const inner = root.querySelectorAll<HTMLElement>('.card-date, .card-viewer')
  const state = Flip.getState([...cards, ...inner])
  const fromHeights = grids.map((g) => g.offsetHeight)

  // The text block isn't flipped: resizing it would re-wrap the text every frame.
  // Instead it takes its final width immediately and slides from its old spot in the card.
  const toggled = [openCard, next].filter((c): c is HTMLElement => !!c)
  const bodyFrom = toggled.map(bodyOffset)

  // Interrupted mid-animation? Everything above was measured where it currently is, so stop the old
  // tweens and let the new ones start from there.
  activeFlip?.kill()
  const bodies = root.querySelectorAll('.card-body')
  gsap.killTweensOf([window, ...bodies])
  gsap.set(bodies, { clearProps: BODY_PROPS })
  for (const t of gridTweens) t.kill()
  for (const grid of grids) grid.style.removeProperty('min-height')

  const prev = openCard
  openCard?.classList.remove('is-open')
  openCard?.setAttribute('aria-expanded', 'false')
  next?.classList.add('is-open')
  next?.setAttribute('aria-expanded', 'true')
  openCard = next
  placeOpenCard()

  if (updateHash) {
    const url = next ? `#${next.id}` : location.pathname + location.search
    history.replaceState(null, '', url)
  }
  if (next) countCardView(next)

  const duration = reducedMotion.matches ? 0 : 0.7
  if (prev) turntables.get(prev)?.close(duration)
  if (next) turntables.get(next)?.open(duration)
  // Pin each text block absolutely at its final spot and width while the card animates. Flip lifts the
  // viewer and date out of the card's layout during the animation; on the stacked phone layout the text
  // would otherwise ride up into their space and snap back at the end. The pinned width also stops the
  // text from re-wrapping. Measured now, applied after Flip has recorded the final layout.
  const pins = toggled.map((card, i) => {
    const body = card.querySelector<HTMLElement>('.card-body')!
    const to = bodyOffset(card)
    return {
      body,
      // offsetLeft/Top are from the card's padding edge, which is what `left`/`top` use once the grid
      // area is cleared (an abspos grid child otherwise positions against its grid area).
      pinned: { position: 'absolute', gridArea: 'auto', left: body.offsetLeft, top: body.offsetTop, width: body.offsetWidth },
      dx: bodyFrom[i].x - to.x,
      dy: bodyFrom[i].y - to.y,
    }
  })

  const toHeights = grids.map((g) => g.offsetHeight)
  const scrollTarget = next ? scrollToFit(next) : null

  // Cards go absolute during the flip, so hold each grid's height steady and ease it instead. The grids
  // must never lose their height, even for an instant, or the page gets shorter and the browser clamps the
  // scroll position. So pin them before Flip lifts the cards out, and tween a plain number rather than
  // the CSS property (a CSS tween briefly clears the inline value when it starts). It's min-height, not
  // height: Flip records the end layout below, and a fixed height would squash the open card's row.
  gridTweens = grids.map((grid, i) => {
    const h = { px: fromHeights[i] }
    const apply = () => grid.style.setProperty('min-height', `${h.px}px`)
    apply()
    return gsap.to(h, {
      px: toHeights[i],
      duration,
      ease: 'power3.inOut',
      onUpdate: apply,
      onComplete: () => grid.style.removeProperty('min-height'),
    })
  })
  activeFlip = Flip.from(state, {
    duration,
    ease: 'power3.inOut',
    absolute: true,
    nested: true,
    zIndex: 2,
  })
  for (const { body, pinned, dx, dy } of pins) {
    gsap.set(body, pinned)
    gsap.fromTo(body, { x: dx, y: dy }, { x: 0, y: 0, duration, ease: 'power3.inOut', clearProps: BODY_PROPS })
  }
  // Scroll alongside the animation, not after it.
  if (scrollTarget !== null) gsap.to(window, { scrollTo: scrollTarget, duration, ease: 'power3.inOut' })

  if (next) {
    gsap.fromTo(
      next.querySelector('.card-more'),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: duration * 0.6, delay: duration * 0.55, ease: 'power2.out' },
    )
  }
}

// A drag on the viewer spins the model; don't treat it as a click.
let downX = 0
let downY = 0
root.addEventListener('pointerdown', (e) => {
  downX = e.clientX
  downY = e.clientY
})

root.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return
  if (target.closest('a, .tt-sound')) return

  const card = target.closest<HTMLElement>('.card')
  if (!card) return
  if (target.closest('.card-close')) return setOpen(null)
  if (card === openCard) {
    // Clicking inside an open card only closes it from the viewer (or ✕), so text stays selectable.
    if (target.closest('.card-viewer')) setOpen(null)
    return
  }
  setOpen(card)
})

root.addEventListener('keydown', (e) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.card')
  if (!card || e.target !== card) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    setOpen(card === openCard ? null : card)
  }
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openCard) {
    const card = openCard
    setOpen(null)
    card.focus({ preventScroll: true })
  }
})

// GoatCounter ignores the hash, so each opened card is counted as its own /#id page. count.js loads
// async from index.html; if it isn't ready yet (a deep link on page load), count once it is.
declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string; title?: string }) => void }
  }
}
function countCardView(card: HTMLElement) {
  const count = window.goatcounter?.count
  if (count) count({ path: `/#${card.id}`, title: card.querySelector('.card-title')?.textContent ?? card.id })
  else document.querySelector('script[data-goatcounter]')?.addEventListener('load', () => countCardView(card), { once: true })
}

// Deep links: /#axis-x opens that card.
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1))
  const card = id ? root.querySelector<HTMLElement>(`.card#${CSS.escape(id)}`) : null
  setOpen(card, { updateHash: false })
  return card
}
window.addEventListener('hashchange', openFromHash)
if (location.hash) openFromHash()?.scrollIntoView({ block: 'center' })

// ---------- squiggle ----------

const squiggle = document.querySelector<SVGSVGElement>('#squiggle')!
drawSquiggle(squiggle)
new ResizeObserver(() => drawSquiggle(squiggle)).observe(document.documentElement)
