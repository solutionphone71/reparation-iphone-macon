// Offline browser test: no live customer request, form submission or site publish.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('/Users/sebastiencannard/Documents/Codex/2026-11-11/retire-v1-v2-stock/node_modules/playwright-core');

const origin = 'https://reparation-iphone-macon.fr';
const root = join(__dirname, '..');
const legacy = 'https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/public-catalog?resource=prices';
const screens = Array.from({ length: 25 }, (_, i) => ({ modele: `Test ${i}`, prix: [60, null, null, null, null] }));
screens[0] = { modele: '15', prix: [70, null, null, 90, null] };
screens[1] = { modele: '17', prix: [null, 65, null, 125, null] };
const batteries = [{ modele: '15', prix: [55, 65, 115] }];

async function scenario(browser, path, { missingAsset = false, legacyFails = false } = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 375, height: 812 } });
  const counts = { asset: 0, legacy: 0, post: 0 };
  try {
    const page = await context.newPage();
    await context.route('**/*', async (route) => {
      const request = route.request(), url = request.url();
      if (request.method() !== 'GET') { counts.post++; return route.abort(); }
      if (url === legacy) {
        counts.legacy++;
        return route.fulfill({ status: legacyFails ? 503 : 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': origin }, body: JSON.stringify({ prices: { screens: [{ modele: '15', prix: [70, null, null, 105, null] }], batteries } }) });
      }
      if (url === `${origin}/apple-screens-20261112-v2.js`) {
        counts.asset++;
        return route.fulfill({ status: missingAsset ? 404 : 200, contentType: 'text/javascript',
          body: missingAsset ? '' : `window.SolutionPhoneApprovedIphoneScreens=${JSON.stringify(screens)};` });
      }
      if (url.startsWith(`${origin}/`) && !url.includes('?')) {
        const file = join(root, new URL(url).pathname.slice(1) || 'index.html');
        try { return route.fulfill({ status: 200, contentType: file.endsWith('.html') ? 'text/html' : 'text/javascript', body: readFileSync(file) }); }
        catch { return route.abort(); }
      }
      return route.abort();
    });
    await page.goto(`${origin}/${path}`, { waitUntil: 'domcontentloaded' });
    if (counts.legacy === 0) await page.waitForFunction(() => document.querySelector('#pb, [data-type="batterie"]')?.textContent?.includes('55'));
    await page.waitForTimeout(120);
    return { counts, data: await page.evaluate(() => ({
      screens: (document.querySelector('#pe, [data-type="ecran"]')?.textContent ?? '').replace(/\u00a0/g, ' '),
      batteries: (document.querySelector('#pb, [data-type="batterie"]')?.textContent ?? '').replace(/\u00a0/g, ' '),
      detail: document.querySelector('#prix-date')?.textContent ?? '',
      screenOffers: [...document.querySelectorAll('script[type="application/ld+json"]')].some((script) => script.textContent.includes('Remplacement écran')),
    })) };
  } finally { await context.close(); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    const home = await scenario(browser, '');
    assert(home.data.screens.includes('90 €') && !home.data.screens.includes('105 €'));
    assert(home.data.batteries.includes('55 €'));
    assert.deepEqual(home.counts, { asset: 1, legacy: 1, post: 0 });
    const model15 = await scenario(browser, 'iphone-15.html');
    assert(model15.data.screens.includes('90 €') && !model15.data.screens.includes('105 €'));
    assert(model15.data.batteries.includes('55 €') && !model15.data.screenOffers);
    const model17 = await scenario(browser, 'iphone-17.html');
    assert(model17.data.screens.includes('125 €'));
    assert(!model17.data.batteries.includes('€'));
    const noAsset = await scenario(browser, 'iphone-15.html', { missingAsset: true });
    assert(noAsset.data.screens.includes('Sur devis') && !noAsset.data.screens.includes('105 €'));
    assert(noAsset.data.batteries.includes('55 €'));
    const noLegacy = await scenario(browser, '', { legacyFails: true });
    assert(noLegacy.data.screens.includes('90 €') && !noLegacy.data.batteries.includes('55 €'));
    console.log(JSON.stringify({ status: 'screens_only_local_browser_passed', scenes: 5, noBusinessPosts: true, noPublicWrites: true }));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
