const { app, BrowserWindow, globalShortcut, clipboard, screen, Tray, nativeImage, nativeTheme, Menu, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = process.env.NODE_ENV === 'development'

if (process.platform === 'darwin') app.dock.hide()

let mainWindow = null
let tray = null

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

let currentShortcut = loadSettings().shortcut

// ── Window helpers ──────────────────────────────────────────────────────────

function getWindowPosition(windowWidth = 520) {
  const { x, y, width, height } = tray.getBounds()
  const { workArea } = screen.getDisplayNearestPoint({ x, y })
  const xPos = Math.round(x - windowWidth / 2 + width / 2)
  const clamped = Math.max(workArea.x, Math.min(xPos, workArea.x + workArea.width - windowWidth))
  return { x: clamped, y: Math.round(y + height) }
}

function createWindow(text = '', openSettings = false) {
  const { x, y } = getWindowPosition()

  mainWindow = new BrowserWindow({
    width: 520,
    height: 480,
    x,
    y,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    backgroundColor: '#ffffff',
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (openSettings) {
      mainWindow.webContents.send('open-settings')
    } else if (text) {
      mainWindow.webContents.send('clipboard-text', text)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── Triggers ────────────────────────────────────────────────────────────────

function triggerGus() {
  const text = clipboard.readText().trim()
  console.log('[gus] clipboard:', text.slice(0, 120))
  if (mainWindow) {
    mainWindow.focus()
    mainWindow.webContents.send('clipboard-text', text)
  } else {
    createWindow(text)
  }
}

function triggerSettings() {
  if (mainWindow) {
    mainWindow.focus()
    mainWindow.webContents.send('open-settings')
  } else {
    createWindow('', true)
  }
}

// ── App lifecycle ───────────────────────────────────────────────────────────

function loadTrayIcon(dark) {
  const name = dark ? 'tray-dark' : 'tray-light'
  // Electron auto-picks tray-dark@2x.png / tray-light@2x.png on Retina displays
  return nativeImage.createFromPath(path.join(__dirname, '../assets', `${name}.png`))
}

function updateTrayIcon() {
  tray.setImage(loadTrayIcon(nativeTheme.shouldUseDarkColors))
}

app.whenReady().then(() => {
  tray = new Tray(loadTrayIcon(nativeTheme.shouldUseDarkColors))
  nativeTheme.on('updated', updateTrayIcon)
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

  globalShortcut.register(currentShortcut, triggerGus)
})

// ── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.on('close-window', () => { if (mainWindow) mainWindow.close() })
ipcMain.on('write-clipboard', (_e, text) => { clipboard.writeText(text) })

ipcMain.handle('load-settings', () => loadSettings())

ipcMain.handle('save-shortcut', (_, newShortcut) => {
  globalShortcut.unregister(currentShortcut)
  const ok = globalShortcut.register(newShortcut, triggerGus)
  if (ok) {
    currentShortcut = newShortcut
    saveSettings({ shortcut: newShortcut })
    return { ok: true }
  }
  globalShortcut.register(currentShortcut, triggerGus)
  return { ok: false, error: 'Shortcut could not be registered — it may be in use by another app.' }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (tray) tray.destroy()
})
