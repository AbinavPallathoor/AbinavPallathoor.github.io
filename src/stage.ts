import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Project } from './projects'

/**
 * One offscreen WebGL renderer shared by every card. Each frame it renders a
 * card's model and copies the pixels into that card's own 2D canvas, so the
 * models live in normal DOM stacking order (cards can overlap mid-animation)
 * while the page only ever holds a single WebGL context.
 */

const TURNTABLE_SPEED = 0.35 // rad/s
const CAMERA_PITCH = 0.32 // rad above the horizon
const FOV = 30
const FRAMING = 0.9 // < 1 zooms in past the (conservative) bounding sphere

/** Key, fill and rim lights. They stay put while the model turns, so the shading moves across it. */
function addLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffffff, 2.6)
  key.position.set(1.2, 5, 1.8)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.radius = 4
  key.shadow.bias = -0.0005
  key.shadow.normalBias = 0.02
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.5, far: 12 })

  const fill = new THREE.DirectionalLight(0xe4ecff, 0.5)
  fill.position.set(-3, 1.5, 2)

  const rim = new THREE.DirectionalLight(0xffffff, 1.4)
  rim.position.set(-1.5, 3, -4)

  scene.add(key, fill, rim)
}

type Slot = {
  el: HTMLElement
  model: Project['model']
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  turntable: THREE.Group
  yaw: number
  /** Extra spin from dragging, decays back to the turntable speed. */
  spin: number
  dragging: boolean
  loaded: boolean
}

const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
const loader = new GLTFLoader().setDRACOLoader(draco)

export class Stage {
  private renderer: THREE.WebGLRenderer
  private slots: Slot[] = []
  private env: THREE.Texture
  private timer = new THREE.Timer()
  private observer: IntersectionObserver
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.setPixelRatio(1) // sizes below are already in device pixels
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    // Load models only once their card gets near the screen.
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          this.observer.unobserve(entry.target)
          const slot = this.slots.find((s) => s.el === entry.target)
          if (slot) this.load(slot)
        }
      },
      { rootMargin: '300px' },
    )

    this.renderer.setAnimationLoop(() => this.render())
  }

  add(el: HTMLElement, model: Project['model']) {
    const canvas = document.createElement('canvas')
    el.append(canvas)

    const scene = new THREE.Scene()
    scene.environment = this.env
    // Just enough environment for reflections and to lift the shadows; the lights do the shaping.
    scene.environmentIntensity = 0.35
    addLights(scene)

    const turntable = new THREE.Group()
    scene.add(turntable)

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50)
    const slot: Slot = {
      el,
      model,
      canvas,
      ctx: canvas.getContext('2d')!,
      scene,
      camera,
      turntable,
      yaw: -0.6,
      spin: 0,
      dragging: false,
      loaded: false,
    }
    this.slots.push(slot)
    this.observer.observe(el)
    this.bindDrag(slot)
  }

  private async load(slot: Slot) {
    const { url, rotation = [0, 0, 0], scale = 1 } = slot.model
    const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}${url}`)

    // Stand the model up first, so centering uses its upright bounds.
    const model = new THREE.Group()
    model.add(gltf.scene)
    model.rotation.set(...(rotation.map(THREE.MathUtils.degToRad) as [number, number, number]))
    model.updateMatrixWorld(true)
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true
    })

    // Center on the turntable and scale to a unit bounding sphere.
    const box = new THREE.Box3().setFromObject(model)
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    model.position.sub(sphere.center)
    const holder = new THREE.Group()
    holder.add(model)
    holder.scale.setScalar(scale / sphere.radius)

    slot.turntable.add(holder)
    slot.loaded = true
  }

  /** Horizontal drag spins the model; vertical drags still scroll the page on touch. */
  private bindDrag(slot: Slot) {
    let lastX = 0
    let lastT = 0
    slot.el.addEventListener('pointerdown', (e) => {
      slot.dragging = true
      lastX = e.clientX
      lastT = e.timeStamp
      slot.el.setPointerCapture(e.pointerId)
    })
    slot.el.addEventListener('pointermove', (e) => {
      if (!slot.dragging) return
      const dx = e.clientX - lastX
      const dt = Math.max(1, e.timeStamp - lastT) / 1000
      slot.yaw += dx * 0.01
      slot.spin = (dx * 0.01) / dt - TURNTABLE_SPEED
      lastX = e.clientX
      lastT = e.timeStamp
    })
    const end = () => (slot.dragging = false)
    slot.el.addEventListener('pointerup', end)
    slot.el.addEventListener('pointercancel', end)
  }

  private render() {
    this.timer.update()
    const dt = Math.min(this.timer.getDelta(), 0.1)
    const { renderer } = this
    const gl = renderer.domElement
    const dpr = Math.min(devicePixelRatio, 2)
    const speed = this.reducedMotion.matches ? 0 : TURNTABLE_SPEED

    for (const slot of this.slots) {
      if (!slot.loaded) continue

      if (!slot.dragging) {
        slot.spin *= Math.exp(-dt * 3)
        slot.yaw += (speed + slot.spin) * dt
      }
      slot.turntable.rotation.y = slot.yaw

      const r = slot.canvas.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight || r.width < 2 || r.height < 2) continue

      const w = Math.round(r.width * dpr)
      const h = Math.round(r.height * dpr)
      if (slot.canvas.width !== w || slot.canvas.height !== h) {
        slot.canvas.width = w
        slot.canvas.height = h
      }
      // Grow the shared drawing buffer when a bigger viewer shows up; never shrink it.
      if (gl.width < w || gl.height < h) renderer.setSize(Math.max(gl.width, w), Math.max(gl.height, h), false)

      const cam = slot.camera
      cam.aspect = w / h
      // Pull back far enough that the unit sphere fits both ways.
      const vFov = THREE.MathUtils.degToRad(FOV) / 2
      const fit = Math.max(1 / Math.sin(vFov), 1 / Math.sin(Math.atan(Math.tan(vFov) * cam.aspect)))
      const dist = fit * FRAMING
      cam.position.set(0, Math.sin(CAMERA_PITCH) * dist, Math.cos(CAMERA_PITCH) * dist)
      cam.lookAt(0, 0, 0)
      cam.updateProjectionMatrix()

      // Render into the bottom-left corner, then copy that corner (top-down in canvas space).
      renderer.setViewport(0, 0, w, h)
      renderer.setScissor(0, 0, w, h)
      renderer.setScissorTest(true)
      renderer.render(slot.scene, cam)

      slot.ctx.clearRect(0, 0, w, h)
      slot.ctx.drawImage(gl, 0, gl.height - h, w, h, 0, 0, w, h)
    }
  }
}
