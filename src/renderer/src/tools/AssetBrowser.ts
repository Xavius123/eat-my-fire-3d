import * as THREE from 'three'
import {
  AssetLibrary,
  PROTOTYPE_ASSET_CATALOG,
  registerPrototypeAssets
} from '../assets/AssetLibrary'
import { Engine } from '../engine/Engine'

const COLUMNS = 6
const CELL_SIZE = 2.2
const SECTION_GAP_ROWS = 2

interface CellVisual {
  root: THREE.Group
  marker: THREE.Mesh
}

export class AssetBrowser {
  private readonly engine: Engine
  private readonly assetLibrary: AssetLibrary

  private readonly worldPivot = new THREE.Group()
  private readonly worldContent = new THREE.Group()
  private readonly stageGroup = new THREE.Group()
  private readonly compassGroup = new THREE.Group()

  private readonly raycaster = new THREE.Raycaster()
  private readonly mouse = new THREE.Vector2()

  private readonly cellVisualById = new Map<string, CellVisual>()
  private readonly rowById = new Map<string, HTMLTableRowElement>()
  private selectedAssetId: string | null = null

  constructor(container: HTMLElement) {
    this.engine = new Engine(container)
    this.assetLibrary = new AssetLibrary()
    registerPrototypeAssets(this.assetLibrary)

    this.worldPivot.add(this.worldContent)
    this.worldContent.add(this.stageGroup)
    this.engine.scene.add(this.worldPivot)
    this.engine.setWorldRotator(this.worldPivot)

    this.createBackdropGrid()
    this.createCompassGuide()
    this.mountTable(container)
    this.setupInteraction()

    void this.loadAndBuild()
  }

  private async loadAndBuild(): Promise<void> {
    await this.assetLibrary.loadAll()

    const environmentEntries = PROTOTYPE_ASSET_CATALOG.filter(
      (entry) => entry.group === 'environment'
    )
    const characterEntries = PROTOTYPE_ASSET_CATALOG.filter(
      (entry) => entry.group === 'characters'
    )

    const environmentRows = this.placeSection(environmentEntries, 0)
    const characterStartRow = environmentRows + SECTION_GAP_ROWS
    const characterRows = this.placeSection(characterEntries, characterStartRow)

    const totalRows = Math.max(characterStartRow + characterRows, 1)
    this.positionCompass()

    const center = new THREE.Vector3(
      ((COLUMNS - 1) * CELL_SIZE) / 2,
      0,
      ((totalRows - 1) * CELL_SIZE) / 2
    )

    this.worldPivot.position.copy(center)
    this.worldContent.position.set(-center.x, -center.y, -center.z)

    this.engine.setGridCenter(center, Math.max(COLUMNS, totalRows) * CELL_SIZE)
    this.engine.setGridBounds(COLUMNS, totalRows, CELL_SIZE)
  }

  private placeSection(entries: typeof PROTOTYPE_ASSET_CATALOG, startRow: number): number {
    if (entries.length === 0) return 0

    entries.forEach((entry, index) => {
      const col = index % COLUMNS
      const row = startRow + Math.floor(index / COLUMNS)
      const x = col * CELL_SIZE
      const z = row * CELL_SIZE

      const cell = new THREE.Group()
      cell.position.set(x, 0, z)
      cell.userData = { ...cell.userData, assetId: entry.id }

      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 1.4),
        new THREE.MeshStandardMaterial({
          color: entry.group === 'environment' ? 0x373440 : 0x30403a,
          metalness: 0.05,
          roughness: 0.9
        })
      )
      pedestal.position.y = -0.04
      pedestal.userData = { ...pedestal.userData, assetId: entry.id }
      cell.add(pedestal)

      const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.78, 0.92, 32),
        new THREE.MeshBasicMaterial({
          color: 0x70c2ff,
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      )
      marker.rotation.x = -Math.PI / 2
      marker.position.y = 0.03
      marker.visible = false
      cell.add(marker)

      const model = this.assetLibrary.instantiate(entry.id)
      if (model) {
        this.alignModelForPreview(model)
        model.traverse((child) => {
          child.userData = { ...child.userData, assetId: entry.id }
        })
        cell.add(model)
      }

      this.stageGroup.add(cell)
      this.cellVisualById.set(entry.id, { root: cell, marker })
    })

    return Math.ceil(entries.length / COLUMNS)
  }

  private createBackdropGrid(): void {
    const grid = new THREE.GridHelper(80, 80, 0x2f2f3f, 0x20202a)
    grid.position.y = -0.045
    this.stageGroup.add(grid)
  }

  private createCompassGuide(): void {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.12, 40),
      new THREE.MeshBasicMaterial({
        color: 0x7e8aa8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    this.compassGroup.add(ring)

    const origin = new THREE.Vector3(0, 0.03, 0)
    const arrowLength = 0.92

    const directions: Array<{ label: string; dir: THREE.Vector3; color: number }> = [
      { label: 'N', dir: new THREE.Vector3(0, 0, -1), color: 0x5bc0ff },
      { label: 'E', dir: new THREE.Vector3(1, 0, 0), color: 0xffa955 },
      { label: 'S', dir: new THREE.Vector3(0, 0, 1), color: 0x78de7a },
      { label: 'W', dir: new THREE.Vector3(-1, 0, 0), color: 0xff7f9b }
    ]

    for (const direction of directions) {
      const arrow = new THREE.ArrowHelper(
        direction.dir,
        origin,
        arrowLength,
        direction.color,
        0.24,
        0.12
      )
      this.compassGroup.add(arrow)

      const label = this.createCompassLabel(direction.label, direction.color)
      label.position.copy(direction.dir.clone().multiplyScalar(arrowLength + 0.28))
      label.position.y = 0.22
      this.compassGroup.add(label)
    }

    this.stageGroup.add(this.compassGroup)
  }

  private positionCompass(): void {
    this.compassGroup.position.set(-CELL_SIZE * 1.4, 0, -CELL_SIZE * 1.4)
  }

  private createCompassLabel(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 80

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return new THREE.Sprite()
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(18, 20, 28, 0.9)'
    ctx.fillRect(22, 16, 116, 48)

    ctx.strokeStyle = `#${new THREE.Color(color).getHexString()}`
    ctx.lineWidth = 4
    ctx.strokeRect(22, 16, 116, 48)

    ctx.fillStyle = '#f3f6ff'
    ctx.font = 'bold 38px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    })

    const sprite = new THREE.Sprite(material)
    sprite.scale.set(0.64, 0.32, 1)
    return sprite
  }

  private alignModelForPreview(model: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(model)
    if (box.isEmpty()) {
      model.position.y += 0.04
      return
    }

    const center = box.getCenter(new THREE.Vector3())
    model.position.x -= center.x
    model.position.z -= center.z
    model.position.y -= box.min.y
    model.position.y += 0.04
  }

  private mountTable(container: HTMLElement): void {
    const panel = document.createElement('aside')
    panel.className = 'asset-browser-panel'

    panel.innerHTML = `
      <div class="asset-browser-title">Asset Browser</div>
      <div class="asset-browser-help">Rotate: right-drag, Pan: middle-drag, Zoom: wheel</div>
      <div class="asset-browser-help">Toggle with <code>F9</code> (or open with <code>?mode=assets</code>)</div>
      <div class="asset-browser-help">Click model or row to link selection</div>
      <div class="asset-browser-help">Compass axes: N = -Z, E = +X, S = +Z, W = -X</div>
      <div class="asset-browser-table-wrap">
        <table class="asset-browser-table">
          <thead>
            <tr><th>#</th><th>Group</th><th>Filename</th><th>Asset Id</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `

    container.append(panel)

    const tbody = panel.querySelector('tbody')!
    PROTOTYPE_ASSET_CATALOG.forEach((entry, index) => {
      const row = document.createElement('tr')
      row.dataset.assetId = entry.id
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.group}</td>
        <td>${entry.filename}</td>
        <td><code>${entry.id}</code></td>
      `

      row.addEventListener('click', () => {
        this.selectAsset(entry.id, true)
      })

      tbody.append(row)
      this.rowById.set(entry.id, row)
    })
  }

  private setupInteraction(): void {
    this.engine.canvas.addEventListener('click', (event) => {
      const assetId = this.pickAssetFromCanvas(event)
      if (assetId) {
        this.selectAsset(assetId, true)
      }
    })
  }

  private pickAssetFromCanvas(event: MouseEvent): string | null {
    const rect = this.engine.canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.engine.camera)
    const hits = this.raycaster.intersectObjects(this.stageGroup.children, true)

    for (const hit of hits) {
      const id = this.getAssetIdFromObject(hit.object)
      if (id) return id
    }

    return null
  }

  private getAssetIdFromObject(object: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = object
    while (current) {
      const candidate = current.userData?.assetId
      if (typeof candidate === 'string') {
        return candidate
      }
      current = current.parent
    }
    return null
  }

  private selectAsset(assetId: string, scrollIntoView: boolean): void {
    if (this.selectedAssetId === assetId) return

    if (this.selectedAssetId) {
      const previousRow = this.rowById.get(this.selectedAssetId)
      if (previousRow) {
        previousRow.classList.remove('selected')
      }
      const previousCell = this.cellVisualById.get(this.selectedAssetId)
      if (previousCell) {
        previousCell.marker.visible = false
      }
    }

    this.selectedAssetId = assetId

    const row = this.rowById.get(assetId)
    if (row) {
      row.classList.add('selected')
      if (scrollIntoView) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }

    const cell = this.cellVisualById.get(assetId)
    if (cell) {
      cell.marker.visible = true
    }
  }
}
