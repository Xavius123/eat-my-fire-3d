import * as THREE from 'three'

export class Engine {
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera

  // Camera stays fixed; we rotate the world around the grid center.
  private readonly baseCameraAngle = Math.PI / 4
  private viewAngle = Math.PI / 4 + Math.PI
  private targetViewAngle = Math.PI / 4 + Math.PI

  private readonly cameraElevation = Math.atan(1 / Math.sqrt(2)) // ~35.264 deg true isometric
  private cameraDistance = 40
  private readonly baseFov = 15 // Narrow FOV = near-orthographic with natural depth cues
  private zoom = 1
  private readonly minZoom = 0.5
  private readonly maxZoom = 3

  private gridCenter = new THREE.Vector3()
  private panOffset = new THREE.Vector3()

  // Grid bounds used to clamp panning target (in world space)
  private minCenterX = Number.NEGATIVE_INFINITY
  private maxCenterX = Number.POSITIVE_INFINITY
  private minCenterZ = Number.NEGATIVE_INFINITY
  private maxCenterZ = Number.POSITIVE_INFINITY

  private worldRotator: THREE.Object3D | null = null

  // Right-click drag rotation
  private isRotating = false
  private rotateStartX = 0
  private rotateStartAngle = 0

  // Middle-click drag panning (screen-space deltas)
  private isPanning = false
  private panLastX = 0
  private panLastY = 0

  private rotationEnabled = true

  private animationId = 0
  private container: HTMLElement
  private updateCallbacks: Array<(dt: number) => void> = []
  private lastTime = 0

  // Stored for cleanup in dispose()
  private onWheel!: (e: WheelEvent) => void
  private onKeydown!: (e: KeyboardEvent) => void
  private onMousedown!: (e: MouseEvent) => void
  private onMousemove!: (e: MouseEvent) => void
  private onMouseup!: (e: MouseEvent) => void
  private onContextmenu!: (e: Event) => void
  private onResize!: () => void

  constructor(container: HTMLElement) {
    this.container = container

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0x1a1a2e)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(this.renderer.domElement)

    // Scene
    this.scene = new THREE.Scene()

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    this.scene.add(ambient)

    const hemisphere = new THREE.HemisphereLight(0xe6eeff, 0x2b2430, 0.55)
    this.scene.add(hemisphere)

    const key = new THREE.DirectionalLight(0xfff3dd, 1.2)
    key.position.set(8, 14, 8)
    key.castShadow = true
    key.shadow.mapSize.set(4096, 4096)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 80
    key.shadow.camera.left = -24
    key.shadow.camera.right = 24
    key.shadow.camera.top = 24
    key.shadow.camera.bottom = -24
    key.shadow.bias = -0.00015
    key.shadow.normalBias = 0.01
    this.scene.add(key)

    const fill = new THREE.DirectionalLight(0xc7dbff, 0.45)
    fill.position.set(-10, 8, -6)
    this.scene.add(fill)

    const rim = new THREE.DirectionalLight(0xffffff, 0.3)
    rim.position.set(0, 10, -12)
    this.scene.add(rim)

    const topDown = new THREE.DirectionalLight(0xffffff, 0.35)
    topDown.position.set(0, 20, 0)
    this.scene.add(topDown)

    // Camera - perspective with narrow FOV for near-isometric look
    const aspect = container.clientWidth / container.clientHeight
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      aspect,
      0.1,
      1000
    )
    this.updateCameraPosition()

    // Input
    this.setupInput()

    // Start game loop
    this.loop()
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  get containerElement(): HTMLElement {
    return this.container
  }

  onUpdate(callback: (deltaTime: number) => void): void {
    this.updateCallbacks.push(callback)
  }

  removeUpdate(callback: (deltaTime: number) => void): void {
    const idx = this.updateCallbacks.indexOf(callback)
    if (idx !== -1) this.updateCallbacks.splice(idx, 1)
  }

  /** Instantly snap the view rotation to a specific angle (no lerp). */
  setViewAngle(angle: number): void {
    this.viewAngle = angle
    this.targetViewAngle = angle
    this.applyWorldRotation()
    this.updateCameraPosition()
  }

  setRotationEnabled(enabled: boolean): void {
    this.rotationEnabled = enabled
    if (!enabled) this.isRotating = false
  }

  clearGridBounds(): void {
    this.minCenterX = Number.NEGATIVE_INFINITY
    this.maxCenterX = Number.POSITIVE_INFINITY
    this.minCenterZ = Number.NEGATIVE_INFINITY
    this.maxCenterZ = Number.POSITIVE_INFINITY
    this.panOffset.set(0, 0, 0)
    this.updateCameraPosition()
  }

  setWorldRotator(object: THREE.Object3D): void {
    this.worldRotator = object
    this.applyWorldRotation()
  }

  setGridCenter(center: THREE.Vector3, size: number): void {
    this.gridCenter.copy(center)
    this.panOffset.set(0, 0, 0)
    this.cameraDistance =
      (size * 2) / (2 * Math.tan((this.baseFov * Math.PI) / 360))
    this.clampPanOffset()
    this.updateCameraPosition()
    this.applyWorldRotation()
  }

  setGridBounds(width: number, height: number, tileSize: number): void {
    // Keep a small board margin in view so panning doesn't hard-stop at tile edges.
    const edgeMargin = tileSize * 0.75
    const boardMinX = 0
    const boardMaxX = (width - 1) * tileSize
    const boardMinZ = 0
    const boardMaxZ = (height - 1) * tileSize

    this.minCenterX = Math.min(boardMinX + edgeMargin, boardMaxX)
    this.maxCenterX = Math.max(boardMaxX - edgeMargin, boardMinX)
    this.minCenterZ = Math.min(boardMinZ + edgeMargin, boardMaxZ)
    this.maxCenterZ = Math.max(boardMaxZ - edgeMargin, boardMinZ)

    this.clampPanOffset()
    this.updateCameraPosition()
  }

  private applyWorldRotation(): void {
    if (!this.worldRotator) return
    // Mimic prior camera rotation feel by rotating world inversely.
    this.worldRotator.rotation.y = this.baseCameraAngle - this.viewAngle
  }

  private clampPanOffset(): void {
    const clampedX = THREE.MathUtils.clamp(
      this.gridCenter.x + this.panOffset.x,
      this.minCenterX,
      this.maxCenterX
    )
    const clampedZ = THREE.MathUtils.clamp(
      this.gridCenter.z + this.panOffset.z,
      this.minCenterZ,
      this.maxCenterZ
    )

    this.panOffset.x = clampedX - this.gridCenter.x
    this.panOffset.z = clampedZ - this.gridCenter.z
  }

  private updateCameraPosition(): void {
    const d = this.cameraDistance
    const elev = this.cameraElevation
    const angle = this.baseCameraAngle

    const lookAtX = this.gridCenter.x + this.panOffset.x
    const lookAtY = this.gridCenter.y
    const lookAtZ = this.gridCenter.z + this.panOffset.z

    this.camera.position.set(
      lookAtX + d * Math.cos(elev) * Math.sin(angle),
      lookAtY + d * Math.sin(elev),
      lookAtZ + d * Math.cos(elev) * Math.cos(angle)
    )
    this.camera.lookAt(lookAtX, lookAtY, lookAtZ)
  }

  private setupInput(): void {
    const canvas = this.renderer.domElement

    this.onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      this.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.zoom * factor)
      )
      this.camera.fov = this.baseFov / this.zoom
      this.camera.updateProjectionMatrix()
    }
    canvas.addEventListener('wheel', this.onWheel, { passive: false })

    this.onKeydown = (e: KeyboardEvent): void => {
      if (!this.rotationEnabled) return
      if (e.key === 'q' || e.key === 'Q') {
        this.targetViewAngle -= Math.PI / 2
      } else if (e.key === 'e' || e.key === 'E') {
        this.targetViewAngle += Math.PI / 2
      }
    }
    window.addEventListener('keydown', this.onKeydown)

    this.onMousedown = (e: MouseEvent): void => {
      if (e.button === 2) {
        if (this.rotationEnabled) {
          this.isRotating = true
          this.rotateStartX = e.clientX
          this.rotateStartAngle = this.viewAngle
        }
        e.preventDefault()
      } else if (e.button === 1) {
        this.isPanning = true
        this.panLastX = e.clientX
        this.panLastY = e.clientY
        e.preventDefault()
      }
    }
    canvas.addEventListener('mousedown', this.onMousedown)

    this.onMousemove = (e: MouseEvent): void => {
      if (this.isRotating) {
        const dx = e.clientX - this.rotateStartX
        this.viewAngle = this.rotateStartAngle - dx * 0.01
        this.targetViewAngle = this.viewAngle
        this.applyWorldRotation()
      } else if (this.isPanning) {
        const dx = e.clientX - this.panLastX
        const dy = e.clientY - this.panLastY
        this.panLastX = e.clientX
        this.panLastY = e.clientY

        const rect = canvas.getBoundingClientRect()
        if (rect.height <= 0) return

        const fovRad = THREE.MathUtils.degToRad(this.camera.fov)
        const worldPerPixel =
          (2 * this.cameraDistance * Math.tan(fovRad / 2)) / rect.height
        const groundScale = worldPerPixel / Math.cos(this.cameraElevation)

        const right = new THREE.Vector3(
          Math.cos(this.baseCameraAngle),
          0,
          -Math.sin(this.baseCameraAngle)
        )
        const forward = new THREE.Vector3(
          Math.sin(this.baseCameraAngle),
          0,
          Math.cos(this.baseCameraAngle)
        )

        const panDelta = right
          .multiplyScalar(-dx * groundScale)
          .add(forward.multiplyScalar(-dy * groundScale))

        this.panOffset.add(panDelta)
        this.clampPanOffset()
        this.updateCameraPosition()
      }
    }
    window.addEventListener('mousemove', this.onMousemove)

    this.onMouseup = (e: MouseEvent): void => {
      if (e.button === 2 && this.isRotating) {
        this.isRotating = false
        this.targetViewAngle =
          Math.round((this.viewAngle - Math.PI / 4) / (Math.PI / 2)) *
            (Math.PI / 2) +
          Math.PI / 4
      } else if (e.button === 1) {
        this.isPanning = false
      }
    }
    window.addEventListener('mouseup', this.onMouseup)

    this.onContextmenu = (e: Event): void => {
      e.preventDefault()
    }
    canvas.addEventListener('contextmenu', this.onContextmenu)

    this.onResize = (): void => {
      this.renderer.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      )
      this.camera.aspect =
        this.container.clientWidth / this.container.clientHeight
      this.camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', this.onResize)
  }

  private loop = (time: number = 0): void => {
    this.animationId = requestAnimationFrame(this.loop)

    const dt = Math.min((time - this.lastTime) / 1000, 0.1)
    this.lastTime = time

    // Animate world rotation toward target.
    if (!this.isRotating) {
      const diff = this.targetViewAngle - this.viewAngle
      if (Math.abs(diff) > 0.001) {
        this.viewAngle += diff * 0.15
        this.applyWorldRotation()
      }
    }

    // Run update callbacks
    for (const cb of this.updateCallbacks) {
      cb(dt)
    }

    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId)
    const canvas = this.renderer.domElement
    canvas.removeEventListener('wheel', this.onWheel)
    canvas.removeEventListener('mousedown', this.onMousedown)
    canvas.removeEventListener('contextmenu', this.onContextmenu)
    window.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('mousemove', this.onMousemove)
    window.removeEventListener('mouseup', this.onMouseup)
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
    canvas.parentElement?.removeChild(canvas)
  }
}




