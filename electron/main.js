const { app, BrowserWindow, globalShortcut, clipboard, screen } = require('electron')
const path = require('node:path')

const isDev = process.env.NODE_ENV === 'development'

let mainWindow = null

function createWindow() {
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
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  globalShortcut.register('CommandOrControl+Shift+G', () => {
    if (mainWindow) {
      mainWindow.close()
    } else {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
