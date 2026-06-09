const { app, BrowserWindow, globalShortcut, clipboard, screen, Tray, nativeImage, Menu, ipcMain } = require('electron')
const path = require('node:path')

const isDev = process.env.NODE_ENV === 'development'

if (process.platform === 'darwin') app.dock.hide()

let mainWindow = null
let tray = null

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

function createWindow(text = '') {
  const { x, y } = screen.getCursorScreenPoint()

  mainWindow = new BrowserWindow({
    width: 520,
    height: 400,
    x: x - 260,
    y: y - 200,
    frame: false,
    transparent: false,
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (text) mainWindow.webContents.send('clipboard-text', text)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/trayTemplate.png'))
  tray = new Tray(icon)
  tray.setToolTip('Gus — Grammar Checker')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Gus', click: triggerGus },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  )
  tray.on('click', triggerGus)

  globalShortcut.register('CommandOrControl+Alt+G', triggerGus)
})

ipcMain.on('close-window', () => { if (mainWindow) mainWindow.close() })
ipcMain.on('write-clipboard', (_e, text) => { clipboard.writeText(text) })

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
