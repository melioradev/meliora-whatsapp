/*! Meliora WhatsApp — https://github.com/melioradev/meliora-whatsapp
    By Meliora (https://melioranovotech.com). License: MIT with visible attribution. The "By Meliora" credit,
    with its link, in the "We're away" dialog must stay. See LICENSE.

   Accessible chat buttons for WhatsApp and Telegram: real links to https://wa.me/<number>?text=… and
   https://t.me/<username>?text=… with proper names, and an "outside business hours" mode that says when you'll reply
   or offers email instead. No third-party script, no requests, no cookies, no storage. The buttons stack above the
   Meliora accessibility button (bottom-right) and move up whenever the Meliora Consent banner would be under them.
   Set up with window.MelioraWhatsAppConfig: `phone` for WhatsApp, `telegram` for Telegram, or both. */
(() => {
  const config = window.MelioraWhatsAppConfig || {};
  const html = document.documentElement;
  const SITE_URL = 'https://melioranovotech.com';
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  /* ---------- strings: Hebrew and English. Hebrew must be checked by a native speaker before launch. ---------- */
  const I18N = {
    en: {
      dir: 'ltr',
      chat: 'Chat with us on WhatsApp', chatNamed: 'Chat with {name} on WhatsApp',
      telegramChat: 'Chat with us on Telegram', telegramChatNamed: 'Chat with {name} on Telegram',
      newTab: '(opens in a new tab)',
      awayName: '{chat}. We’re away right now',
      awayTitle: 'We’re away right now',
      replyToday: 'We’ll reply today at {time}.', replyTomorrow: 'We’ll reply tomorrow at {time}.',
      replyDay: 'We’ll reply on {day} at {time}.', replyDate: 'We’ll reply on {date} at {time}.',
      replyLater: 'We’ll reply as soon as we’re back.',
      zone: '{time} ({zone})',
      sendAnyway: 'Send a WhatsApp anyway', telegramSendAnyway: 'Send a Telegram message anyway',
      email: 'Email us', emailInstead: 'Email us instead',
      close: 'Close', madeBy: 'By {name}',
    },
    he: {
      dir: 'rtl',
      chat: 'שלחו לנו הודעה בוואטסאפ', chatNamed: 'שלחו הודעה בוואטסאפ אל {name}',
      telegramChat: 'שלחו לנו הודעה בטלגרם', telegramChatNamed: 'שלחו הודעה בטלגרם אל {name}',
      newTab: '(נפתח בכרטיסייה חדשה)',
      awayName: '{chat}. אנחנו לא זמינים כרגע',
      awayTitle: 'אנחנו לא זמינים כרגע',
      replyToday: 'נחזור אליכם היום ב־{time}.', replyTomorrow: 'נחזור אליכם מחר ב־{time}.',
      replyDay: 'נחזור אליכם ב{day} ב־{time}.', replyDate: 'נחזור אליכם ב־{date} ב־{time}.',
      replyLater: 'נחזור אליכם ברגע שנחזור לפעילות.',
      zone: '{time} ({zone})',
      sendAnyway: 'לשלוח וואטסאפ בכל זאת', telegramSendAnyway: 'לשלוח הודעה בטלגרם בכל זאת',
      email: 'לשלוח לנו מייל', emailInstead: 'לשלוח מייל במקום',
      close: 'סגירה', madeBy: 'פיתוח {name}',
    },
  };

  /* ---------- language: the button is page content, so it follows <html lang> ---------- */
  const base = (html.lang || 'en').toLowerCase().split('-')[0].replace(/^iw$/, 'he');
  const lang = I18N[base] ? base : 'en';
  const dir = I18N[lang].dir;
  const text = config.text || {};
  const t = key => text[lang]?.[key] ?? text.default?.[key] ?? I18N[lang][key];
  const pick = v => (typeof v === 'string' ? v : v && typeof v === 'object' ? (v[lang] ?? v.default ?? v.en ?? '') : '');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

  /* ---------- the numbers and usernames ---------- */
  // Both apps want the full international number, digits only: 972501234567, not 050-123-4567 or +972-50-…
  const digits = v => String(v ?? '').replace(/[\s\-().+]/g, '').replace(/^00/, '');
  const isPhone = p => /^[1-9]\d{6,14}$/.test(p);
  const given = v => String(v ?? '').trim() !== '';
  const problems = []; // settings that were given but can't be used: one console warning at the end

  // WhatsApp: `phone`.
  const waPhone = digits(config.phone);
  const whatsapp = isPhone(waPhone) ? {path: waPhone, text: true} : null;
  if (given(config.phone) && !whatsapp) problems.push(`phone "${config.phone}" is not a full international number, digits only, such as "972501234567".`);

  // Telegram: `telegram`, one of
  // - a username: acme_support, @acme_support or https://t.me/acme_support (4–32 letters, digits and underscores,
  //   starting with a letter and not ending with an underscore, as Telegram allows);
  // - a phone number: +972501234567, which only opens if the account lets people find it by its number;
  // - a group invite link: https://t.me/+AbCdEf… or https://t.me/joinchat/AbCdEf…, which can't take a pre-filled message.
  // → {path, text}: the part after https://t.me/, and whether the link takes ?text=. null when unset or unusable.
  function telegramTarget(value) {
    if (!given(value)) return null;
    const s = String(value).trim().replace(/^(?:https?:\/\/)?(?:www\.)?(?:t|telegram)\.me\//i, '')
      .replace(/^joinchat\//i, '+').replace(/^@/, '').replace(/\/+$/, '');
    if (/^[+(]?\d[\d\s\-().]*$/.test(s)) { // only phone-number characters
      const number = digits(s);
      if (isPhone(number)) return {path: `+${number}`, text: true};
    } else if (/^\+[\w-]{10,}$/.test(s)) {
      return {path: s, text: false};
    } else if (/^[a-z](?:[a-z0-9_]{2,30}[a-z0-9])$/i.test(s)) {
      return {path: s, text: true};
    }
    problems.push(`telegram "${value}" is not a Telegram username such as "acme_support", a group invite link, or a full international number such as "+972501234567".`);
    return null;
  }
  const telegram = telegramTarget(config.telegram);

  if (!whatsapp && !telegram) {
    console.warn(`Meliora WhatsApp: ${problems.length ? problems.join(' ') : 'set MelioraWhatsAppConfig.phone to your WhatsApp number (the full international number, digits only, such as "972501234567"), or MelioraWhatsAppConfig.telegram to your Telegram username.'} Nothing was added to the page.`);
    return;
  }
  for (const problem of problems) console.warn(`Meliora WhatsApp: ignoring ${problem}`);
  const email = String(config.email || '').trim();
  function mailUrl() {
    const subject = pick(config.emailSubject);
    return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  }

  /* ---------- business hours, in the business's own time zone ---------- */
  const timeZone = config.timeZone || 'Asia/Jerusalem';
  const toMinutes = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim()); return m && +m[1] <= 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
  const hours = {};
  let hasHours = false;
  if (config.hours && typeof config.hours === 'object') {
    hasHours = true;
    for (const day of DAYS) {
      hours[day] = [];
      for (const range of String(config.hours[day] || '').split(',').map(r => r.trim()).filter(Boolean)) {
        const [from, to] = range.split('-').map(toMinutes);
        if (from == null || to == null || to <= from) console.warn(`Meliora WhatsApp: ignoring hours "${range}" on ${day}. Use "09:00-17:00"; split a range that crosses midnight.`);
        else hours[day].push([from, to]);
      }
    }
  }
  const closedDates = new Set((config.closedDates || []).map(String));
  const mode = !hasHours || config.afterHours === 'off' ? 'off' : config.afterHours === 'email' && email ? 'email' : 'notice';

  // The wall-clock date and time at the business right now.
  let clockParts;
  try {
    clockParts = new Intl.DateTimeFormat('en-US', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
  } catch {
    console.warn(`Meliora WhatsApp: unknown timeZone "${timeZone}". Using the visitor's time zone.`);
    clockParts = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
  }
  function businessNow() {
    const p = Object.fromEntries(clockParts.formatToParts(new Date()).map(x => [x.type, x.value]));
    return {y: +p.year, m: +p.month, d: +p.day, minutes: (+p.hour % 24) * 60 + +p.minute};
  }
  // A calendar day `offset` days after the business's today (UTC is used only as a plain calendar here).
  const dayAt = (now, offset) => new Date(Date.UTC(now.y, now.m - 1, now.d + offset, 12));
  const isoDate = date => date.toISOString().slice(0, 10);
  const rangesOn = date => (closedDates.has(isoDate(date)) ? [] : hours[DAYS[date.getUTCDay()]]);

  // {open, minutesToChange, next: {offset, at}} — `next` is the next opening time within two weeks.
  function status() {
    if (!hasHours) return {open: true, minutesToChange: Infinity};
    const now = businessNow();
    const current = rangesOn(dayAt(now, 0)).find(([from, to]) => now.minutes >= from && now.minutes < to);
    if (current) return {open: true, minutesToChange: current[1] - now.minutes};
    for (let offset = 0; offset <= 14; offset++) {
      const start = rangesOn(dayAt(now, offset)).map(([from]) => from).filter(from => offset > 0 || from > now.minutes).sort((a, b) => a - b)[0];
      if (start != null) return {open: false, minutesToChange: offset * 1440 + start - now.minutes, next: {offset, at: start, date: dayAt(now, offset)}};
    }
    return {open: false, minutesToChange: Infinity};
  }

  function formatTime(minutes) {
    const time = new Intl.DateTimeFormat(lang, {hour: '2-digit', minute: '2-digit', hourCycle: lang === 'he' ? 'h23' : undefined, timeZone: 'UTC'})
      .format(new Date(Date.UTC(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)));
    // Visitors in another time zone are told whose clock this is.
    let visitorZone = '';
    try { visitorZone = new Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* unknown */ }
    if (!visitorZone || visitorZone === timeZone) return time;
    let zone = '';
    for (const style of ['longGeneric', 'long']) {
      try { zone = new Intl.DateTimeFormat(lang, {timeZone, timeZoneName: style}).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || ''; } catch { /* style unsupported */ }
      if (zone) break;
    }
    return zone ? fill(t('zone'), {time, zone}) : time;
  }
  function replyText(next) {
    if (!next) return t('replyLater');
    const time = formatTime(next.at);
    if (next.offset === 0) return fill(t('replyToday'), {time});
    if (next.offset === 1) return fill(t('replyTomorrow'), {time});
    if (next.offset < 7) return fill(t('replyDay'), {time, day: new Intl.DateTimeFormat(lang, {weekday: 'long', timeZone: 'UTC'}).format(next.date)});
    return fill(t('replyDate'), {time, date: new Intl.DateTimeFormat(lang, {day: 'numeric', month: 'long', timeZone: 'UTC'}).format(next.date)});
  }

  /* ---------- icons (decorative: the name is in text) ---------- */
  // The WhatsApp and Telegram glyphs, unaltered, as Meta's brand guidelines ask (path data: Simple Icons, CC0).
  const WHATSAPP = '<svg class="mwa-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  const TELEGRAM = '<svg class="mwa-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>';
  const MOON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10.6 1.6a6.6 6.6 0 1 0 3.8 10.6A5.3 5.3 0 0 1 10.6 1.6Z"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const newTab = `<span class="mwa-sr"> ${esc(t('newTab'))}</span>`;

  /* ---------- the apps and their links ---------- */
  // Top to bottom, which is also the Tab order: Telegram above WhatsApp, so WhatsApp keeps its place by the corner.
  const apps = [];
  if (telegram) apps.push({id: 'telegram', base: `https://t.me/${telegram.path}`, text: telegram.text, icon: TELEGRAM, chat: 'telegramChat', named: 'telegramChatNamed', anyway: 'telegramSendAnyway'});
  if (whatsapp) apps.push({id: 'whatsapp', base: `https://wa.me/${whatsapp.path}`, text: whatsapp.text, icon: WHATSAPP, chat: 'chat', named: 'chatNamed', anyway: 'sendAnyway'});
  // No app named: WhatsApp when it is set up (the API's default, as before Telegram), else Telegram.
  const appOf = id => (id ? apps.find(app => app.id === id) : apps.find(app => app.id === 'whatsapp') || apps[0]);
  function chatUrl(id) {
    const app = appOf(id);
    if (!app) return null;
    // ?text= is the pre-filled message. Telegram fills it in where the visitor can write (a person, a business or a
    // group, not a channel); an invite link takes none.
    const message = app.text ? fill(pick(config.message), {url: location.origin + location.pathname, title: document.title}) : '';
    return `${app.base}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  }
  const chatName = app => (pick(config.name) ? fill(t(app.named), {name: pick(config.name)}) : t(app.chat));

  /* ---------- the button ---------- */
  const root = document.createElement('div');
  root.className = 'mwa mwa-root';
  root.lang = lang; root.dir = dir;
  const controls = {}; // app id → its button
  let state = null, timer = 0;

  // Open: links straight to the apps. Away (with afterHours on): buttons that open the "We're away" dialog.
  function render() {
    const now = status();
    const away = !now.open && mode !== 'off';
    const key = away ? `away:${replyText(now.next)}` : 'open';
    if (key !== state) {
      state = key;
      const focused = apps.find(app => controls[app.id] && controls[app.id] === document.activeElement);
      for (const app of apps) {
        const next = document.createElement(away ? 'button' : 'a');
        next.className = `mwa-btn mwa-${app.id}${away ? ' mwa-away' : ''}`;
        next.dataset.app = app.id;
        if (away) {
          next.type = 'button';
          next.setAttribute('aria-haspopup', 'dialog');
          next.setAttribute('aria-controls', 'mwa-dialog');
          next.innerHTML = `${app.icon}<span class="mwa-badge">${MOON}</span><span class="mwa-sr">${esc(fill(t('awayName'), {chat: chatName(app)}))}</span>`;
        } else {
          next.href = chatUrl(app.id);
          next.target = '_blank';
          next.rel = 'noopener noreferrer';
          next.innerHTML = `${app.icon}<span class="mwa-sr">${esc(chatName(app))}</span>${newTab}`;
        }
        if (controls[app.id]) controls[app.id].replaceWith(next); else root.append(next);
        controls[app.id] = next;
      }
      if (focused) controls[focused.id].focus();
      if (!away && dialog?.open) dialog.close();
      schedule();
    }
    if (dialog?.open) fillDialog(now);
    // Check again at the next change (opening or closing), and at least every 30 minutes.
    clearTimeout(timer);
    timer = setTimeout(render, Math.min(now.minutesToChange, 30) * 60000 - new Date().getSeconds() * 1000 + 500);
  }
  root.addEventListener('click', event => {
    const target = event.target.closest('.mwa-btn');
    if (target?.tagName === 'A') target.href = chatUrl(target.dataset.app); // {title} and {url} follow single-page apps
    else if (target) openDialog(target.dataset.app);
  });

  /* ---------- "We're away" dialog: offers the app the visitor chose (and email) ---------- */
  let dialog = null, dialogApp = null, shownActions = null;
  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.id = 'mwa-dialog';
    dialog.className = 'mwa mwa-dialog';
    dialog.lang = lang; dialog.dir = dir;
    dialog.setAttribute('aria-labelledby', 'mwa-title');
    dialog.setAttribute('aria-describedby', 'mwa-reply');
    dialog.innerHTML = `<div class="mwa-head"><h2 id="mwa-title" class="mwa-title" tabindex="-1">${esc(t('awayTitle'))}</h2>
        <button type="button" class="mwa-close" aria-label="${esc(t('close'))}">${CLOSE}</button></div>
      <div class="mwa-body">
        <p id="mwa-reply" class="mwa-reply"></p>
        <div class="mwa-actions"></div>
        <p class="mwa-credit">${esc(t('madeBy')).replace('{name}', `<a href="${SITE_URL}" rel="noopener">Meliora</a>`)}</p>
      </div>`;
    dialog.addEventListener('click', event => {
      if (event.target === dialog) { // the backdrop
        const r = dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
        return;
      }
      if (event.target.closest('.mwa-close')) dialog.close();
      else if (event.target.closest('.mwa-action')) setTimeout(() => dialog.close()); // after the link has been followed
    });
    // Focus goes back to the button that opened it (it may have been replaced at opening time), or to <main>.
    dialog.addEventListener('close', () => {
      const back = controls[dialogApp];
      if (back?.isConnected) back.focus();
      else document.querySelector('main')?.focus?.();
    });
    document.body.append(dialog);
  }
  function fillDialog(now) {
    dialog.querySelector('#mwa-reply').textContent = replyText(now.next);
    const app = appOf(dialogApp), actions = [];
    if (mode === 'notice') actions.push(`<a class="mwa-action mwa-action-chat mwa-${app.id}" href="${esc(chatUrl(app.id))}" target="_blank" rel="noopener noreferrer">${app.icon}<span>${esc(t(app.anyway))}</span>${newTab}</a>`);
    if (email) actions.push(`<a class="mwa-action" href="${esc(mailUrl())}">${esc(t(mode === 'email' ? 'emailInstead' : 'email'))}</a>`);
    // Rebuilt only when it changes, so a periodic re-check never moves keyboard focus.
    const box = dialog.querySelector('.mwa-actions'), markup = actions.join('');
    if (shownActions !== markup) { box.innerHTML = markup; shownActions = markup; }
  }
  function openDialog(id) {
    if (!dialog) buildDialog();
    if (dialog.open) return;
    dialogApp = appOf(id).id;
    fillDialog(status());
    dialog.showModal();
    dialog.querySelector('#mwa-title').focus();
  }

  /* ---------- placement: above the accessibility button, and above the cookie banner when it is under us ---------- */
  let frame = 0;
  function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(place); }
  // The box of an element and its absolutely placed children (the accessibility button's × sticks out).
  function box(el) {
    let r = el.getBoundingClientRect(), {left, top, right, bottom} = r;
    for (const child of el.querySelectorAll('*')) {
      const c = child.getBoundingClientRect();
      if (!c.width || !c.height) continue;
      left = Math.min(left, c.left); top = Math.min(top, c.top); right = Math.max(right, c.right); bottom = Math.max(bottom, c.bottom);
    }
    return {left, top, right, bottom};
  }
  // The accessibility button wherever it is (`fab`: with its ×; `face`: the round button itself), the cookie banner,
  // and anything the site lists in `avoid`.
  function obstacles() {
    const el = document.querySelector('.a11y-fab');
    const shown = el && !el.hidden && el.getClientRects().length;
    const fab = shown ? box(el) : null;
    const face = shown ? (el.querySelector('.a11y-trigger') || el).getBoundingClientRect() : null;
    const list = fab ? [fab] : [];
    for (const item of document.querySelectorAll(['.mc-banner', ...[].concat(config.avoid || [])].join(','))) {
      if (item.getClientRects().length && getComputedStyle(item).visibility !== 'hidden') list.push(item.getBoundingClientRect());
    }
    return {fab, face, list};
  }
  function place() {
    if (!root.isConnected || !root.firstElementChild) return;
    // While the visitor drags the accessibility button, stay put; move once it is dropped.
    if (document.querySelector('.a11y-fab.a11y-dragging')) return;
    const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
    const gap = Math.round(rem * 0.75), edge = Math.round(rem);
    const width = html.clientWidth, height = html.clientHeight;
    // The buttons move as one: a column (Telegram above WhatsApp), or a row when they sit beside the accessibility button.
    // One button never changes layout, so it is measured once; two are measured again only when the layout changes.
    let w, h;
    const measure = () => ({width: w, height: h} = root.getBoundingClientRect());
    const layout = row => { root.classList.toggle('mwa-row', row); measure(); };
    if (root.classList.contains('mwa-row')) layout(false); else measure();
    const several = apps.length > 1;
    const {fab, face, list} = obstacles();
    // Does a box with these right and bottom offsets come within `gap` of anything, or leave the screen?
    const hit = (right, bottom) => list.find(b => width - right - w < b.right + gap && b.left - gap < width - right
      && height - bottom - h < b.bottom + gap && b.top - gap < height - bottom);
    const fits = (right, bottom, side = edge) => right >= side && width - right - w >= side && bottom >= edge && height - bottom - h >= edge;
    const climb = (right, bottom) => {
      for (let b, guard = 0; (b = hit(right, bottom)) && guard < 10; guard++) bottom = Math.ceil(height - b.top + gap);
      return {right, bottom};
    };
    let spot = null;
    if (fab) {
      // With the accessibility button on the page, the two make one stack: centred on it, above it (climbing past the
      // banner if needed), else below it, else beside it, at its height.
      // Dragged close to the screen's side, the accessibility button may sit nearer to it than `edge`: so may we.
      const side = Math.max(0, Math.min(edge, Math.floor(face.left), Math.floor(width - face.right)));
      const right = Math.round(Math.min(Math.max(width - (face.left + face.right) / 2 - w / 2, side), width - w - side));
      const stacked = [
        climb(right, Math.ceil(height - fab.top + gap)),
        {right, bottom: Math.floor(height - fab.bottom - gap - h)},
      ];
      spot = stacked.find(c => fits(c.right, c.bottom, side) && !hit(c.right, c.bottom));
      if (!spot) {
        // Beside it, level with it: two buttons go side by side, so both stay level (a column would be too tall).
        if (several) layout(true);
        const level = Math.round(height - face.bottom + (face.height - h) / 2);
        const beside = [
          {right: Math.ceil(width - fab.left + gap), bottom: level, onLeft: true},
          {right: Math.floor(width - fab.right - gap - w), bottom: level, onLeft: false},
        ];
        spot = beside.find(c => fits(c.right, c.bottom) && !hit(c.right, c.bottom));
        if (!spot && several) layout(false);
        // WhatsApp (last in the DOM) goes next to the accessibility button, in English and Hebrew alike: a row runs
        // right to left in Hebrew, so flip it when that puts WhatsApp on the far side. Same size either way.
        else if (several) root.classList.toggle('mwa-flip', spot.onLeft === (dir === 'rtl'));
      }
    }
    // No accessibility button (or no room around it): the bottom-right corner, climbing above whatever is in the way.
    // Two buttons that don't fit there as a column (a short screen, large text) try a row, WhatsApp by the corner.
    if (!spot) {
      spot = climb(edge, edge);
      if (several && !(fits(spot.right, spot.bottom) && !hit(spot.right, spot.bottom))) {
        layout(true);
        const row = climb(edge, edge);
        if (fits(row.right, row.bottom) && !hit(row.right, row.bottom)) {
          spot = row;
          root.classList.toggle('mwa-flip', dir === 'rtl');
        } else layout(false);
      }
      spot.bottom = Math.min(spot.bottom, Math.max(edge, height - h - edge));
    }
    root.style.right = `${spot.right}px`;
    root.style.bottom = `${spot.bottom}px`;
  }
  function watch() {
    // The banner and the accessibility panel change <html>'s style and classes when they appear, resize, move or go away,
    // and add their elements to <body>.
    new MutationObserver(schedule).observe(html, {attributes: true, attributeFilter: ['style', 'class']});
    new MutationObserver(() => { watchFab(); schedule(); }).observe(document.body, {childList: true});
    new ResizeObserver(schedule).observe(html);
    addEventListener('resize', schedule);
    watchFab();
  }
  let fabWatched = null;
  function watchFab() {
    const fab = document.querySelector('.a11y-fab');
    if (!fab || fab === fabWatched) return;
    fabWatched = fab;
    new MutationObserver(schedule).observe(fab, {attributes: true, attributeFilter: ['hidden', 'class', 'style']});
  }

  /* ---------- start ---------- */
  function start() {
    // Last in the reading and Tab order by default: after the page's own content.
    const anchor = config.insertAfter && document.querySelector(config.insertAfter);
    if (anchor) anchor.after(root); else document.body.append(root);
    render();
    watch();
    place();
    // Coming back to a tab that slept: the hours may have changed.
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
    addEventListener('load', schedule, {once: true});
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, {once: true});

  // `app` is 'whatsapp' or 'telegram'; without it, WhatsApp when it is set up, else Telegram.
  window.MelioraWhatsApp = {
    url: app => chatUrl(app),
    isOpen: () => status().open,
    open: app => {
      const chosen = appOf(app);
      if (!chosen) return;
      if (controls[chosen.id]?.tagName === 'BUTTON') openDialog(chosen.id); else window.open(chatUrl(chosen.id), '_blank', 'noopener,noreferrer');
    },
    refresh: () => { state = null; render(); },
  };
})();
