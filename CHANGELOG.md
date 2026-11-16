# Changelog

## 0.1.0 — 2026-11-16

First version: project #4 in `PROJECT-IDEAS.md` (melioradev/meliora-landing).

- A WhatsApp chat button that is a real link to `https://wa.me/<number>?text=…`, with an accessible name ("Chat with us on WhatsApp (opens in a new tab)"), an optional business name and a pre-filled message per language (`{title}` and `{url}` placeholders).
- Business hours per weekday, several ranges per day, days off (`closedDates`), in the business's time zone (default `Asia/Jerusalem`). Outside hours the button becomes a `<button>` with a moon badge that opens a "We're away" dialog: when you'll reply (today, tomorrow, a weekday or a date, with the time zone named for visitors elsewhere), Send a WhatsApp anyway and Email us (`afterHours: 'notice'`), or only Email us instead (`afterHours: 'email'`). It switches by itself at opening and closing time and keeps keyboard focus.
- Stacks on the Meliora Accessibility button, centred on it wherever it is (dragged too), and stays clear of the Meliora Consent banner (card or sheet), at any width and at 100–200% text, in English and Hebrew. Moves beside the accessibility button on short screens.
- 44×44 px target, two-colour focus ring, the official WhatsApp glyph in white on WhatsApp's teal `#128c7e` (4.1:1; WhatsApp's bright green is a one-line option, at 2:1); follows the panel's High contrast and text size settings and the site's colour tokens.
- Hebrew and English, following `<html lang>`, right to left in Hebrew. Hebrew strings need a native speaker's review.
- No third-party script, no requests, no cookies, no storage, no click events. Works under a strict Content-Security-Policy.
- A small credit at the bottom right of the "We're away" dialog: "By Meliora" ("פיתוח Meliora" in Hebrew), linked to melioranovotech.com.
- `window.MelioraWhatsApp`: `url()`, `isOpen()`, `open()`, `refresh()`.
- Tests: Playwright with axe in Chromium, Firefox and WebKit, against the published Meliora Accessibility 1.1.0 and Meliora Consent 0.2.0.
