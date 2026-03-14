/**
 * LobbyScene — Steam lobby creation and joining UI.
 *
 * Host creates a lobby, sees a lobby code, and waits for guests.
 * Guest enters the lobby code and joins.
 * "Local Test" mode creates a paired in-process bridge for dev testing.
 * Once all players are ready, host starts the run → LoadoutScene.
 */

import { TitleScene } from './TitleScene'
import { LoadoutScene } from './LoadoutScene'
import { NetworkHost } from '../network/NetworkHost'
import { NetworkGuest } from '../network/NetworkGuest'
import { createLocalPair } from '../network/LocalNetworkBridge'
import type { NetworkBridge } from '../network/NetworkBridge'
import type { Scene, SceneContext } from './Scene'

type LobbyState = 'menu' | 'hosting' | 'joining' | 'joined' | 'local'

interface SteamAPI {
  isOnline(): Promise<boolean>
  getPlayerName(): Promise<string | null>
  getSteamId(): Promise<string | null>
  createLobby(maxPlayers: number): Promise<string | null>
  joinLobby(lobbyId: string): Promise<boolean>
  leaveLobby(): Promise<void>
  getLobbyMembers(): Promise<string[]>
}

function getSteamAPI(): SteamAPI | null {
  const api = (window as any).steamAPI
  return api ?? null
}

async function isSteamOnline(): Promise<boolean> {
  try {
    const steam = getSteamAPI()
    return steam ? await steam.isOnline() : false
  } catch {
    return false
  }
}

export class LobbyScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private state: LobbyState = 'menu'
  private lobbyId: string | null = null
  private bridge: NetworkBridge | null = null
  private memberPollInterval: ReturnType<typeof setInterval> | null = null
  private steamAvailable = false

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    this.root = document.createElement('div')
    this.root.id = 'lobby-screen'
    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)

    // Show loading while we check Steam
    this.root.innerHTML = `<h2 class="lobby-title">MULTIPLAYER</h2><div class="lobby-status">Checking Steam...</div>`

    isSteamOnline().then((online) => {
      this.steamAvailable = online
      this.renderMenu()
    })

    ctx.ready()
  }

  deactivate(): void {
    this.stopMemberPolling()
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  // ── Render states ──

  private renderMenu(): void {
    this.state = 'menu'
    this.root.innerHTML = `
      <h2 class="lobby-title">MULTIPLAYER</h2>
      <div class="lobby-actions">
        <button class="lobby-btn ${this.steamAvailable ? '' : 'disabled'}" data-action="host">Host Game</button>
        <button class="lobby-btn ${this.steamAvailable ? '' : 'disabled'}" data-action="join">Join Game</button>
        <button class="lobby-btn lobby-btn-local" data-action="local">Local Test</button>
        <button class="lobby-btn lobby-btn-back" data-action="back">Back</button>
      </div>
      ${!this.steamAvailable ? '<div class="lobby-status">Steam not available — use Local Test for development</div>' : ''}
    `
  }

  // ── Local test mode ──

  private startLocalTest(): void {
    this.state = 'local'
    const pair = createLocalPair()

    // We play as host; the guest bridge exists but has no real player behind it.
    // This lets us test the full network flow — messages route through the pair.
    this.bridge = pair.host

    // Log guest-side messages to console for debugging
    pair.guest.onMessage((msg) => {
      console.log('[LocalTest] Guest received:', msg.type, msg)
    })

    this.root.innerHTML = `
      <h2 class="lobby-title">LOCAL TEST</h2>
      <div class="lobby-status">Running with in-process network bridge.<br>You are the host. Guest messages log to console.</div>
      <div class="lobby-members">
        <div class="lobby-members-label">Players (2)</div>
        <div class="lobby-member">Host (you)</div>
        <div class="lobby-member">Guest (simulated)</div>
      </div>
      <div class="lobby-actions">
        <button class="lobby-btn lobby-btn-start" data-action="start">START</button>
        <button class="lobby-btn lobby-btn-back" data-action="leave">Leave</button>
      </div>
    `
  }

  // ── Steam hosting ──

  private async renderHosting(): Promise<void> {
    this.state = 'hosting'
    this.root.innerHTML = `
      <h2 class="lobby-title">CREATING LOBBY...</h2>
      <div class="lobby-status">Connecting to Steam...</div>
    `

    const steam = getSteamAPI()!
    const lobbyId = await steam.createLobby(4)

    if (!lobbyId) {
      this.root.innerHTML = `
        <h2 class="lobby-title">FAILED</h2>
        <div class="lobby-status">Could not create lobby. Is Steam running?</div>
        <div class="lobby-actions">
          <button class="lobby-btn lobby-btn-back" data-action="back">Back</button>
        </div>
      `
      return
    }

    this.lobbyId = lobbyId
    const host = new NetworkHost()
    await host.init()
    this.bridge = host

    this.root.innerHTML = `
      <h2 class="lobby-title">LOBBY</h2>
      <div class="lobby-code-section">
        <div class="lobby-code-label">Lobby Code</div>
        <div class="lobby-code" id="lobby-code">${lobbyId}</div>
        <button class="lobby-btn-small" data-action="copy">Copy</button>
      </div>
      <div class="lobby-members" id="lobby-members">
        <div class="lobby-members-label">Players</div>
      </div>
      <div class="lobby-actions">
        <button class="lobby-btn lobby-btn-start" data-action="start" id="lobby-start">START</button>
        <button class="lobby-btn lobby-btn-back" data-action="leave">Leave</button>
      </div>
    `

    this.startMemberPolling()
  }

  // ── Steam joining ──

  private renderJoinForm(): void {
    this.state = 'joining'
    this.root.innerHTML = `
      <h2 class="lobby-title">JOIN GAME</h2>
      <div class="lobby-join-form">
        <label class="lobby-code-label" for="lobby-code-input">Enter Lobby Code</label>
        <input class="lobby-input" id="lobby-code-input" type="text"
               placeholder="Lobby ID" autocomplete="off" spellcheck="false" />
        <div class="lobby-actions">
          <button class="lobby-btn" data-action="connect">Join</button>
          <button class="lobby-btn lobby-btn-back" data-action="back">Back</button>
        </div>
      </div>
    `
    setTimeout(() => {
      this.root.querySelector<HTMLInputElement>('#lobby-code-input')?.focus()
    }, 50)
  }

  private async attemptJoin(): Promise<void> {
    const input = this.root.querySelector<HTMLInputElement>('#lobby-code-input')
    const code = input?.value.trim()
    if (!code) return

    const statusEl = this.root.querySelector('.lobby-join-form')
    if (statusEl) {
      const existing = statusEl.querySelector('.lobby-join-status')
      if (existing) existing.remove()
      const status = document.createElement('div')
      status.className = 'lobby-join-status'
      status.textContent = 'Connecting...'
      statusEl.appendChild(status)
    }

    const steam = getSteamAPI()!
    const success = await steam.joinLobby(code)

    if (!success) {
      const status = this.root.querySelector('.lobby-join-status')
      if (status) status.textContent = 'Failed to join lobby. Check the code and try again.'
      return
    }

    this.lobbyId = code
    this.state = 'joined'

    const myId = await steam.getSteamId()
    const members = await steam.getLobbyMembers()
    const hostId = members.find((id) => id !== myId)

    if (!hostId) {
      const status = this.root.querySelector('.lobby-join-status')
      if (status) status.textContent = 'Could not find host in lobby.'
      return
    }

    const guest = new NetworkGuest()
    await guest.init(hostId)
    this.bridge = guest

    this.root.innerHTML = `
      <h2 class="lobby-title">LOBBY</h2>
      <div class="lobby-status">Joined! Waiting for host to start...</div>
      <div class="lobby-members" id="lobby-members">
        <div class="lobby-members-label">Players</div>
      </div>
      <div class="lobby-actions">
        <button class="lobby-btn lobby-btn-back" data-action="leave">Leave</button>
      </div>
    `

    this.startMemberPolling()

    guest.onMessage((msg) => {
      if (msg.type === 'sceneTransition' && msg.scene === 'loadout') {
        this.goToLoadout()
      }
    })
  }

  // ── Member list polling ──

  private startMemberPolling(): void {
    this.updateMemberList()
    this.memberPollInterval = setInterval(() => this.updateMemberList(), 2000)
  }

  private stopMemberPolling(): void {
    if (this.memberPollInterval) {
      clearInterval(this.memberPollInterval)
      this.memberPollInterval = null
    }
  }

  private async updateMemberList(): Promise<void> {
    const container = this.root.querySelector('#lobby-members')
    if (!container) return

    const steam = getSteamAPI()
    if (!steam) return
    const members = await steam.getLobbyMembers()

    container.innerHTML = `
      <div class="lobby-members-label">Players (${members.length})</div>
      ${members.map((id) => `<div class="lobby-member">${id}</div>`).join('')}
    `

    const startBtn = this.root.querySelector<HTMLButtonElement>('#lobby-start')
    if (startBtn) {
      startBtn.disabled = members.length < 2
      startBtn.classList.toggle('disabled', members.length < 2)
    }
  }

  // ── Navigation ──

  private goToLoadout(): void {
    this.stopMemberPolling()
    if (this.bridge) {
      this.ctx.networkBridge = this.bridge
    }
    this.ctx.switchTo(new LoadoutScene())
  }

  private async leaveLobby(): Promise<void> {
    this.stopMemberPolling()
    this.bridge?.dispose()
    this.bridge = null
    const steam = getSteamAPI()
    if (steam && this.lobbyId) {
      await steam.leaveLobby()
    }
    this.lobbyId = null
    this.renderMenu()
  }

  // ── Event handling ──

  private onClick = async (e: MouseEvent): Promise<void> => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (!btn || btn.classList.contains('disabled')) return
    const action = btn.dataset.action

    switch (action) {
      case 'host':
        await this.renderHosting()
        break
      case 'join':
        this.renderJoinForm()
        break
      case 'local':
        this.startLocalTest()
        break
      case 'connect':
        await this.attemptJoin()
        break
      case 'copy': {
        const code = this.root.querySelector('#lobby-code')?.textContent
        if (code) {
          navigator.clipboard.writeText(code).catch(() => {})
          btn.textContent = 'Copied!'
          setTimeout(() => { btn.textContent = 'Copy' }, 1500)
        }
        break
      }
      case 'start':
        if (this.bridge && (this.state === 'hosting' || this.state === 'local')) {
          this.bridge.send({ type: 'sceneTransition', scene: 'loadout' })
          this.goToLoadout()
        }
        break
      case 'leave':
        await this.leaveLobby()
        break
      case 'back':
        if (this.state === 'menu') {
          this.ctx.switchTo(new TitleScene())
        } else {
          this.renderMenu()
        }
        break
    }
  }
}
