// Browser tests for Meliora WhatsApp. Every page is served with a strict CSP; CSP violations and page errors fail the test.
// The browser runs in Israel time (playwright.config.cjs) and the clock is fixed per test. 16 November 2026 is a Monday.
const {test, expect} = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const PLAIN = '/tests/fixtures/plain.html';
const ALL = '/tests/fixtures/all.html';
const PHONE = '972500000000';
const WEEK = {sun: '09:00-17:00', mon: '09:00-17:00', tue: '09:00-17:00', wed: '09:00-17:00', thu: '09:00-17:00', fri: '09:00-13:00'};
const HOURS = {phone: PHONE, hours: WEEK, email: 'hello@example.com'};
const israel = time => new Date(`${time}+02:00`);
const url = (page, config, lang) => `${page}?config=${encodeURIComponent(JSON.stringify(config))}${lang ? `&lang=${lang}` : ''}`;
const btn = page => page.locator('.mwa-btn');
const dialog = page => page.locator('#mwa-dialog');
const intersects = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const frames = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

async function axe(page) {
  const result = await new AxeBuilder({page}).withTags(TAGS).analyze();
  expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  page.__errors = [];
  page.__warnings = [];
  page.__foreign = [];
  page.on('pageerror', error => page.__errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'warning') page.__warnings.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:8794/')) page.__foreign.push(request.url()); });
});
test.afterEach(async ({page}) => {
  expect(page.__errors).toEqual([]);
  expect(page.__foreign, 'requests to other sites').toEqual([]);
  expect(await page.evaluate(() => window.__csp || []).catch(() => [])).toEqual([]);
});

/* ---------- the link ---------- */

test('a real link to wa.me with the number, the pre-filled message and an accessible name', async ({page}) => {
  await page.goto(url(PLAIN, {phone: '+972 50-000-0000', message: 'Hello, I have a question about {title} ({url})'}));
  const link = page.getByRole('link', {name: 'Chat with us on WhatsApp (opens in a new tab)'});
  await expect(link).toBeVisible();
  expect(await link.evaluate(el => el.tagName)).toBe('A');
  const href = await link.getAttribute('href');
  expect(href.startsWith(`https://wa.me/${PHONE}?text=`)).toBe(true);
  expect(decodeURIComponent(href.split('?text=')[1])).toBe('Hello, I have a question about WhatsApp button on its own (http://127.0.0.1:8794/tests/fixtures/plain.html)');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  // Nothing stored, no cookies.
  expect(await page.evaluate(() => [document.cookie, localStorage.length, sessionStorage.length])).toEqual(['', 0, 0]);
});

test('a business name and per-language message', async ({page}) => {
  await page.goto(url(PLAIN, {phone: PHONE, name: 'Acme', message: {en: 'Hi', he: 'שלום'}}, 'he'));
  const link = page.getByRole('link', {name: 'שלחו הודעה בוואטסאפ אל Acme (נפתח בכרטיסייה חדשה)'});
  await expect(link).toHaveAttribute('href', `https://wa.me/${PHONE}?text=${encodeURIComponent('שלום')}`);
});

test('no message: the link has no text parameter', async ({page}) => {
  await page.goto(url(PLAIN, {phone: PHONE}));
  await expect(btn(page)).toHaveAttribute('href', `https://wa.me/${PHONE}`);
});

for (const phone of ['', '050-000-0000', '12345', 'abc']) {
  test(`an invalid number (${JSON.stringify(phone)}) adds nothing and warns`, async ({page}) => {
    await page.goto(url(PLAIN, {phone}));
    await page.waitForLoadState('load');
    await expect(page.locator('.mwa')).toHaveCount(0);
    expect(page.__warnings.join('\n')).toContain('international number');
  });
}

test('44×44 target, physical bottom-right in English and Hebrew, last in the Tab order', async ({page}) => {
  for (const lang of ['en', 'he']) {
    await page.goto(url(PLAIN, {phone: PHONE}, lang));
    await expect(page.locator('.mwa-root')).toHaveAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    await expect(page.locator('.mwa-root')).toHaveAttribute('lang', lang);
    await frames(page);
    const box = await btn(page).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(Math.round(1280 - box.x - box.width)).toBe(16);
    expect(Math.round(900 - box.y - box.height)).toBe(16); // no accessibility button here: the corner
    expect(await page.evaluate(() => document.body.lastElementChild.className)).toBe('mwa mwa-root');
  }
});

test('keyboard: Tab reaches the button after the page, with a visible focus ring', async ({page}) => {
  await page.goto(url(PLAIN, {phone: PHONE}));
  for (const target of ['.skip', '#first', '#second', '.mwa-btn']) {
    await page.keyboard.press('Tab');
    await expect(page.locator(target)).toBeFocused();
  }
  const ring = await btn(page).evaluate(el => { const c = getComputedStyle(el); return [c.outlineStyle, parseFloat(c.outlineWidth)]; });
  expect(ring[0]).toBe('solid');
  expect(ring[1]).toBeGreaterThanOrEqual(2);
});

/* ---------- business hours ---------- */

test('open hours: the link goes straight to WhatsApp', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T10:00:00')});
  await page.goto(url(PLAIN, HOURS));
  await expect(btn(page)).toHaveAttribute('href', `https://wa.me/${PHONE}`);
  expect(await page.evaluate(() => window.MelioraWhatsApp.isOpen())).toBe(true);
});

const AWAY = [
  ['Monday evening', '2026-11-16T18:00:00', 'We’ll reply tomorrow at 09:00 AM.', 'נחזור אליכם מחר ב־09:00.'],
  ['Monday early morning', '2026-11-16T07:30:00', 'We’ll reply today at 09:00 AM.', 'נחזור אליכם היום ב־09:00.'],
  ['Friday afternoon', '2026-11-20T14:00:00', 'We’ll reply on Sunday at 09:00 AM.', 'נחזור אליכם ביום ראשון ב־09:00.'],
];
for (const [label, time, en, he] of AWAY) {
  test(`away (${label}): a button opens a dialog that says when you'll reply`, async ({page}) => {
    await page.clock.install({time: israel(time)});
    await page.goto(url(PLAIN, HOURS));
    const button = page.getByRole('button', {name: 'Chat with us on WhatsApp. We’re away right now'});
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(button.locator('.mwa-badge')).toBeVisible();
    await button.click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByRole('heading')).toHaveText('We’re away right now');
    await expect(dialog(page).locator('#mwa-reply')).toHaveText(en);
    await expect(dialog(page).getByRole('link', {name: 'Send a WhatsApp anyway (opens in a new tab)'})).toHaveAttribute('href', `https://wa.me/${PHONE}`);
    await expect(dialog(page).getByRole('link', {name: 'Email us'})).toHaveAttribute('href', 'mailto:hello@example.com');
    await page.goto(url(PLAIN, HOURS, 'he'));
    await page.getByRole('button', {name: 'שלחו לנו הודעה בוואטסאפ. אנחנו לא זמינים כרגע'}).click();
    await expect(dialog(page)).toHaveAttribute('dir', 'rtl');
    await expect(dialog(page).locator('#mwa-reply')).toHaveText(he);
  });
}

test('closed dates, and a date instead of a weekday when the reply is a week or more away', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T18:00:00')});
  const closedDates = ['2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-22', '2026-11-23'];
  await page.goto(url(PLAIN, {...HOURS, closedDates}));
  await btn(page).click();
  await expect(dialog(page).locator('#mwa-reply')).toHaveText(/^We’ll reply on (24 November|November 24) at 09:00 AM\.$/);
});

test('no opening in the next two weeks: a general reply line', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T18:00:00')});
  await page.goto(url(PLAIN, {phone: PHONE, hours: {}}));
  await btn(page).click();
  await expect(dialog(page).locator('#mwa-reply')).toHaveText('We’ll reply as soon as we’re back.');
  await expect(dialog(page).getByRole('link', {name: /Send a WhatsApp anyway/})).toBeVisible();
});

test('afterHours "email": the dialog offers only email', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T18:00:00')});
  await page.goto(url(PLAIN, {...HOURS, afterHours: 'email', emailSubject: {en: 'From the site'}}));
  await btn(page).click();
  await expect(dialog(page).getByRole('link')).toHaveCount(2); // email + the credit
  await expect(dialog(page).getByRole('link', {name: 'Email us instead'})).toHaveAttribute('href', 'mailto:hello@example.com?subject=From%20the%20site');
});

test('the credit: a small “By Meliora” at the right, linked to melioranovotech.com, in both languages', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T18:00:00')});
  for (const [lang, credit] of [['en', 'By Meliora'], ['he', 'פיתוח Meliora']]) {
    await page.goto(url(PLAIN, HOURS, lang));
    await btn(page).click();
    const line = dialog(page).locator('.mwa-credit');
    await expect(line).toHaveText(credit);
    await expect(line.getByRole('link', {name: 'Meliora', exact: true})).toHaveAttribute('href', 'https://melioranovotech.com');
    await expect(line.locator('svg')).toHaveCount(0);
    const [link, box] = await Promise.all([line.getByRole('link').boundingBox(), dialog(page).locator('.mwa-actions').boundingBox()]);
    const right = lang === 'he' ? line.locator('xpath=.').evaluate(el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().right; }) : link.x + link.width;
    expect(Math.abs(await right - (box.x + box.width)), `at the right in ${lang}`).toBeLessThanOrEqual(1);
  }
});

test('afterHours "off": always a link, even when closed', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T18:00:00')});
  await page.goto(url(PLAIN, {...HOURS, afterHours: 'off'}));
  await expect(page.getByRole('link', {name: /Chat with us on WhatsApp/})).toBeVisible();
});

test('the dialog: focus on the title, Esc and × close it, focus returns to the button', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T18:00:00')});
  await page.goto(url(PLAIN, HOURS));
  await btn(page).focus();
  await page.keyboard.press('Enter');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#mwa-title')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog(page).locator('.mwa-close')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog(page).getByRole('link', {name: /Send a WhatsApp anyway/})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(btn(page)).toBeFocused();
  await page.keyboard.press(' ');
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole('button', {name: 'Close'}).click();
  await expect(dialog(page)).toBeHidden();
  await expect(btn(page)).toBeFocused();
});

test('opening and closing time: the button changes by itself and keeps focus', async ({page}) => {
  await page.clock.install({time: israel('2026-11-16T16:59:30')});
  await page.goto(url(PLAIN, HOURS));
  await expect(btn(page)).toHaveAttribute('href', /wa\.me/);
  await btn(page).focus();
  await page.clock.fastForward('01:00');
  await expect(page.getByRole('button', {name: /We’re away right now/})).toBeFocused();
  await page.clock.fastForward('16:00:00'); // Tuesday 09:00
  await expect(page.getByRole('link', {name: /Chat with us on WhatsApp/})).toBeFocused();
});

test('a visitor in another time zone: hours follow the business, and the reply time names its zone', async ({browser}) => {
  const context = await browser.newContext({timezoneId: 'America/New_York'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.clock.install({time: israel('2026-11-16T18:00:00')}); // 11:00 in New York, but closed in Israel
  await page.goto(url(PLAIN, HOURS));
  await btn(page).click();
  await expect(page.locator('#mwa-reply')).toHaveText(/^We’ll reply tomorrow at 09:00 AM \(.+\)\.$/);
  expect(await page.locator('#mwa-reply').textContent()).toMatch(/Israel|GMT\+2/);
  expect(errors).toEqual([]);
  await context.close();
});

/* ---------- accessibility checks ---------- */

for (const [lang, scheme] of [['en', 'light'], ['he', 'light'], ['en', 'dark'], ['he', 'dark']]) {
  test(`axe: button and dialog have no WCAG 2.1 AA violations (${lang}, ${scheme})`, async ({page}) => {
    await page.emulateMedia({colorScheme: scheme});
    await page.clock.install({time: israel('2026-11-16T10:00:00')});
    await page.goto(url(PLAIN, HOURS, lang));
    await expect(btn(page)).toBeVisible();
    await axe(page);
    await page.goto(url(PLAIN, {...HOURS, closedDates: ['2026-11-16']}, lang));
    await btn(page).click();
    await expect(dialog(page)).toBeVisible();
    await axe(page);
  });
}

test('WhatsApp teal by default: the icon and the button keep 3:1 on light and dark pages', async ({page}) => {
  const lum = rgb => {
    const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  await page.goto(url(PLAIN, {phone: PHONE}));
  expect(await btn(page).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(18, 140, 126)'); // #128c7e
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({colorScheme: scheme});
    await page.goto(url(PLAIN, {phone: PHONE}));
    const [bg, fg, page_] = await btn(page).evaluate(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color, getComputedStyle(document.body).backgroundColor]);
    expect(ratio(bg, fg)).toBeGreaterThanOrEqual(3); // WCAG 1.4.11, non-text contrast
    expect(ratio(bg, page_)).toBeGreaterThanOrEqual(3);
  }
});

/* ---------- with the accessibility panel and the cookie banner ---------- */

test.describe('with Meliora Accessibility and Meliora Consent', () => {
  const panelBox = page => page.evaluate(() => {
    const fab = document.querySelector('.a11y-fab');
    const rects = [fab, ...fab.querySelectorAll('*')].map(el => el.getBoundingClientRect()).filter(r => r.width && r.height);
    const x = Math.min(...rects.map(r => r.left)), y = Math.min(...rects.map(r => r.top));
    return {x, y, width: Math.max(...rects.map(r => r.right)) - x, height: Math.max(...rects.map(r => r.bottom)) - y};
  });
  // Lined up with the accessibility button: centred on it (stacked) or level with it (side by side).
  const aligned = async (page, me) => {
    const face = await page.locator('.a11y-trigger').boundingBox();
    const centre = r => [r.x + r.width / 2, r.y + r.height / 2];
    const [[mx, my], [fx, fy]] = [centre(me), centre(face)];
    return Math.abs(mx - fx) <= 1 || Math.abs(my - fy) <= 1;
  };

  test('keyboard: skip link, accessibility button, ×, the banner, the page, then WhatsApp', async ({page}) => {
    await page.goto(url(ALL, {phone: PHONE}));
    await page.waitForLoadState('load');
    await expect(page.locator('.mc-banner')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.a11y-trigger')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.a11y-hide')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.mc-banner a').first()).toBeFocused();
    await btn(page).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', {name: 'Cookie settings'})).toBeFocused(); // the page's last control
  });

  test('never covers the accessibility button or the banner: widths, 100–200% text, English and Hebrew', async ({page}) => {
    test.setTimeout(120000);
    const cases = [];
    for (const width of [1280, 800, 640, 480, 375, 320]) for (const scale of [1, 1.5, 2]) for (const lang of ['en', 'he']) cases.push({width, scale, lang});
    for (const {width, scale, lang} of cases) {
      const where = `${width}px, ${scale * 100}% text, ${lang}`;
      await page.setViewportSize({width, height: 800});
      await page.goto(url(ALL, {phone: PHONE}, lang));
      await page.evaluate(s => { localStorage.setItem('meliora.a11y', JSON.stringify({scale: s})); }, scale);
      await page.reload();
      await expect(page.locator('.mc-banner')).toBeVisible();
      await frames(page);
      const [me, fab, banner] = await Promise.all([btn(page).boundingBox(), panelBox(page), page.locator('.mc-banner').boundingBox()]);
      expect(intersects(me, fab), `over the accessibility button at ${where}`).toBe(false);
      expect(await aligned(page, me), `lined up with the accessibility button at ${where}`).toBe(true);
      expect(intersects(me, banner), `over the banner at ${where}`).toBe(false);
      expect(me.y, `on screen at ${where}`).toBeGreaterThanOrEqual(0);
      expect(me.width, `44px target at ${where}`).toBeGreaterThanOrEqual(44);
      // The banner's own choice is unchanged: card when there is room beside the accessibility button.
      if (width * 1 >= 16 * scale * 31.75 + 1) await expect(page.locator('.mc-banner'), where).not.toHaveClass(/mc-sheet/);
      await page.evaluate(() => localStorage.clear());
    }
  });

  test('follows the banner and the accessibility button as they change', async ({page}) => {
    await page.setViewportSize({width: 375, height: 800});
    await page.goto(url(ALL, {phone: PHONE}));
    await expect(page.locator('.mc-banner')).toHaveClass(/mc-sheet/);
    await frames(page);
    const check = async where => {
      await frames(page);
      const me = await btn(page).boundingBox();
      if (await page.locator('.a11y-fab').isVisible()) expect(intersects(me, await panelBox(page)), where).toBe(false);
      if (await page.locator('.mc-banner').count()) expect(intersects(me, await page.locator('.mc-banner').boundingBox()), where).toBe(false);
      return me;
    };
    const withSheet = await check('sheet');
    // Hide the accessibility button: WhatsApp drops into its place, still above the sheet.
    await page.locator('.a11y-hide').click();
    await expect(page.locator('.a11y-fab')).toBeHidden();
    const hidden = await check('accessibility button hidden');
    expect(hidden.y).toBeGreaterThan(withSheet.y);
    // Answer the banner: down to the corner.
    await page.getByRole('button', {name: 'Reject all'}).click();
    await expect(page.locator('.mc-banner')).toHaveCount(0);
    const corner = await check('no banner');
    expect(Math.round(800 - corner.y - corner.height)).toBe(16);
    // Bring the accessibility button back (Alt+0): above it again.
    await page.keyboard.press('Alt+0');
    await expect(page.locator('.a11y-fab')).toBeVisible();
    await page.keyboard.press('Escape');
    await check('accessibility button back');
  });

  test('wherever the visitor drags the accessibility button, WhatsApp stays clear of it', async ({page}) => {
    for (const [x, y] of [[1, 1], [1, 0.95], [1, 0.9], [1, 0.8], [0.97, 1], [1, 0.5], [0, 1]]) {
      await page.addInitScript(([px, py]) => localStorage.setItem('meliora.a11y', JSON.stringify({pos: {x: px, y: py}})), [x, y]);
      await page.goto(url(ALL, {phone: PHONE}));
      await expect(page.locator('.a11y-fab')).toHaveClass(/a11y-moved/);
      await frames(page);
      const [me, fab] = await Promise.all([btn(page).boundingBox(), panelBox(page)]);
      expect(intersects(me, fab), `accessibility button dragged to ${x}, ${y}`).toBe(false);
      expect(await aligned(page, me), `lined up with the accessibility button dragged to ${x}, ${y}`).toBe(true);
      expect(me.y, `on screen with the button at ${x}, ${y}`).toBeGreaterThanOrEqual(0);
    }
  });

  test('a card banner wider than the space beside a hidden accessibility button: WhatsApp climbs above it', async ({page}) => {
    await page.setViewportSize({width: 460, height: 800});
    await page.addInitScript(() => sessionStorage.setItem('meliora.a11y.hidden', '1'));
    await page.goto(url(ALL, {phone: PHONE}));
    await expect(page.locator('.mc-banner')).toBeVisible();
    await frames(page);
    expect(intersects(await btn(page).boundingBox(), await page.locator('.mc-banner').boundingBox())).toBe(false);
  });

  test('short screen at 200% text: beside the accessibility button, still clear of both', async ({page}) => {
    await page.setViewportSize({width: 800, height: 360});
    await page.addInitScript(() => { if (!localStorage.getItem('meliora.a11y')) localStorage.setItem('meliora.a11y', JSON.stringify({scale: 2})); });
    await page.goto(url(ALL, {phone: PHONE}));
    await expect(page.locator('.mc-banner')).toBeVisible();
    await frames(page);
    const [me, fab, banner] = await Promise.all([btn(page).boundingBox(), panelBox(page), page.locator('.mc-banner').boundingBox()]);
    expect(intersects(me, fab)).toBe(false);
    expect(intersects(me, banner)).toBe(false);
    expect(me.y).toBeGreaterThanOrEqual(0);
    expect(me.x + me.width, 'beside the accessibility button').toBeLessThanOrEqual(fab.x);
  });

  test('the panel’s High contrast setting applies to the button and the dialog', async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('meliora.a11y', JSON.stringify({contrast: true})));
    await page.clock.install({time: israel('2026-11-16T18:00:00')});
    await page.goto(url(ALL, HOURS));
    expect(await btn(page).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(0, 0, 0)');
    await btn(page).click();
    expect(await dialog(page).evaluate(el => getComputedStyle(el).borderTopWidth)).toBe('2px');
    await axe(page);
  });
});

/* ---------- the demo page ---------- */

test('the demo page loads the three tools without errors, in English and Hebrew', async ({page}) => {
  for (const query of ['?lang=en', '?lang=he&demo=away', '?demo=email']) {
    await page.goto(`/${query}`);
    await expect(btn(page)).toBeVisible();
    await expect(page.locator('.a11y-trigger')).toBeVisible();
    await expect(page.locator('.mc-banner')).toBeVisible();
    await expect(page.locator('#demo-state')).toContainText('wa.me/972500000000');
  }
  await btn(page).click();
  await expect(dialog(page).getByRole('link', {name: 'Email us instead'})).toBeVisible();
});
