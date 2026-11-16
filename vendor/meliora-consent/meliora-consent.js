/*! Meliora Consent 0.2.0 — https://github.com/melioradev/meliora-consent
    Made by Meliora Novotech Ltd (https://melioranovotech.com). License: MIT with visible attribution, see LICENSE.
    One-file build of src/ — don't edit; run `node scripts/build.mjs`. */
/* One-file install: settings from this script tag's data- attributes, and the stylesheet that sits next to this file.
     <script src="…/dist/meliora-consent.min.js" data-policy="/privacy/" data-categories="analytics marketing"></script>
   Attributes: data-policy (and data-policy-he, …), data-policy-version, data-categories (functional analytics marketing),
   data-consent-mode="false", data-gpc="false", data-renew-days, data-cookie-domain, data-log, data-insert-after,
   data-css="none" (load the CSS yourself). window.MelioraConsentConfig, when the page sets it, wins over the attributes;
   use it for cookie lists. */
(() => {
  const script = document.currentScript;
  if (!script) return;
  const data = script.dataset;
  const config = window.MelioraConsentConfig = window.MelioraConsentConfig || {};
  const set = (key, value) => { if (!(key in config) && value !== undefined && value !== '') config[key] = value; };
  const urls = {};
  for (const [key, value] of Object.entries(data)) {
    const match = /^policy([A-Z][a-z]{1,2})?$/.exec(key); // data-policy, data-policy-he, … (not data-policy-version)
    if (match && value) urls[match[1] ? match[1].toLowerCase() : 'default'] = value;
  }
  if (Object.keys(urls).length) set('policyUrl', urls);
  set('policyVersion', data.policyVersion);
  if (data.categories) set('categories', Object.fromEntries(data.categories.split(/[\s,]+/).filter(Boolean).map(c => [c, {}])));
  if (data.consentMode) set('googleConsentMode', data.consentMode !== 'false');
  if (data.gpc) set('honorGPC', data.gpc !== 'false');
  if (data.renewDays) set('renewAfterDays', Number(data.renewDays));
  set('cookieDomain', data.cookieDomain);
  set('logEndpoint', data.log);
  set('insertAfter', data.insertAfter);
  // Only from the package's own file: bundled into a site's JavaScript, load dist/meliora-consent.css yourself.
  if (data.css !== 'none' && /meliora-consent(\.min)?\.js($|[?#])/.test(script.src)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = script.src.replace(/\.js(?=$|[?#])/, '.css'); // meliora-consent.min.js → meliora-consent.min.css
    link.setAttribute('blocking', 'render');
    script.after(link);
  }
})();

/*! Meliora Consent — https://github.com/melioradev/meliora-consent — MIT with visible attribution, see LICENSE. */
/* Runs synchronously in <head>: after the site's config, before any tagged or Google script.
   Reads the stored choice, sets the Google Consent Mode defaults (and the stored update), and writes the
   allowed categories to <html data-consent>. With no optional categories configured, it does nothing. */
(() => {
  const KEY = 'meliora.consent';
  const CATEGORIES = ['functional', 'analytics', 'marketing'];
  const config = window.MelioraConsentConfig || {};
  const configured = CATEGORIES.filter(c => config.categories && config.categories[c]);
  const state = {KEY, CATEGORIES, config, configured, record: null, choices: {}, gpc: false};
  window.MelioraConsentState = state;
  if (!configured.length) return;

  const html = document.documentElement;
  state.gpc = config.honorGPC !== false && navigator.globalPrivacyControl === true && configured.includes('marketing');
  const policy = String(config.policyVersion ?? '');
  const maxAge = (Number(config.renewAfterDays) || 365) * 864e5;

  // A stored choice counts only for the current policy version, with every configured category answered, and while recent.
  let record = null;
  try { record = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* storage blocked: undecided */ }
  // With `cookieDomain`, a choice made on another subdomain arrives as the meliora_consent cookie.
  if (!record && config.cookieDomain) {
    const match = document.cookie.match(/(?:^|; )meliora_consent=([^;]*)/);
    try { record = match ? JSON.parse(decodeURIComponent(match[1])) : null; } catch { record = null; }
  }
  const valid = record && typeof record === 'object' && record.v === 1 && record.policy === policy
    && record.choices && configured.every(c => typeof record.choices[c] === 'boolean')
    && Date.now() - Date.parse(record.ts) < maxAge;
  state.record = valid ? record : null;

  // Effective choices. A GPC signal that appeared after the choice was made turns marketing off.
  const effective = rec => {
    const choices = {};
    for (const c of configured) choices[c] = Boolean(rec && rec.choices[c]);
    if (state.gpc && rec && !rec.gpc) choices.marketing = false;
    return choices;
  };
  state.choices = effective(state.record);

  // Google Consent Mode v2: functional → functionality/personalization, analytics → analytics, marketing → ads.
  const value = on => (on ? 'granted' : 'denied');
  const signals = c => ({
    functionality_storage: value(c.functional), personalization_storage: value(c.functional),
    analytics_storage: value(c.analytics),
    ad_storage: value(c.marketing), ad_user_data: value(c.marketing), ad_personalization: value(c.marketing),
  });
  const consentMode = config.googleConsentMode !== false;
  if (consentMode) {
    window.dataLayer = window.dataLayer || [];
    // gtag must push the Arguments object itself; Google's tag ignores a plain array.
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {...signals({}), security_storage: 'granted', wait_for_update: 500});
    if (config.adsDataRedaction !== false) window.gtag('set', 'ads_data_redaction', true);
  }

  function apply(choices) {
    html.dataset.consent = configured.filter(c => choices[c]).join(' ');
    if (consentMode) window.gtag('consent', 'update', signals(choices));
  }
  if (state.record) apply(state.choices); else html.dataset.consent = '';
  Object.assign(state, {apply, effective, signals, consentMode});
})();

/*! Meliora Consent — https://github.com/melioradev/meliora-consent — MIT with visible attribution, see LICENSE. */
/* Banner and dialog strings. The banner follows the page's <html lang> and falls back to English.
   All non-English strings must be checked by a native speaker before launch.
   {purposes} is filled with the configured categories' `purposes`, joined with Intl.ListFormat.
   {category} is filled with the category's `inline` phrase. Sites can override any string with `text` in the config. */
window.MelioraConsentI18n = {
  order: ['en', 'ar', 'zh', 'fr', 'de', 'he', 'it', 'ru', 'es', 'uk'],
  en: {
    dir: 'ltr',
    title: 'Cookies on this site',
    intro: 'We’d like to use cookies for {purposes}. They stay off unless you allow them.',
    purposes: {functional: 'features from other companies', analytics: 'analytics', marketing: 'marketing'},
    policy: 'Cookie policy',
    acceptAll: 'Accept all', rejectAll: 'Reject all', choose: 'Choose cookies',
    settingsTitle: 'Cookie settings', close: 'Close', save: 'Save choices', saved: 'Cookie choices saved',
    necessary: 'Necessary', necessaryDesc: 'Needed for the site to work and to remember your choices. They can’t be turned off.', alwaysOn: 'Always on',
    functional: 'Functional', functionalDesc: 'Features from other companies, such as chat, maps or booking.',
    analytics: 'Analytics', analyticsDesc: 'Help us understand how the site is used, so we can improve it.',
    marketing: 'Marketing', marketingDesc: 'Used by advertising companies to show you relevant ads and measure them.',
    inline: {functional: 'functional cookies', analytics: 'analytics cookies', marketing: 'marketing cookies'},
    cookiesIn: 'Cookies in this category', colName: 'Name', colProvider: 'Provider', colPurpose: 'Purpose', colDuration: 'Duration',
    gpcNote: 'Your browser asked sites not to sell or share your data, so marketing cookies are off.',
    embedText: 'This content is from {provider}. Showing it allows {category}.',
    embedAllow: 'Allow {category} and show',
    madeBy: 'Made by {name}',
  },
  ar: {
    dir: 'rtl',
    title: 'ملفات تعريف الارتباط في هذا الموقع',
    intro: 'نود استخدام ملفات تعريف الارتباط لأغراض {purposes}. تبقى معطّلة ما لم تسمح بها.',
    purposes: {functional: 'ميزات من شركات أخرى', analytics: 'التحليلات', marketing: 'التسويق'},
    policy: 'سياسة ملفات تعريف الارتباط',
    acceptAll: 'قبول الكل', rejectAll: 'رفض الكل', choose: 'اختيار ملفات تعريف الارتباط',
    settingsTitle: 'إعدادات ملفات تعريف الارتباط', close: 'إغلاق', save: 'حفظ الاختيارات', saved: 'تم حفظ اختيارات ملفات تعريف الارتباط',
    necessary: 'ضرورية', necessaryDesc: 'لازمة لعمل الموقع ولتذكّر اختياراتك. لا يمكن إيقافها.', alwaysOn: 'مفعّلة دائمًا',
    functional: 'وظيفية', functionalDesc: 'ميزات من شركات أخرى، مثل الدردشة أو الخرائط أو الحجز.',
    analytics: 'تحليلية', analyticsDesc: 'تساعدنا على فهم كيفية استخدام الموقع لنتمكن من تحسينه.',
    marketing: 'تسويقية', marketingDesc: 'تستخدمها شركات الإعلان لعرض إعلانات ملائمة لك وقياسها.',
    inline: {functional: 'ملفات تعريف الارتباط الوظيفية', analytics: 'ملفات تعريف الارتباط التحليلية', marketing: 'ملفات تعريف الارتباط التسويقية'},
    cookiesIn: 'ملفات تعريف الارتباط في هذه الفئة', colName: 'الاسم', colProvider: 'المزوّد', colPurpose: 'الغرض', colDuration: 'المدة',
    gpcNote: 'طلب متصفحك من المواقع عدم بيع بياناتك أو مشاركتها، لذا فإن ملفات تعريف الارتباط التسويقية معطّلة.',
    embedText: 'هذا المحتوى من {provider}. عرضه يعني السماح بـ{category}.',
    embedAllow: 'السماح بـ{category} والعرض',
    madeBy: 'من تطوير {name}',
  },
  zh: {
    dir: 'ltr',
    title: '本网站的 Cookie',
    intro: '我们希望将 Cookie 用于{purposes}。除非您允许，否则它们将保持关闭。',
    purposes: {functional: '其他公司提供的功能', analytics: '统计分析', marketing: '营销'},
    policy: 'Cookie 政策',
    acceptAll: '全部接受', rejectAll: '全部拒绝', choose: '选择 Cookie',
    settingsTitle: 'Cookie 设置', close: '关闭', save: '保存选择', saved: 'Cookie 选择已保存',
    necessary: '必要', necessaryDesc: '网站运行和记住您的选择所必需，无法关闭。', alwaysOn: '始终开启',
    functional: '功能', functionalDesc: '来自其他公司的功能，例如聊天、地图或预约。',
    analytics: '统计分析', analyticsDesc: '帮助我们了解网站的使用情况，以便改进网站。',
    marketing: '营销', marketingDesc: '广告公司用来向您展示相关广告并衡量广告效果。',
    inline: {functional: '功能 Cookie', analytics: '统计分析 Cookie', marketing: '营销 Cookie'},
    cookiesIn: '此类别中的 Cookie', colName: '名称', colProvider: '提供方', colPurpose: '用途', colDuration: '有效期',
    gpcNote: '您的浏览器已要求网站不要出售或共享您的数据，因此营销 Cookie 已关闭。',
    embedText: '此内容来自 {provider}。显示它将允许{category}。',
    embedAllow: '允许{category}并显示',
    madeBy: '由 {name} 开发',
  },
  fr: {
    dir: 'ltr',
    title: 'Cookies sur ce site',
    intro: 'Nous aimerions utiliser des cookies pour {purposes}. Ils restent désactivés tant que vous ne les autorisez pas.',
    purposes: {functional: 'des fonctionnalités d’autres entreprises', analytics: 'la mesure d’audience', marketing: 'le marketing'},
    policy: 'Politique relative aux cookies',
    acceptAll: 'Tout accepter', rejectAll: 'Tout refuser', choose: 'Choisir les cookies',
    settingsTitle: 'Paramètres des cookies', close: 'Fermer', save: 'Enregistrer mes choix', saved: 'Choix des cookies enregistrés',
    necessary: 'Nécessaires', necessaryDesc: 'Indispensables au fonctionnement du site et pour mémoriser vos choix. Ils ne peuvent pas être désactivés.', alwaysOn: 'Toujours actifs',
    functional: 'Fonctionnels', functionalDesc: 'Fonctionnalités d’autres entreprises, comme le chat, les cartes ou la réservation.',
    analytics: 'Mesure d’audience', analyticsDesc: 'Nous aident à comprendre comment le site est utilisé, pour l’améliorer.',
    marketing: 'Marketing', marketingDesc: 'Utilisés par des régies publicitaires pour vous montrer des publicités pertinentes et les mesurer.',
    inline: {functional: 'les cookies fonctionnels', analytics: 'les cookies de mesure d’audience', marketing: 'les cookies marketing'},
    cookiesIn: 'Cookies de cette catégorie', colName: 'Nom', colProvider: 'Fournisseur', colPurpose: 'Finalité', colDuration: 'Durée',
    gpcNote: 'Votre navigateur demande aux sites de ne pas vendre ni partager vos données : les cookies marketing sont donc désactivés.',
    embedText: 'Ce contenu provient de {provider}. L’afficher autorise {category}.',
    embedAllow: 'Autoriser {category} et afficher',
    madeBy: 'Réalisé par {name}',
  },
  de: {
    dir: 'ltr',
    title: 'Cookies auf dieser Website',
    intro: 'Wir möchten Cookies für {purposes} verwenden. Sie bleiben deaktiviert, solange Sie sie nicht erlauben.',
    purposes: {functional: 'Funktionen anderer Unternehmen', analytics: 'Statistik', marketing: 'Marketing'},
    policy: 'Cookie-Richtlinie',
    acceptAll: 'Alle akzeptieren', rejectAll: 'Alle ablehnen', choose: 'Cookies auswählen',
    settingsTitle: 'Cookie-Einstellungen', close: 'Schließen', save: 'Auswahl speichern', saved: 'Cookie-Auswahl gespeichert',
    necessary: 'Notwendig', necessaryDesc: 'Erforderlich, damit die Website funktioniert und sich Ihre Auswahl merkt. Sie können nicht deaktiviert werden.', alwaysOn: 'Immer aktiv',
    functional: 'Funktional', functionalDesc: 'Funktionen anderer Unternehmen, etwa Chat, Karten oder Terminbuchung.',
    analytics: 'Statistik', analyticsDesc: 'Helfen uns zu verstehen, wie die Website genutzt wird, damit wir sie verbessern können.',
    marketing: 'Marketing', marketingDesc: 'Werden von Werbeunternehmen genutzt, um Ihnen relevante Werbung zu zeigen und sie zu messen.',
    inline: {functional: 'funktionale Cookies', analytics: 'Statistik-Cookies', marketing: 'Marketing-Cookies'},
    cookiesIn: 'Cookies in dieser Kategorie', colName: 'Name', colProvider: 'Anbieter', colPurpose: 'Zweck', colDuration: 'Dauer',
    gpcNote: 'Ihr Browser bittet Websites, Ihre Daten nicht zu verkaufen oder weiterzugeben. Marketing-Cookies sind daher deaktiviert.',
    embedText: 'Dieser Inhalt stammt von {provider}. Wenn Sie ihn anzeigen, erlauben Sie {category}.',
    embedAllow: 'Anzeigen und {category} erlauben',
    madeBy: 'Entwickelt von {name}',
  },
  he: {
    dir: 'rtl',
    title: 'עוגיות באתר הזה',
    intro: 'נרצה להשתמש בעוגיות לצורך {purposes}. הן כבויות כל עוד לא אישרת אותן.',
    purposes: {functional: 'תכונות של חברות אחרות', analytics: 'ניתוח שימוש', marketing: 'שיווק'},
    policy: 'מדיניות העוגיות',
    acceptAll: 'אישור הכול', rejectAll: 'דחיית הכול', choose: 'בחירת עוגיות',
    settingsTitle: 'הגדרות עוגיות', close: 'סגירה', save: 'שמירת הבחירות', saved: 'בחירות העוגיות נשמרו',
    necessary: 'הכרחיות', necessaryDesc: 'דרושות כדי שהאתר יפעל ויזכור את הבחירות שלך. אי אפשר לכבות אותן.', alwaysOn: 'פעילות תמיד',
    functional: 'פונקציונליות', functionalDesc: 'תכונות של חברות אחרות, כמו צ׳אט, מפות או הזמנת תורים.',
    analytics: 'ניתוח שימוש', analyticsDesc: 'עוזרות לנו להבין איך משתמשים באתר, כדי לשפר אותו.',
    marketing: 'שיווק', marketingDesc: 'משמשות חברות פרסום כדי להציג לך מודעות רלוונטיות ולמדוד אותן.',
    inline: {functional: 'עוגיות פונקציונליות', analytics: 'עוגיות ניתוח שימוש', marketing: 'עוגיות שיווק'},
    cookiesIn: 'העוגיות בקטגוריה הזו', colName: 'שם', colProvider: 'ספק', colPurpose: 'מטרה', colDuration: 'משך',
    gpcNote: 'הדפדפן שלך ביקש מאתרים לא למכור או לשתף את המידע שלך, ולכן עוגיות השיווק כבויות.',
    embedText: 'התוכן הזה מגיע מ־{provider}. הצגתו מאשרת {category}.',
    embedAllow: 'אישור {category} והצגה',
    madeBy: 'פותח על ידי {name}',
  },
  it: {
    dir: 'ltr',
    title: 'Cookie su questo sito',
    intro: 'Vorremmo usare i cookie per {purposes}. Restano disattivati finché non li consenti.',
    purposes: {functional: 'funzionalità di altre aziende', analytics: 'statistiche', marketing: 'marketing'},
    policy: 'Informativa sui cookie',
    acceptAll: 'Accetta tutti', rejectAll: 'Rifiuta tutti', choose: 'Scegli i cookie',
    settingsTitle: 'Impostazioni dei cookie', close: 'Chiudi', save: 'Salva le scelte', saved: 'Scelte sui cookie salvate',
    necessary: 'Necessari', necessaryDesc: 'Servono al funzionamento del sito e a ricordare le tue scelte. Non si possono disattivare.', alwaysOn: 'Sempre attivi',
    functional: 'Funzionali', functionalDesc: 'Funzionalità di altre aziende, come chat, mappe o prenotazioni.',
    analytics: 'Statistiche', analyticsDesc: 'Ci aiutano a capire come viene usato il sito, per migliorarlo.',
    marketing: 'Marketing', marketingDesc: 'Usati dalle aziende pubblicitarie per mostrarti annunci pertinenti e misurarli.',
    inline: {functional: 'i cookie funzionali', analytics: 'i cookie statistici', marketing: 'i cookie di marketing'},
    cookiesIn: 'Cookie in questa categoria', colName: 'Nome', colProvider: 'Fornitore', colPurpose: 'Finalità', colDuration: 'Durata',
    gpcNote: 'Il tuo browser ha chiesto ai siti di non vendere né condividere i tuoi dati, quindi i cookie di marketing sono disattivati.',
    embedText: 'Questo contenuto proviene da {provider}. Mostrarlo consente {category}.',
    embedAllow: 'Consenti {category} e mostra',
    madeBy: 'Realizzato da {name}',
  },
  ru: {
    dir: 'ltr',
    title: 'Файлы cookie на этом сайте',
    intro: 'Мы хотели бы использовать файлы cookie для {purposes}. Они отключены, пока вы их не разрешите.',
    purposes: {functional: 'функций других компаний', analytics: 'аналитики', marketing: 'маркетинга'},
    policy: 'Политика использования файлов cookie',
    acceptAll: 'Принять все', rejectAll: 'Отклонить все', choose: 'Выбрать cookie',
    settingsTitle: 'Настройки файлов cookie', close: 'Закрыть', save: 'Сохранить выбор', saved: 'Выбор файлов cookie сохранён',
    necessary: 'Необходимые', necessaryDesc: 'Нужны для работы сайта и для сохранения вашего выбора. Их нельзя отключить.', alwaysOn: 'Всегда включены',
    functional: 'Функциональные', functionalDesc: 'Функции других компаний, например чат, карты или онлайн-запись.',
    analytics: 'Аналитические', analyticsDesc: 'Помогают нам понять, как используется сайт, чтобы улучшить его.',
    marketing: 'Маркетинговые', marketingDesc: 'Используются рекламными компаниями, чтобы показывать вам подходящую рекламу и измерять её эффективность.',
    inline: {functional: 'функциональные файлы cookie', analytics: 'аналитические файлы cookie', marketing: 'маркетинговые файлы cookie'},
    cookiesIn: 'Файлы cookie в этой категории', colName: 'Название', colProvider: 'Поставщик', colPurpose: 'Назначение', colDuration: 'Срок',
    gpcNote: 'Ваш браузер попросил сайты не продавать и не передавать ваши данные, поэтому маркетинговые файлы cookie отключены.',
    embedText: 'Этот контент предоставлен {provider}. Его показ разрешает {category}.',
    embedAllow: 'Разрешить {category} и показать',
    madeBy: 'Разработано {name}',
  },
  es: {
    dir: 'ltr',
    title: 'Cookies en este sitio',
    intro: 'Nos gustaría usar cookies para {purposes}. Permanecen desactivadas a menos que las permitas.',
    purposes: {functional: 'funciones de otras empresas', analytics: 'analítica', marketing: 'marketing'},
    policy: 'Política de cookies',
    acceptAll: 'Aceptar todas', rejectAll: 'Rechazar todas', choose: 'Elegir cookies',
    settingsTitle: 'Configuración de cookies', close: 'Cerrar', save: 'Guardar elección', saved: 'Elección de cookies guardada',
    necessary: 'Necesarias', necessaryDesc: 'Son necesarias para que el sitio funcione y recuerde tus elecciones. No se pueden desactivar.', alwaysOn: 'Siempre activas',
    functional: 'Funcionales', functionalDesc: 'Funciones de otras empresas, como chat, mapas o reservas.',
    analytics: 'Analíticas', analyticsDesc: 'Nos ayudan a entender cómo se usa el sitio para poder mejorarlo.',
    marketing: 'Marketing', marketingDesc: 'Las usan empresas de publicidad para mostrarte anuncios relevantes y medirlos.',
    inline: {functional: 'las cookies funcionales', analytics: 'las cookies analíticas', marketing: 'las cookies de marketing'},
    cookiesIn: 'Cookies de esta categoría', colName: 'Nombre', colProvider: 'Proveedor', colPurpose: 'Finalidad', colDuration: 'Duración',
    gpcNote: 'Tu navegador pidió a los sitios que no vendan ni compartan tus datos, así que las cookies de marketing están desactivadas.',
    embedText: 'Este contenido es de {provider}. Mostrarlo permite {category}.',
    embedAllow: 'Permitir {category} y mostrar',
    madeBy: 'Desarrollado por {name}',
  },
  uk: {
    dir: 'ltr',
    title: 'Файли cookie на цьому сайті',
    intro: 'Ми хотіли б використовувати файли cookie для {purposes}. Вони вимкнені, доки ви їх не дозволите.',
    purposes: {functional: 'функцій інших компаній', analytics: 'аналітики', marketing: 'маркетингу'},
    policy: 'Політика щодо файлів cookie',
    acceptAll: 'Прийняти всі', rejectAll: 'Відхилити всі', choose: 'Вибрати cookie',
    settingsTitle: 'Налаштування файлів cookie', close: 'Закрити', save: 'Зберегти вибір', saved: 'Вибір файлів cookie збережено',
    necessary: 'Необхідні', necessaryDesc: 'Потрібні для роботи сайту та для збереження вашого вибору. Їх не можна вимкнути.', alwaysOn: 'Завжди увімкнені',
    functional: 'Функціональні', functionalDesc: 'Функції інших компаній, наприклад чат, карти або онлайн-запис.',
    analytics: 'Аналітичні', analyticsDesc: 'Допомагають нам зрозуміти, як використовується сайт, щоб покращити його.',
    marketing: 'Маркетингові', marketingDesc: 'Використовуються рекламними компаніями, щоб показувати вам доречну рекламу та вимірювати її ефективність.',
    inline: {functional: 'функціональні файли cookie', analytics: 'аналітичні файли cookie', marketing: 'маркетингові файли cookie'},
    cookiesIn: 'Файли cookie в цій категорії', colName: 'Назва', colProvider: 'Постачальник', colPurpose: 'Призначення', colDuration: 'Термін',
    gpcNote: 'Ваш браузер попросив сайти не продавати й не передавати ваші дані, тому маркетингові файли cookie вимкнені.',
    embedText: 'Цей вміст надає {provider}. Його показ дозволяє {category}.',
    embedAllow: 'Дозволити {category} і показати',
    madeBy: 'Розроблено {name}',
  },
};

(() => {
  const start = () => {
/*! Meliora Consent — https://github.com/melioradev/meliora-consent
    Made by Meliora Novotech Ltd (https://melioranovotech.com). License: MIT with visible attribution. The
    "Made by Meliora Novotech Ltd" credit in the cookie settings dialog must stay. See LICENSE.

   meliora-consent-boot.js has already read the stored choice and set the Consent Mode defaults.
   This file builds the banner and the settings dialog, releases tagged scripts and embeds, and
   provides window.MelioraConsent. Spec: COOKIE-CONSENT.md in melioradev/meliora-landing. */
(() => {
  const S = window.MelioraConsentState;
  const I18N = window.MelioraConsentI18n;
  if (!S || !I18N || !S.configured.length) return;
  const {KEY, config, configured} = S;
  const html = document.documentElement;
  const REPO_URL = 'https://github.com/melioradev/meliora-consent';
  const SITE_URL = 'https://melioranovotech.com';

  /* ---------- language: the banner is page content, so it follows <html lang> ---------- */
  const base = (html.lang || 'en').toLowerCase().split('-')[0].replace(/^iw$/, 'he');
  const lang = I18N[base] && base !== 'order' ? base : 'en';
  const dir = I18N[lang].dir;
  const text = config.text || {};
  const t = key => text[lang]?.[key] ?? text.default?.[key] ?? I18N[lang][key] ?? I18N.en[key];
  const pick = v => (typeof v === 'string' ? v : v && typeof v === 'object' ? (v[lang] ?? v.default ?? v.en ?? '') : '');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  const joinList = items => { try { return new Intl.ListFormat(lang, {type: 'conjunction'}).format(items); } catch { return items.join(', '); } };
  const policyHref = pick(config.policyUrl) || null;
  const CLOSE = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const button = (action, label, extra = '') => `<button type="button" class="mc-btn" data-mc="${action}"${extra}>${esc(label)}</button>`;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));

  // "Accept all" never turns marketing on while the browser sends Global Privacy Control.
  const all = on => Object.fromEntries(configured.map(c => [c, on && !(S.gpc && c === 'marketing')]));
  const allowed = list => String(list || '').split(/\s+/).filter(Boolean).every(c => S.choices[c] === true);

  /* ---------- status message (also a live region) ---------- */
  const status = document.createElement('p');
  status.className = 'mc mc-status';
  status.setAttribute('role', 'status');
  status.lang = lang; status.dir = dir;
  document.body.append(status);
  let statusTimer;
  function announce(message) {
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 2500);
  }

  function focusMain() {
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
      main.addEventListener('blur', () => main.removeAttribute('tabindex'), {once: true});
    }
    main.focus({preventScroll: true});
  }

  /* ---------- banner (first layer) ---------- */
  let banner = null, spacer = null, resizeObserver = null, fabObserver = null, frame = 0;
  const savedPadding = html.style.scrollPaddingBottom;
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(layout); };

  function buildBanner() {
    banner = document.createElement('section');
    banner.className = 'mc mc-banner';
    banner.setAttribute('aria-labelledby', 'mc-title');
    banner.lang = lang; banner.dir = dir;
    const purposes = joinList(configured.map(c => t('purposes')[c]));
    banner.innerHTML = `<h2 id="mc-title" class="mc-title">${esc(t('title'))}</h2>
      <p class="mc-text">${esc(fill(t('intro'), {purposes}))}${policyHref ? ` <a href="${esc(policyHref)}">${esc(t('policy'))}</a>` : ''}</p>
      ${S.gpc ? `<p class="mc-gpc">${esc(t('gpcNote'))}</p>` : ''}
      <div class="mc-buttons">${button('accept', t('acceptAll'))}${button('reject', t('rejectAll'))}${button('choose', t('choose'), ' aria-haspopup="dialog" aria-controls="mc-dialog"')}</div>`;
    banner.addEventListener('click', event => {
      const control = event.target.closest('[data-mc]');
      if (!control) return;
      if (control.dataset.mc === 'accept') decide(all(true), 'accept-all');
      else if (control.dataset.mc === 'reject') decide(all(false), 'reject-all');
      else if (control.dataset.mc === 'choose') openDialog(control);
    });
    // Early in the reading and Tab order: after the accessibility button, otherwise after the skip link.
    const anchor = (config.insertAfter && document.querySelector(config.insertAfter))
      || document.querySelector('.a11y-fab')
      || document.querySelector('.skip, .skip-link, a[href="#main"], a[href="#content"]');
    if (anchor) anchor.after(banner); else document.body.prepend(banner);
    spacer = document.createElement('div');
    spacer.className = 'mc-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    document.body.append(spacer);
    document.addEventListener('focusin', keepFocusVisible);

    resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(banner);
    resizeObserver.observe(html);
    addEventListener('resize', schedule);
    watchFab();
    // The accessibility panel may load after this script: look again once the page is parsed.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { watchFab(); schedule(); }, {once: true});
    layout();
  }
  // Re-measure when the visitor hides, shows or drags the accessibility button.
  function watchFab() {
    const fab = document.querySelector('.a11y-fab');
    if (!fab || fabObserver || !banner) return;
    fabObserver = new MutationObserver(schedule);
    fabObserver.observe(fab, {attributes: true, attributeFilter: ['hidden', 'class']});
  }

  /* Card at the bottom-left when there is room beside the accessibility button (bottom-right),
     otherwise a full-width sheet that lifts the button by its height. Measured, not a media query,
     because the panel's text size scales rem and media queries ignore that. */
  function layout() {
    if (!banner) return;
    const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
    const fab = document.querySelector('.a11y-fab');
    const fabSpace = fab && !fab.hidden && !fab.classList.contains('a11y-moved') ? 3.75 : 0;
    const sheet = html.clientWidth < rem * (28 + fabSpace);
    banner.classList.toggle('mc-sheet', sheet);
    const height = Math.ceil(banner.getBoundingClientRect().height);
    const clearance = height + (sheet ? 0 : Math.ceil(rem));
    html.style.setProperty('--meliora-consent-inset', sheet ? `${height}px` : '0px');
    html.style.scrollPaddingBottom = `${clearance}px`;
    spacer.style.height = `${clearance}px`;
  }

  /* Focus not obscured (WCAG 2.2, 2.4.11): browsers ignore scroll-padding when Tab moves focus,
     so an element that lands behind the banner is scrolled above it (scrollIntoView honors scroll-padding). */
  function keepFocusVisible(event) {
    const target = event.target;
    if (!banner || !(target instanceof Element) || banner.contains(target) || target.closest('dialog')) return;
    for (let el = target; el && el !== document.body; el = el.parentElement) if (getComputedStyle(el).position === 'fixed') return;
    const r = target.getBoundingClientRect(), b = banner.getBoundingClientRect();
    if (r.bottom > b.top && r.top < b.bottom && r.right > b.left && r.left < b.right) target.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
  }

  function removeBanner() {
    if (!banner) return false;
    const hadFocus = banner.contains(document.activeElement);
    resizeObserver?.disconnect(); fabObserver?.disconnect(); fabObserver = null; cancelAnimationFrame(frame);
    removeEventListener('resize', schedule);
    banner.remove(); banner = null;
    spacer.remove(); spacer = null;
    document.removeEventListener('focusin', keepFocusVisible);
    html.style.removeProperty('--meliora-consent-inset');
    html.style.scrollPaddingBottom = savedPadding;
    return hadFocus;
  }

  /* ---------- settings dialog (second layer) ---------- */
  let dialog = null, opener = null;
  const cookieList = entries => (Array.isArray(entries) && entries.length
    ? `<details class="mc-details"><summary>${esc(t('cookiesIn'))}</summary>${entries.map(c => `<dl class="mc-cookie">
        <div><dt>${esc(t('colName'))}</dt><dd><code>${esc(c.name)}</code></dd></div>
        <div><dt>${esc(t('colProvider'))}</dt><dd>${esc(pick(c.provider))}</dd></div>
        <div><dt>${esc(t('colPurpose'))}</dt><dd>${esc(pick(c.purpose))}</dd></div>
        <div><dt>${esc(t('colDuration'))}</dt><dd>${esc(pick(c.duration))}</dd></div></dl>`).join('')}</details>`
    : '');

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.id = 'mc-dialog';
    dialog.className = 'mc mc-dialog';
    dialog.lang = lang; dialog.dir = dir;
    dialog.setAttribute('aria-labelledby', 'mc-dialog-title');
    const rows = configured.map(c => `<li class="mc-cat">
        <button type="button" class="mc-row" data-cat="${c}" aria-pressed="false" aria-describedby="mc-desc-${c}"><span class="mc-label">${esc(t(c))}</span><span class="mc-switch" aria-hidden="true"></span></button>
        <p class="mc-desc" id="mc-desc-${c}">${esc(t(`${c}Desc`))}</p>${cookieList(config.categories[c].cookies)}</li>`).join('');
    dialog.innerHTML = `<div class="mc-head"><h2 id="mc-dialog-title" class="mc-title" tabindex="-1">${esc(t('settingsTitle'))}</h2>
        <button type="button" class="mc-close" data-mc="close" aria-label="${esc(t('close'))}">${CLOSE}</button></div>
      <div class="mc-body">
        ${S.gpc ? `<p class="mc-gpc">${esc(t('gpcNote'))}</p>` : ''}
        <ul class="mc-cats">
          <li class="mc-cat"><div class="mc-row mc-fixed"><span class="mc-label">${esc(t('necessary'))}</span><span class="mc-always">${esc(t('alwaysOn'))}</span></div>
            <p class="mc-desc">${esc(t('necessaryDesc'))}</p>${cookieList(config.necessary?.cookies)}</li>
          ${rows}
        </ul>
        <div class="mc-buttons">${button('save', t('save'))}${button('reject', t('rejectAll'))}${button('accept', t('acceptAll'))}</div>
        ${policyHref ? `<p class="mc-policy"><a href="${esc(policyHref)}">${esc(t('policy'))}</a></p>` : ''}
        <p class="mc-credit">${esc(t('madeBy')).replace('{name}', `<a href="${REPO_URL}" rel="noopener">Meliora Novotech Ltd</a>`)} · <a href="${SITE_URL}" rel="noopener">melioranovotech.com</a></p>
      </div>`;
    dialog.addEventListener('click', event => {
      if (event.target === dialog) { // the backdrop
        const r = dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
        return;
      }
      const toggle = event.target.closest('[data-cat]');
      if (toggle) { toggle.setAttribute('aria-pressed', String(toggle.getAttribute('aria-pressed') !== 'true')); return; }
      const action = event.target.closest('[data-mc]')?.dataset.mc;
      if (action === 'close') dialog.close();
      else if (action === 'accept') decide(all(true), 'accept-all');
      else if (action === 'reject') decide(all(false), 'reject-all');
      else if (action === 'save') {
        decide(Object.fromEntries(configured.map(c => [c, dialog.querySelector(`[data-cat="${c}"]`).getAttribute('aria-pressed') === 'true'])), 'custom');
      }
    });
    // Esc and the close button close without saving. Focus returns to the opener, or to <main> if it is gone.
    dialog.addEventListener('close', () => {
      const target = opener && opener.isConnected ? opener : null;
      opener = null;
      if (target) target.focus(); else focusMain();
    });
    document.body.append(dialog);
  }

  function openDialog(from) {
    if (!dialog) buildDialog();
    if (dialog.open) return;
    opener = from instanceof HTMLElement && from !== document.body ? from : null;
    for (const c of configured) dialog.querySelector(`[data-cat="${c}"]`).setAttribute('aria-pressed', String(S.choices[c] === true));
    dialog.showModal();
    dialog.querySelector('#mc-dialog-title').focus();
  }

  /* ---------- releasing scripts and embeds ---------- */
  function release() {
    // Tagged scripts, in document order. Ones without `async` keep their order (async = false).
    for (const old of document.querySelectorAll('script[type="text/plain"][data-consent]')) {
      if (!allowed(old.dataset.consent)) continue;
      const script = document.createElement('script');
      for (const {name, value} of [...old.attributes]) if (!['type', 'data-type', 'nonce'].includes(name)) script.setAttribute(name, value);
      script.type = old.dataset.type || 'text/javascript';
      if (old.nonce) script.nonce = old.nonce; // the nonce attribute reads as empty once the page has loaded
      if (!old.hasAttribute('async')) script.async = false;
      if (!old.hasAttribute('src')) script.text = old.text;
      old.replaceWith(script);
    }
    for (const iframe of document.querySelectorAll('iframe[data-consent][data-src]')) {
      if (allowed(iframe.dataset.consent)) showEmbed(iframe); else placeholder(iframe);
    }
  }

  function placeholder(iframe) {
    if (iframe.previousElementSibling?.classList.contains('mc-embed')) return;
    iframe.hidden = true;
    const cats = iframe.dataset.consent.split(/\s+/).filter(c => configured.includes(c));
    const category = joinList(cats.map(c => t('inline')[c]));
    let provider = iframe.dataset.provider || '';
    if (!provider) { try { provider = new URL(iframe.dataset.src, location.href).hostname.replace(/^www\./, ''); } catch { /* keep empty */ } }
    const box = document.createElement('div');
    box.className = 'mc mc-embed';
    box.lang = lang; box.dir = dir;
    box.setAttribute('role', 'group');
    if (iframe.title) box.setAttribute('aria-label', iframe.title);
    const w = Number(iframe.getAttribute('width')), h = Number(iframe.getAttribute('height'));
    if (w > 0 && h > 0) { box.style.aspectRatio = `${w} / ${h}`; box.style.maxInlineSize = `${w}px`; }
    box.innerHTML = `${iframe.title ? `<p class="mc-embed-title">${esc(iframe.title)}</p>` : ''}
      <p>${esc(fill(t('embedText'), {provider, category}))}</p>
      <div class="mc-buttons">${button('allow', fill(t('embedAllow'), {category}))}${button('settings', t('settingsTitle'), ' aria-haspopup="dialog" aria-controls="mc-dialog"')}</div>`;
    box.addEventListener('click', event => {
      const control = event.target.closest('[data-mc]');
      if (!control) return;
      if (control.dataset.mc === 'settings') { openDialog(control); return; }
      const next = {...all(false), ...(S.record ? S.choices : {})};
      for (const c of cats) next[c] = true;
      decide(next, 'embed');
    });
    iframe.before(box);
  }

  function showEmbed(iframe) {
    const box = iframe.previousElementSibling?.classList.contains('mc-embed') ? iframe.previousElementSibling : null;
    const hadFocus = Boolean(box?.contains(document.activeElement));
    iframe.src = iframe.dataset.src;
    iframe.removeAttribute('data-src');
    iframe.hidden = false;
    box?.remove();
    if (hadFocus) iframe.focus();
  }

  /* ---------- withdrawing: delete the category's declared first-party cookies and storage keys ---------- */
  function expire(name) {
    const parts = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join('.')}`);
    for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
  }
  function forget(cats) {
    const names = document.cookie ? document.cookie.split('; ').map(c => c.split('=')[0]) : [];
    for (const c of cats) {
      const entry = config.categories[c] || {};
      for (const cookie of entry.cookies || []) {
        for (const pattern of String(cookie.name || '').split(/\s*,\s*/).filter(Boolean)) {
          (pattern.endsWith('*') ? names.filter(n => n.startsWith(pattern.slice(0, -1))) : [pattern]).forEach(expire);
        }
      }
      for (const key of entry.storageKeys || []) { try { localStorage.removeItem(key); } catch { /* blocked */ } }
    }
  }

  /* ---------- saving a choice ---------- */
  function writeCookie(record) {
    if (!config.cookieDomain) return;
    const days = Number(config.renewAfterDays) || 365;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `meliora_consent=${encodeURIComponent(JSON.stringify(record))}; domain=${config.cookieDomain}; path=/; max-age=${Math.round(days * 86400)}; SameSite=Lax${secure}`;
  }
  function log(record) {
    if (!config.logEndpoint || !navigator.sendBeacon) return;
    const {id, policy, ts, method, choices, gpc} = record; // no IP address, no user agent
    try { navigator.sendBeacon(config.logEndpoint, new Blob([JSON.stringify({id, policy, ts, method, choices, gpc})], {type: 'application/json'})); } catch { /* best effort */ }
  }

  function decide(next, method) {
    const before = S.record ? {...S.choices} : null;
    const record = {
      v: 1, id: S.record?.id || uuid(), policy: String(config.policyVersion ?? ''), ts: new Date().toISOString(),
      method, gpc: S.gpc, choices: Object.fromEntries(configured.map(c => [c, next[c] === true])),
    };
    try { localStorage.setItem(KEY, JSON.stringify(record)); } catch { /* lasts for this page view only */ }
    writeCookie(record);
    S.record = record;
    S.choices = S.effective(record);
    S.apply(S.choices);
    if (S.consentMode) window.dataLayer.push({event: 'meliora_consent_update', meliora_consent: {...S.choices}});
    document.dispatchEvent(new CustomEvent('meliora-consent', {detail: {choices: {...S.choices}, method, gpc: S.gpc}}));
    log(record);
    // A script that has run can't be unloaded: delete what the withdrawn categories left behind, then reload.
    const withdrawn = before ? configured.filter(c => before[c] && !S.choices[c]) : [];
    if (withdrawn.length) { forget(withdrawn); location.reload(); return; }
    release();
    const bannerHadFocus = removeBanner();
    if (dialog?.open) dialog.close();
    announce(t('saved'));
    if (bannerHadFocus) focusMain();
  }

  /* ---------- start ---------- */
  for (const control of document.querySelectorAll('[data-consent-open]')) {
    control.hidden = false;
    control.addEventListener('click', event => { event.preventDefault(); openDialog(control); });
  }
  release();
  if (!S.record) buildBanner();

  window.MelioraConsent = {
    get: () => (S.record ? {...S.choices} : null),
    has: category => Boolean(S.record && S.choices[category] === true),
    open: () => openDialog(document.activeElement),
    reset: () => {
      try { localStorage.removeItem(KEY); } catch { /* blocked */ }
      if (config.cookieDomain) document.cookie = `meliora_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${config.cookieDomain}`;
      forget(configured.filter(c => S.choices[c]));
      location.reload();
    },
  };
})();

  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})();
