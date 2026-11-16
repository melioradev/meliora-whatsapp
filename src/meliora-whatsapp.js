/*! Meliora WhatsApp — https://github.com/melioradev/meliora-whatsapp
    By Meliora (https://melioranovotech.com). License: MIT with visible attribution. The "By Meliora" credit,
    with its link, in the "We're away" dialog must stay. See LICENSE.

   An accessible WhatsApp chat button: a real link to https://wa.me/<number>?text=… with a proper name, and an
   "outside business hours" mode that says when you'll reply or offers email instead. No third-party script, no
   requests, no cookies, no storage. It sits above the Meliora accessibility button (bottom-right) and moves up
   whenever the Meliora Consent banner would be under it. Set up with window.MelioraWhatsAppConfig. */
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
      newTab: '(opens in a new tab)',
      awayName: '{chat}. We’re away right now',
      awayTitle: 'We’re away right now',
      replyToday: 'We’ll reply today at {time}.', replyTomorrow: 'We’ll reply tomorrow at {time}.',
      replyDay: 'We’ll reply on {day} at {time}.', replyDate: 'We’ll reply on {date} at {time}.',
      replyLater: 'We’ll reply as soon as we’re back.',
      zone: '{time} ({zone})',
      sendAnyway: 'Send a WhatsApp anyway', email: 'Email us', emailInstead: 'Email us instead',
      close: 'Close', madeBy: 'By {name}',
    },
    he: {
      dir: 'rtl',
      chat: 'שלחו לנו הודעה בוואטסאפ', chatNamed: 'שלחו הודעה בוואטסאפ אל {name}',
      newTab: '(נפתח בכרטיסייה חדשה)',
      awayName: '{chat}. אנחנו לא זמינים כרגע',
      awayTitle: 'אנחנו לא זמינים כרגע',
      replyToday: 'נחזור אליכם היום ב־{time}.', replyTomorrow: 'נחזור אליכם מחר ב־{time}.',
      replyDay: 'נחזור אליכם ב{day} ב־{time}.', replyDate: 'נחזור אליכם ב־{date} ב־{time}.',
      replyLater: 'נחזור אליכם ברגע שנחזור לפעילות.',
      zone: '{time} ({zone})',
      sendAnyway: 'לשלוח וואטסאפ בכל זאת', email: 'לשלוח לנו מייל', emailInstead: 'לשלוח מייל במקום',
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

  /* ---------- the number and the link ---------- */
  // wa.me wants the full international number, digits only: 972501234567, not 050-123-4567 or +972-50-…
  const phone = String(config.phone ?? '').replace(/[\s\-().+]/g, '').replace(/^00/, '');
  if (!/^[1-9]\d{6,14}$/.test(phone)) {
    console.warn('Meliora WhatsApp: set MelioraWhatsAppConfig.phone to the full international number, digits only, such as "972501234567". Nothing was added to the page.');
    return;
  }
  function chatUrl() {
    const message = fill(pick(config.message), {url: location.origin + location.pathname, title: document.title});
    return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  }
  const email = String(config.email || '').trim();
  function mailUrl() {
    const subject = pick(config.emailSubject);
    return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  }
  const chatName = () => (pick(config.name) ? fill(t('chatNamed'), {name: pick(config.name)}) : t('chat'));

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
  // The WhatsApp glyph, unaltered, as Meta's brand guidelines ask (path data: Simple Icons, CC0).
  const ICON = '<svg class="mwa-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  const MOON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10.6 1.6a6.6 6.6 0 1 0 3.8 10.6A5.3 5.3 0 0 1 10.6 1.6Z"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const newTab = `<span class="mwa-sr"> ${esc(t('newTab'))}</span>`;

  /* ---------- the button ---------- */
  const root = document.createElement('div');
  root.className = 'mwa mwa-root';
  root.lang = lang; root.dir = dir;
  let control = null, state = null, timer = 0;

  // Open: a link straight to WhatsApp. Away (with afterHours on): a button that opens the "We're away" dialog.
  function render() {
    const now = status();
    const away = !now.open && mode !== 'off';
    const key = away ? `away:${replyText(now.next)}` : 'open';
    if (key !== state) {
      state = key;
      const hadFocus = control && control === document.activeElement;
      const next = document.createElement(away ? 'button' : 'a');
      next.className = `mwa-btn${away ? ' mwa-away' : ''}`;
      if (away) {
        next.type = 'button';
        next.setAttribute('aria-haspopup', 'dialog');
        next.setAttribute('aria-controls', 'mwa-dialog');
        next.innerHTML = `${ICON}<span class="mwa-badge">${MOON}</span><span class="mwa-sr">${esc(fill(t('awayName'), {chat: chatName()}))}</span>`;
      } else {
        next.href = chatUrl();
        next.target = '_blank';
        next.rel = 'noopener noreferrer';
        next.innerHTML = `${ICON}<span class="mwa-sr">${esc(chatName())}</span>${newTab}`;
      }
      if (control) control.replaceWith(next); else root.append(next);
      control = next;
      if (hadFocus) control.focus();
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
    if (target?.tagName === 'A') target.href = chatUrl(); // {title} and {url} follow single-page apps
    else if (target) openDialog();
  });

  /* ---------- "We're away" dialog ---------- */
  let dialog = null, shownActions = null;
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
    // Focus goes back to the button (it may have been replaced at opening time), or to <main>.
    dialog.addEventListener('close', () => {
      if (control?.isConnected) control.focus();
      else document.querySelector('main')?.focus?.();
    });
    document.body.append(dialog);
  }
  function fillDialog(now) {
    dialog.querySelector('#mwa-reply').textContent = replyText(now.next);
    const actions = [];
    if (mode === 'notice') actions.push(`<a class="mwa-action mwa-action-chat" href="${esc(chatUrl())}" target="_blank" rel="noopener noreferrer">${ICON}<span>${esc(t('sendAnyway'))}</span>${newTab}</a>`);
    if (email) actions.push(`<a class="mwa-action" href="${esc(mailUrl())}">${esc(t(mode === 'email' ? 'emailInstead' : 'email'))}</a>`);
    // Rebuilt only when it changes, so a periodic re-check never moves keyboard focus.
    const box = dialog.querySelector('.mwa-actions'), markup = actions.join('');
    if (shownActions !== markup) { box.innerHTML = markup; shownActions = markup; }
  }
  function openDialog() {
    if (!dialog) buildDialog();
    if (dialog.open) return;
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
    if (!root.isConnected || !control) return;
    // While the visitor drags the accessibility button, stay put; move once it is dropped.
    if (document.querySelector('.a11y-fab.a11y-dragging')) return;
    const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
    const gap = Math.round(rem * 0.75), edge = Math.round(rem);
    const width = html.clientWidth, height = html.clientHeight;
    const {width: w, height: h} = control.getBoundingClientRect();
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
      const level = Math.round(height - face.bottom + (face.height - h) / 2);
      const candidates = [
        climb(right, Math.ceil(height - fab.top + gap)),
        {right, bottom: Math.floor(height - fab.bottom - gap - h)},
        {right: Math.ceil(width - fab.left + gap), bottom: level},
        {right: Math.floor(width - fab.right - gap - w), bottom: level},
      ];
      spot = candidates.find((c, i) => fits(c.right, c.bottom, i < 2 ? side : edge) && !hit(c.right, c.bottom));
    }
    // No accessibility button (or no room around it): the bottom-right corner, climbing above whatever is in the way.
    if (!spot) {
      spot = climb(edge, edge);
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

  window.MelioraWhatsApp = {
    url: chatUrl,
    isOpen: () => status().open,
    open: () => { if (control?.tagName === 'BUTTON') openDialog(); else window.open(chatUrl(), '_blank', 'noopener,noreferrer'); },
    refresh: () => { state = null; render(); },
  };
})();
