import { chromium } from '@playwright/test';

async function testLiveConsole() {
  console.log('🌐 Opening headless browser to inspect https://haftora.netlify.app...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text(), msg.location()));
  page.on('pageerror', err => console.error('BROWSER UNCAUGHT EXCEPTION:', err.stack || err));

  try {
    await page.goto('https://haftora.netlify.app/learn', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const rootHtml = await page.locator('#root').innerHTML();
    console.log('Direct /learn subroute innerHTML length:', rootHtml.length);
    console.log('Root snippet:', rootHtml.slice(0, 300));
  } catch (e) {
    console.error('Goto error:', e);
  } finally {
    await browser.close();
  }
}

testLiveConsole();
