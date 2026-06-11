const { app, BrowserWindow, globalShortcut, clipboard, screen, Tray, nativeImage, Menu, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = process.env.NODE_ENV === 'development'

if (process.platform === 'darwin') app.dock.hide()

let mainWindow = null
let tray = null

const WINDOW_WIDTH = 520

// ── Settings persistence ────────────────────────────────────────────────────

function configPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), 'utf8'))
  } catch {
    return { shortcut: 'CommandOrControl+Alt+G' }
  }
}

function saveSettings(data) {
  fs.writeFileSync(configPath(), JSON.stringify(data, null, 2))
}

// ── Usage persistence ───────────────────────────────────────────────────────

function usagePath() {
  return path.join(app.getPath('userData'), 'usage.json')
}

async function loadUsage() {
  try {
    const raw = await fs.promises.readFile(usagePath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ALLOWED_MODES = new Set(['grammar', 'refinement', 'tone', 'concise'])

async function recordUsage(mode) {
  const today = localDateString()
  const data = await loadUsage()
  if (!data[today]) data[today] = {}
  data[today][mode] = (data[today][mode] || 0) + 1
  await fs.promises.writeFile(usagePath(), JSON.stringify(data, null, 2))
}

let currentShortcut = 'CommandOrControl+Alt+G'

// ── Window helpers ──────────────────────────────────────────────────────────

function getWindowPosition(windowWidth = WINDOW_WIDTH) {
  const { x, y, width, height } = tray.getBounds()
  const { workArea } = screen.getDisplayNearestPoint({ x, y })
  const xPos = Math.round(x - windowWidth / 2 + width / 2)
  const clamped = Math.max(workArea.x, Math.min(xPos, workArea.x + workArea.width - windowWidth))
  return { x: clamped, y: workArea.y }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: 494,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

}

// ── Triggers ────────────────────────────────────────────────────────────────

const MAX_INPUT_LENGTH = 5000

function triggerGus() {
  if (!mainWindow?.webContents) return
  const text = clipboard.readText().trim()
  if (!text) return
  const truncated = text.length > MAX_INPUT_LENGTH
  const clipped = truncated ? text.slice(0, MAX_INPUT_LENGTH) : text
  const payload = { text: clipped, truncated }
  const { x, y } = getWindowPosition()
  mainWindow.setPosition(x, y)
  mainWindow.show()
  mainWindow.webContents.send('clipboard-text', payload)
}

function triggerSettings() {
  if (!mainWindow?.webContents) return
  const { x, y } = getWindowPosition()
  mainWindow.setPosition(x, y)
  mainWindow.show()
  mainWindow.webContents.send('open-settings')
}

// ── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(() => {
  currentShortcut = loadSettings().shortcut

  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/trayTemplate.png'))
  trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)
  tray.setToolTip('Gus — Grammar Checker')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Gus', click: triggerGus },
      { label: 'Settings...', click: triggerSettings },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  )
  tray.on('click', triggerGus)

  createWindow()
  globalShortcut.register(currentShortcut, triggerGus)

  fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3.1:8b', prompt: 'hi', stream: false, num_predict: 1 }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
})

// ── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.on('close-window', () => { if (mainWindow) mainWindow.hide() })
ipcMain.on('write-clipboard', (_e, text) => {
  if (typeof text !== 'string') return
  clipboard.writeText(text.slice(0, MAX_INPUT_LENGTH * 2))
})

ipcMain.handle('load-settings', () => loadSettings())

ipcMain.on('record-usage', (_, mode) => {
  if (ALLOWED_MODES.has(mode)) recordUsage(mode).catch(() => {})
})
ipcMain.handle('load-usage', () => loadUsage())

ipcMain.handle('save-shortcut', (_, newShortcut) => {
  if (typeof newShortcut !== 'string' || !newShortcut.trim()) {
    return { ok: false, error: 'Shortcut must be a non-empty string.' }
  }
  const ok = globalShortcut.register(newShortcut, triggerGus)
  if (ok) {
    globalShortcut.unregister(currentShortcut)
    currentShortcut = newShortcut
    saveSettings({ shortcut: newShortcut })
    return { ok: true }
  }
  return { ok: false, error: 'Shortcut could not be registered — it may be in use by another app.' }
})

// Without this handler, Electron's default is to quit when all windows close — even on macOS.
// Subscribe and do nothing on macOS so the tray app keeps running after the popup is dismissed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (tray) tray.destroy()
})
