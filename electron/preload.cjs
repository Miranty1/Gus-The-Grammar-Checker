const { contextBridge, ipcRenderer } = require('electron')

const SEND_CHANNELS = ['close-window', 'write-clipboard', 'record-usage']
const INVOKE_CHANNELS = ['load-settings', 'save-shortcut', 'load-usage']
const LISTEN_CHANNELS = ['clipboard-text', 'open-settings']

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    if (SEND_CHANNELS.includes(channel)) ipcRenderer.send(channel, data)
  },
  invoke: (channel, data) => {
    if (INVOKE_CHANNELS.includes(channel)) return ipcRenderer.invoke(channel, data)
  },
  on: (channel, callback) => {
    if (LISTEN_CHANNELS.includes(channel))
      ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  removeAllListeners: (channel) => {
    if (LISTEN_CHANNELS.includes(channel)) ipcRenderer.removeAllListeners(channel)
  },
})
