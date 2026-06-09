const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data)
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data)
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
