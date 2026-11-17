# Changelog

## Unreleased

- **Telegram.** Set `telegram` to a username (`acme_support`, `@acme_support`, `https://t.me/acme_support`), a phone number (`+972501234567`) or a private group's invite link (`https://t.me/+…`, `https://t.me/joinchat/…`, without a pre-filled message, which Telegram doesn't take there) for a Telegram button linking to `https://t.me/…?text=…`, named "Chat with us on Telegram (opens in a new tab)" ("שלחו לנו הודעה בטלגרם" in Hebrew). Use it beside WhatsApp or on its own: `phone` is no longer required, as long as one of the two is set. Usernames are checked against Telegram's rules (4–32 letters, digits and underscores, starting with a letter, not ending with an underscore), so a typo warns instead of linking nowhere. An unusable value for one app is ignored and the other still shows. Each problem gets one console warning: a WhatsApp-only site with a bad number hears about its number only.
- With both, Telegram sits above WhatsApp and the two move as one block around the accessibility button and the cookie banner. Beside the accessibility button (short screens with large text) they go side by side, so both stay level with it, with WhatsApp next to it in English and Hebrew alike. When there is no room around the accessibility button, they go side by side in the corner if a column doesn't fit.
- Outside hours each button opens the "We're away" dialog for its own app: "Send a Telegram message anyway" or "Send a WhatsApp anyway", plus email. Focus goes back to the button that opened it.
- Telegram's classic blue `#0088cc` by default (3.9:1 with the white icon), `#0077b3` for the dialog's text button (4.9:1). New tokens: `--telegram-bg`, `--telegram-bg-hover`, `--telegram-text-bg`, `--telegram-text-bg-hover`. The Telegram glyph is unaltered (Simple Icons, CC0).
- `MelioraWhatsApp.url(app)` and `open(app)` take `'whatsapp'` or `'telegram'`. Without it they use WhatsApp, as before, or Telegram when it is the only app.
- Existing WhatsApp-only setups work unchanged.

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
