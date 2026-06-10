// Renders assets/*.svg to assets/*.png using playwright-core (Chromium).
// Run once: node scripts/gen-icons.js
const { chromium } = require('playwright-core')
const path = require('path')
const fs = require('fs')

const ASSETS = path.join(__dirname, '../assets')

const icons = [
  { svg: 'icon.svg',  png: 'icon.png',            width: 512, height: 512 },
  { svg: 'tray.svg',  png: 'trayTemplate.png',    width: 16,  height: 16  },
  { svg: 'tray.svg',  png: 'trayTemplate@2x.png', width: 32,  height: 32  },
]

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const { svg, png, width, height } of icons) {
    const svgContent = fs.readFileSync(path.join(ASSETS, svg), 'utf8')
    await page.setViewportSize({ width, height })
    await page.setContent(
      `<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent">${svgContent}</body></html>`
    )
    const outPath = path.join(ASSETS, png)
    await page.screenshot({ path: outPath, omitBackground: true })
    console.log(`Written: assets/${png}  (${fs.statSync(outPath).size} bytes)`)
  }

  await browser.close()
})()
