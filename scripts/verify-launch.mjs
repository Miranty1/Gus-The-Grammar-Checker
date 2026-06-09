import { _electron as electron } from 'playwright-core'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '..')
const SHOT_DIR = '/tmp/gus-shots'
fs.mkdirSync(SHOT_DIR, { recursive: true })

const electronBin = path.join(
  APP_DIR,
  'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'
)

console.log('Launching Gus via Playwright _electron...')
const env = { ...process.env, NODE_ENV: 'production' }
delete env.ELECTRON_RUN_AS_NODE

const app = await electron.launch({
  executablePath: electronBin,
  args: [APP_DIR],
  env,
  timeout: 30_000,
})

// Wait for the window to finish rendering
await new Promise(r => setTimeout(r, 4000))

const windows = app.windows()
console.log(`Windows open: ${windows.length}`)
for (const w of windows) console.log(' ', w.url())

const page = windows.find(w => !w.url().startsWith('devtools://')) ?? await app.firstWindow()

const shotPath = path.join(SHOT_DIR, 'hello-world.png')
await page.screenshot({ path: shotPath })
console.log('Screenshot saved:', shotPath)

const bodyText = await page.evaluate(() => document.body.innerText)
console.log('Body text:', bodyText.trim().slice(0, 200))

await app.close()
console.log('Done.')
