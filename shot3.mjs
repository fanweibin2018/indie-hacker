import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
await p.goto('http://localhost:4321/about/', { waitUntil: 'networkidle' });
await p.screenshot({ path: '/tmp/repo-about2.png' });
await b.close();
