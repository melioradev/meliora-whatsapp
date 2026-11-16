// Regenerates docs/screenshots/ from the demo page: npm run screenshots
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';

const PORT = 8795;
const server = spawn(process.execPath, ['tests/server.mjs'], {env: {...process.env, PORT: String(PORT)}, stdio: 'ignore'});
await new Promise(r => setTimeout(r, 500));
const browser = await chromium.launch();
const at = (time) => new Date(`${time}+02:00`);
const shots = [
  {name: 'corner-light', width: 900, height: 560, scheme: 'light', path: '/?lang=en', time: '2026-11-16T10:00:00'},
  {name: 'away-dialog', width: 900, height: 560, scheme: 'light', path: '/?lang=en', time: '2026-11-16T18:00:00', click: true, decided: true},
  {name: 'away-dialog-dark-he', width: 900, height: 560, scheme: 'dark', path: '/?lang=he', time: '2026-11-20T14:00:00', click: true, decided: true},
  {name: 'mobile-sheet', width: 375, height: 720, scheme: 'light', path: '/?lang=en', time: '2026-11-16T10:00:00'},
];
try {
  for (const shot of shots) {
    const context = await browser.newContext({viewport: {width: shot.width, height: shot.height}, colorScheme: shot.scheme, timezoneId: 'Asia/Jerusalem', deviceScaleFactor: 2});
    const page = await context.newPage();
    await page.clock.install({time: at(shot.time)});
    if (shot.decided) await page.addInitScript(() => localStorage.setItem('meliora.consent', JSON.stringify({v: 1, id: 'x', policy: '', ts: new Date().toISOString(), method: 'reject-all', gpc: false, choices: {analytics: false}})));
    await page.goto(`http://127.0.0.1:${PORT}${shot.path}`);
    await page.waitForLoadState('load');
    if (shot.click) await page.locator('.mwa-btn').click();
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({path: `docs/screenshots/${shot.name}.png`});
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
