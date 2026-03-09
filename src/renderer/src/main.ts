import './style.css'
import { AssetBrowser } from './tools/AssetBrowser'
import { SceneManager } from './scenes/SceneManager'
import { TitleScene } from './scenes/TitleScene'

const container = document.getElementById('app')!
const params = new URLSearchParams(window.location.search)
const mode = params.get('mode')

function switchMode(nextMode: 'game' | 'assets'): void {
  const url = new URL(window.location.href)
  if (nextMode === 'assets') {
    url.searchParams.set('mode', 'assets')
  } else {
    url.searchParams.delete('mode')
  }
  window.location.href = url.toString()
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'F9') {
    switchMode(mode === 'assets' ? 'game' : 'assets')
  }
})

if (mode === 'assets') {
  new AssetBrowser(container)
} else {
  const sm = new SceneManager(container)
  sm.start(new TitleScene())
}
