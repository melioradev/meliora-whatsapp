/*! Meliora Accessibility 1.1.0 — https://github.com/melioradev/meliora-accessibility
    Made by Meliora Novotech Ltd (https://melioranovotech.com). License: MIT with visible attribution, see LICENSE.
    One-file build of src/ — don't edit; run `node scripts/build.mjs`. */
/* One-file install: settings from this script tag's data- attributes, and the stylesheet that sits next to this file.
     <script src="…/dist/meliora-a11y.min.js" data-statement="/accessibility/" data-statement-he="/accessibility/he/"></script>
   window.MelioraA11yConfig, when the page sets it, wins over the attributes. data-css="none": load the CSS yourself. */
(() => {
  const script = document.currentScript;
  if (!script) return;
  const data = script.dataset;
  const config = window.MelioraA11yConfig = window.MelioraA11yConfig || {};
  if (!('statementUrl' in config)) {
    const urls = {};
    for (const [key, value] of Object.entries(data)) {
      const match = /^statement([A-Z][a-z]{1,2})?$/.exec(key); // data-statement, data-statement-he, …
      if (match && value) urls[match[1] ? match[1].toLowerCase() : 'default'] = value;
    }
    if (Object.keys(urls).length) config.statementUrl = urls;
  }
  if (!('insertAfter' in config) && data.insertAfter) config.insertAfter = data.insertAfter;
  // Only from the package's own file: bundled into a site's JavaScript, load dist/meliora-a11y.css yourself.
  if (data.css !== 'none' && /meliora-a11y(\.min)?\.js($|[?#])/.test(script.src)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = script.src.replace(/\.js(?=$|[?#])/, '.css'); // meliora-a11y.min.js → meliora-a11y.min.css
    link.setAttribute('blocking', 'render');
    script.after(link);
  }
})();

/*! Meliora Accessibility — https://github.com/melioradev/meliora-accessibility — MIT with visible attribution, see LICENSE. */
/* Settings — applied before first paint.
   Loaded synchronously in <head> so the page never flashes without the visitor's settings. */
(() => {
  const KEY = 'meliora.a11y';
  const SCALES = [1, 1.25, 1.5, 1.75, 2];
  const html = document.documentElement;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* storage blocked: use defaults */ }

  const media = q => { try { return matchMedia(q).matches; } catch { return false; } };
  const fresh = !saved || typeof saved !== 'object';
  const s = fresh ? {} : saved;
  const state = {
    focus: s.focus === true,
    contrast: fresh ? media('(prefers-contrast: more)') : s.contrast === true,
    motion: fresh ? media('(prefers-reduced-motion: reduce)') : s.motion === true,
    links: s.links === true,
    captions: s.captions === true,
    scale: SCALES.includes(s.scale) ? s.scale : 1,
    lang: typeof s.lang === 'string' ? s.lang : null,
    // Turns off Alt+0 and the Shift shortcuts (WCAG 2.1.4). `openerDisabled` is the older name.
    shortcutsOff: s.shortcutsOff === true || s.openerDisabled === true,
    // Where the visitor dragged the accessibility button: fractions of the free space (0–1), or null for the default corner.
    pos: s.pos && Number.isFinite(s.pos.x) && Number.isFinite(s.pos.y) ? {x: Math.min(1, Math.max(0, s.pos.x)), y: Math.min(1, Math.max(0, s.pos.y))} : null,
  };

  function apply(next) {
    html.classList.toggle('a11y-focus', next.focus);
    html.classList.toggle('a11y-contrast', next.contrast);
    html.classList.toggle('a11y-motion-off', next.motion);
    html.classList.toggle('a11y-links', next.links);
    html.style.setProperty('--a11y-text-scale', String(next.scale));
  }
  apply(state);
  window.MelioraA11yState = {KEY, SCALES, state, apply};
})();

/*! Meliora Accessibility — https://github.com/melioradev/meliora-accessibility — MIT with visible attribution, see LICENSE. */
/* Accessibility menu strings. All non-English strings must be checked by a native speaker before launch.
   `order` is the list shown in the language menu: English first (the default), then A–Z by English name. */
window.MelioraA11yI18n = {
  order: ['en', 'ar', 'zh', 'fr', 'de', 'he', 'it', 'ru', 'es', 'uk'],
  en: {
    madeBy: 'Made by {name}',
    langName: 'English', htmlLang: 'en', dir: 'ltr',
    open: 'Open accessibility menu', title: 'Accessibility menu', close: 'Close', language: 'Language',
    focus: 'Highlight focus', outline: 'Page outline', textSize: 'Text size', contrast: 'High contrast',
    motion: 'Stop animations', links: 'Highlight links & fields', captions: 'Captions', noMedia: 'No video on this page',
    statement: 'Accessibility statement', reset: 'Reset all', resetDone: 'All settings reset',
    cookieSettings: 'Cookie settings',
    on: 'On', off: 'Off', shortcut: 'Shortcut',
    help: ["Alt+0 opens or closes this menu.", "In the menu, press an option’s key: 1–7, 0, or + and − for text size.", "Anywhere on the page, hold Shift and press the same key, for example Shift+3 for high contrast. This doesn’t work while you are typing in a field.", "Esc closes the menu."],
    textSmaller: "Smaller text", textLarger: "Larger text",
    shortcutsTitle: "Keyboard shortcuts", disableShortcuts: "Turn off keyboard shortcuts",
    srTip: 'Using a screen reader? Switch to focus mode to use the number keys, or activate the buttons as usual.',
    moveHelp: 'You can drag the accessibility button anywhere on the screen, or focus it and use the arrow keys.',
    hideButton: 'Hide accessibility button',
    buttonHidden: 'Accessibility button hidden. Press Alt+0, or use the accessibility link in the footer, to open the menu.',
    lmHeader: 'Site header', lmNav: 'Navigation', lmMain: 'Main content', lmFooter: 'Footer',
  },
  ar: {
    madeBy: 'من تطوير {name}',
    langName: 'العربية', htmlLang: 'ar', dir: 'rtl',
    open: 'فتح قائمة إمكانية الوصول', title: 'قائمة إمكانية الوصول', close: 'إغلاق', language: 'اللغة',
    focus: 'إبراز التركيز', outline: 'مخطط الصفحة', textSize: 'حجم النص', contrast: 'تباين عالٍ',
    motion: 'إيقاف الحركة', links: 'إبراز الروابط والحقول', captions: 'الترجمة النصية', noMedia: 'لا يوجد فيديو في هذه الصفحة',
    statement: 'بيان إمكانية الوصول', reset: 'إعادة ضبط الكل', resetDone: 'تمت إعادة ضبط جميع الإعدادات',
    cookieSettings: 'إعدادات ملفات تعريف الارتباط',
    on: 'مفعّل', off: 'متوقف', shortcut: 'اختصار',
    help: ["يفتح Alt+0 هذه القائمة أو يغلقها.", "داخل القائمة، اضغط مفتاح الخيار: 1–7 أو 0، أو + و − لحجم النص.", "في أي مكان في الصفحة، اضغط Shift مع المفتاح نفسه، مثل Shift+3 للتباين العالي. لا يعمل ذلك أثناء الكتابة في حقل.", "مفتاح Esc يغلق القائمة."],
    textSmaller: "تصغير النص", textLarger: "تكبير النص",
    shortcutsTitle: "اختصارات لوحة المفاتيح", disableShortcuts: "إيقاف اختصارات لوحة المفاتيح",
    srTip: 'تستخدم قارئ شاشة؟ انتقل إلى وضع التركيز لاستخدام مفاتيح الأرقام، أو فعّل الأزرار كالمعتاد.',
    moveHelp: 'يمكنك سحب زر إمكانية الوصول إلى أي مكان على الشاشة، أو التركيز عليه واستخدام مفاتيح الأسهم.',
    hideButton: 'إخفاء زر إمكانية الوصول',
    buttonHidden: 'تم إخفاء زر إمكانية الوصول. لفتح القائمة، اضغط Alt+0 أو استخدم رابط إمكانية الوصول في أسفل الصفحة.',
    lmHeader: 'رأس الموقع', lmNav: 'التنقل', lmMain: 'المحتوى الرئيسي', lmFooter: 'تذييل الصفحة',
  },
  zh: {
    madeBy: '由 {name} 开发',
    langName: '中文（简体）', htmlLang: 'zh-Hans', dir: 'ltr',
    open: '打开无障碍菜单', title: '无障碍菜单', close: '关闭', language: '语言',
    focus: '突出显示焦点', outline: '页面结构', textSize: '文字大小', contrast: '高对比度',
    motion: '停止动画', links: '突出显示链接和字段', captions: '字幕', noMedia: '此页面没有视频',
    statement: '无障碍声明', reset: '全部重置', resetDone: '所有设置已重置',
    cookieSettings: 'Cookie 设置',
    on: '开', off: '关', shortcut: '快捷键',
    help: ["按 Alt+0 打开或关闭此菜单。", "在菜单中，按选项对应的键：1–7、0，或用 + 和 − 调整文字大小。", "在页面任意位置，按住 Shift 再按相同的键，例如 Shift+3 开启高对比度。在输入框中输入时不起作用。", "按 Esc 关闭菜单。"],
    textSmaller: "缩小文字", textLarger: "放大文字",
    shortcutsTitle: "键盘快捷键", disableShortcuts: "关闭键盘快捷键",
    srTip: '使用屏幕阅读器？请切换到焦点模式以使用数字键，或照常激活按钮。',
    moveHelp: '您可以将无障碍按钮拖动到屏幕上的任意位置，也可以聚焦该按钮后使用方向键移动。',
    hideButton: '隐藏无障碍按钮',
    buttonHidden: '无障碍按钮已隐藏。要打开菜单，请按 Alt+0，或使用页面底部的无障碍链接。',
    lmHeader: '网站页眉', lmNav: '导航', lmMain: '主要内容', lmFooter: '页脚',
  },
  fr: {
    madeBy: 'Conçu par {name}',
    langName: 'Français', htmlLang: 'fr', dir: 'ltr',
    open: 'Ouvrir le menu d’accessibilité', title: 'Menu d’accessibilité', close: 'Fermer', language: 'Langue',
    focus: 'Mettre en évidence le focus', outline: 'Plan de la page', textSize: 'Taille du texte', contrast: 'Contraste élevé',
    motion: 'Arrêter les animations', links: 'Mettre en évidence liens et champs', captions: 'Sous-titres', noMedia: 'Aucune vidéo sur cette page',
    statement: 'Déclaration d’accessibilité', reset: 'Tout réinitialiser', resetDone: 'Tous les réglages ont été réinitialisés',
    cookieSettings: 'Paramètres des cookies',
    on: 'Activé', off: 'Désactivé', shortcut: 'Raccourci',
    help: ["Alt+0 ouvre ou ferme ce menu.", "Dans le menu, appuyez sur la touche de l’option : 1 à 7, 0, ou + et − pour la taille du texte.", "N’importe où sur la page, maintenez Maj et appuyez sur la même touche, par exemple Maj+3 pour le contraste élevé. Cela ne fonctionne pas pendant la saisie dans un champ.", "Échap ferme le menu."],
    textSmaller: "Réduire le texte", textLarger: "Agrandir le texte",
    shortcutsTitle: "Raccourcis clavier", disableShortcuts: "Désactiver les raccourcis clavier",
    srTip: 'Vous utilisez un lecteur d’écran ? Passez en mode formulaire pour utiliser les touches numériques, ou activez les boutons comme d’habitude.',
    moveHelp: 'Vous pouvez faire glisser le bouton d’accessibilité n’importe où sur l’écran, ou le sélectionner et utiliser les touches fléchées.',
    hideButton: 'Masquer le bouton d’accessibilité',
    buttonHidden: 'Bouton d’accessibilité masqué. Pour ouvrir le menu, appuyez sur Alt+0 ou utilisez le lien d’accessibilité en bas de page.',
    lmHeader: 'En-tête du site', lmNav: 'Navigation', lmMain: 'Contenu principal', lmFooter: 'Pied de page',
  },
  de: {
    madeBy: 'Entwickelt von {name}',
    langName: 'Deutsch', htmlLang: 'de', dir: 'ltr',
    open: 'Menü für Barrierefreiheit öffnen', title: 'Menü für Barrierefreiheit', close: 'Schließen', language: 'Sprache',
    focus: 'Fokus hervorheben', outline: 'Seitenstruktur', textSize: 'Textgröße', contrast: 'Hoher Kontrast',
    motion: 'Animationen stoppen', links: 'Links und Felder hervorheben', captions: 'Untertitel', noMedia: 'Kein Video auf dieser Seite',
    statement: 'Erklärung zur Barrierefreiheit', reset: 'Alles zurücksetzen', resetDone: 'Alle Einstellungen wurden zurückgesetzt',
    cookieSettings: 'Cookie-Einstellungen',
    on: 'Ein', off: 'Aus', shortcut: 'Tastenkürzel',
    help: ["Alt+0 öffnet oder schließt dieses Menü.", "Drücken Sie im Menü die Taste der Option: 1–7, 0 oder + und − für die Textgröße.", "Überall auf der Seite: Halten Sie die Umschalttaste gedrückt und drücken Sie dieselbe Taste, z. B. Umschalt+3 für hohen Kontrast. Das funktioniert nicht, während Sie in ein Feld tippen.", "Esc schließt das Menü."],
    textSmaller: "Text verkleinern", textLarger: "Text vergrößern",
    shortcutsTitle: "Tastenkürzel", disableShortcuts: "Tastenkürzel ausschalten",
    srTip: 'Sie nutzen einen Screenreader? Wechseln Sie in den Fokusmodus, um die Zifferntasten zu verwenden, oder aktivieren Sie die Schaltflächen wie gewohnt.',
    moveHelp: 'Sie können die Schaltfläche für Barrierefreiheit an eine beliebige Stelle ziehen oder sie fokussieren und mit den Pfeiltasten verschieben.',
    hideButton: 'Schaltfläche für Barrierefreiheit ausblenden',
    buttonHidden: 'Schaltfläche ausgeblendet. Drücken Sie Alt+0 oder nutzen Sie den Link zur Barrierefreiheit in der Fußzeile, um das Menü zu öffnen.',
    lmHeader: 'Kopfbereich', lmNav: 'Navigation', lmMain: 'Hauptinhalt', lmFooter: 'Fußzeile',
  },
  he: {
    madeBy: 'פותח על ידי {name}',
    langName: 'עברית', htmlLang: 'he', dir: 'rtl',
    open: 'פתיחת תפריט נגישות', title: 'תפריט נגישות', close: 'סגירה', language: 'שפה',
    focus: 'הדגשת מיקוד', outline: 'מבנה העמוד', textSize: 'גודל טקסט', contrast: 'ניגודיות גבוהה',
    motion: 'עצירת אנימציות', links: 'הדגשת קישורים ושדות', captions: 'כתוביות', noMedia: 'אין וידאו בעמוד זה',
    statement: 'הצהרת נגישות', reset: 'איפוס הכול', resetDone: 'כל ההגדרות אופסו',
    cookieSettings: 'הגדרות עוגיות',
    on: 'פעיל', off: 'כבוי', shortcut: 'קיצור מקלדת',
    help: ["Alt+0 פותח וסוגר את התפריט.", "בתוך התפריט, לחצו על המקש של האפשרות: 1–7, 0, או + ו־− לגודל הטקסט.", "בכל מקום בעמוד, החזיקו Shift ולחצו על אותו מקש, למשל Shift+3 לניגודיות גבוהה. זה לא פועל בזמן הקלדה בשדה.", "Esc סוגר את התפריט."],
    textSmaller: "הקטנת טקסט", textLarger: "הגדלת טקסט",
    shortcutsTitle: "קיצורי מקלדת", disableShortcuts: "כיבוי קיצורי המקלדת",
    srTip: 'משתמשים בקורא מסך? עברו למצב מיקוד כדי להשתמש במקשי המספרים, או הפעילו את הכפתורים כרגיל.',
    moveHelp: 'ניתן לגרור את כפתור הנגישות לכל מקום במסך, או להעביר אליו את המיקוד ולהשתמש במקשי החצים.',
    hideButton: 'הסתרת כפתור הנגישות',
    buttonHidden: 'כפתור הנגישות הוסתר. כדי לפתוח את התפריט, לחצו Alt+0 או השתמשו בקישור הנגישות בתחתית העמוד.',
    lmHeader: 'כותרת האתר', lmNav: 'ניווט', lmMain: 'תוכן ראשי', lmFooter: 'כותרת תחתונה',
  },
  it: {
    madeBy: 'Realizzato da {name}',
    langName: 'Italiano', htmlLang: 'it', dir: 'ltr',
    open: 'Apri il menu di accessibilità', title: 'Menu di accessibilità', close: 'Chiudi', language: 'Lingua',
    focus: 'Evidenzia il focus', outline: 'Struttura della pagina', textSize: 'Dimensione del testo', contrast: 'Contrasto elevato',
    motion: 'Ferma le animazioni', links: 'Evidenzia link e campi', captions: 'Sottotitoli', noMedia: 'Nessun video in questa pagina',
    statement: 'Dichiarazione di accessibilità', reset: 'Ripristina tutto', resetDone: 'Tutte le impostazioni sono state ripristinate',
    cookieSettings: 'Impostazioni dei cookie',
    on: 'Attivo', off: 'Disattivo', shortcut: 'Scorciatoia',
    help: ["Alt+0 apre o chiude questo menu.", "Nel menu, premi il tasto dell’opzione: da 1 a 7, 0, oppure + e − per la dimensione del testo.", "In qualsiasi punto della pagina, tieni premuto Maiusc e premi lo stesso tasto, ad esempio Maiusc+3 per il contrasto elevato. Non funziona mentre scrivi in un campo.", "Esc chiude il menu."],
    textSmaller: "Riduci il testo", textLarger: "Ingrandisci il testo",
    shortcutsTitle: "Scorciatoie da tastiera", disableShortcuts: "Disattiva le scorciatoie da tastiera",
    srTip: 'Usi uno screen reader? Passa alla modalità focus per usare i tasti numerici, oppure attiva i pulsanti come di consueto.',
    moveHelp: 'Puoi trascinare il pulsante di accessibilità in qualsiasi punto dello schermo, oppure selezionarlo e usare i tasti freccia.',
    hideButton: 'Nascondi il pulsante di accessibilità',
    buttonHidden: 'Pulsante di accessibilità nascosto. Per aprire il menu, premi Alt+0 o usa il link di accessibilità in fondo alla pagina.',
    lmHeader: 'Intestazione del sito', lmNav: 'Navigazione', lmMain: 'Contenuto principale', lmFooter: 'Piè di pagina',
  },
  ru: {
    madeBy: 'Разработано {name}',
    langName: 'Русский', htmlLang: 'ru', dir: 'ltr',
    open: 'Открыть меню доступности', title: 'Меню доступности', close: 'Закрыть', language: 'Язык',
    focus: 'Выделение фокуса', outline: 'Структура страницы', textSize: 'Размер текста', contrast: 'Высокий контраст',
    motion: 'Остановить анимацию', links: 'Выделить ссылки и поля', captions: 'Субтитры', noMedia: 'На этой странице нет видео',
    statement: 'Заявление о доступности', reset: 'Сбросить всё', resetDone: 'Все настройки сброшены',
    cookieSettings: 'Настройки файлов cookie',
    on: 'Вкл.', off: 'Выкл.', shortcut: 'Клавиша',
    help: ["Alt+0 открывает и закрывает это меню.", "В меню нажмите клавишу нужного пункта: 1–7, 0 или + и − для размера текста.", "В любом месте страницы удерживайте Shift и нажмите ту же клавишу, например Shift+3 для высокого контраста. Во время ввода текста в поле это не работает.", "Esc закрывает меню."],
    textSmaller: "Уменьшить текст", textLarger: "Увеличить текст",
    shortcutsTitle: "Сочетания клавиш", disableShortcuts: "Отключить сочетания клавиш",
    srTip: 'Используете программу чтения с экрана? Включите режим фокуса, чтобы работали цифровые клавиши, или нажимайте кнопки как обычно.',
    moveHelp: 'Кнопку доступности можно перетащить в любое место экрана или выбрать её и перемещать клавишами со стрелками.',
    hideButton: 'Скрыть кнопку доступности',
    buttonHidden: 'Кнопка доступности скрыта. Чтобы открыть меню, нажмите Alt+0 или воспользуйтесь ссылкой о доступности внизу страницы.',
    lmHeader: 'Шапка сайта', lmNav: 'Навигация', lmMain: 'Основное содержание', lmFooter: 'Подвал сайта',
  },
  es: {
    madeBy: 'Desarrollado por {name}',
    langName: 'Español', htmlLang: 'es', dir: 'ltr',
    open: 'Abrir menú de accesibilidad', title: 'Menú de accesibilidad', close: 'Cerrar', language: 'Idioma',
    focus: 'Resaltar el foco', outline: 'Esquema de la página', textSize: 'Tamaño del texto', contrast: 'Alto contraste',
    motion: 'Detener animaciones', links: 'Resaltar enlaces y campos', captions: 'Subtítulos', noMedia: 'No hay vídeo en esta página',
    statement: 'Declaración de accesibilidad', reset: 'Restablecer todo', resetDone: 'Se restablecieron todos los ajustes',
    cookieSettings: 'Configuración de cookies',
    on: 'Activado', off: 'Desactivado', shortcut: 'Atajo',
    help: ["Alt+0 abre o cierra este menú.", "En el menú, pulse la tecla de la opción: 1–7, 0, o + y − para el tamaño del texto.", "En cualquier parte de la página, mantenga pulsada Mayús y pulse la misma tecla, por ejemplo Mayús+3 para alto contraste. No funciona mientras escribe en un campo.", "Esc cierra el menú."],
    textSmaller: "Reducir el texto", textLarger: "Ampliar el texto",
    shortcutsTitle: "Atajos de teclado", disableShortcuts: "Desactivar los atajos de teclado",
    srTip: '¿Usa un lector de pantalla? Cambie al modo de foco para usar las teclas numéricas o active los botones como de costumbre.',
    moveHelp: 'Puede arrastrar el botón de accesibilidad a cualquier lugar de la pantalla, o seleccionarlo y usar las teclas de flecha.',
    hideButton: 'Ocultar el botón de accesibilidad',
    buttonHidden: 'Botón de accesibilidad oculto. Para abrir el menú, pulse Alt+0 o use el enlace de accesibilidad al pie de la página.',
    lmHeader: 'Encabezado del sitio', lmNav: 'Navegación', lmMain: 'Contenido principal', lmFooter: 'Pie de página',
  },
  uk: {
    madeBy: 'Розроблено {name}',
    langName: 'Українська', htmlLang: 'uk', dir: 'ltr',
    open: 'Відкрити меню доступності', title: 'Меню доступності', close: 'Закрити', language: 'Мова',
    focus: 'Виділення фокусу', outline: 'Структура сторінки', textSize: 'Розмір тексту', contrast: 'Високий контраст',
    motion: 'Зупинити анімацію', links: 'Виділити посилання та поля', captions: 'Субтитри', noMedia: 'На цій сторінці немає відео',
    statement: 'Заява про доступність', reset: 'Скинути все', resetDone: 'Усі налаштування скинуто',
    cookieSettings: 'Налаштування файлів cookie',
    on: 'Увімк.', off: 'Вимк.', shortcut: 'Клавіша',
    help: ["Alt+0 відкриває та закриває це меню.", "У меню натисніть клавішу потрібного пункту: 1–7, 0 або + і − для розміру тексту.", "У будь-якому місці сторінки утримуйте Shift і натисніть ту саму клавішу, наприклад Shift+3 для високого контрасту. Під час введення тексту в поле це не працює.", "Esc закриває меню."],
    textSmaller: "Зменшити текст", textLarger: "Збільшити текст",
    shortcutsTitle: "Сполучення клавіш", disableShortcuts: "Вимкнути сполучення клавіш",
    srTip: 'Користуєтеся програмою зчитування з екрана? Увімкніть режим фокусу, щоб працювали цифрові клавіші, або натискайте кнопки як зазвичай.',
    moveHelp: 'Кнопку доступності можна перетягнути в будь-яке місце екрана або вибрати її та переміщувати клавішами зі стрілками.',
    hideButton: 'Приховати кнопку доступності',
    buttonHidden: 'Кнопку доступності приховано. Щоб відкрити меню, натисніть Alt+0 або скористайтеся посиланням про доступність унизу сторінки.',
    lmHeader: 'Шапка сайту', lmNav: 'Навігація', lmMain: 'Основний вміст', lmFooter: 'Підвал сайту',
  },
};

(() => {
  const start = () => {
/*! Meliora Accessibility — https://github.com/melioradev/meliora-accessibility
    Made by Meliora Novotech Ltd (https://melioranovotech.com). License: MIT with visible attribution. The
    "Made by Meliora Novotech Ltd" credit in the panel must stay. See LICENSE.

   Settings are applied before first paint by meliora-a11y-boot.js; this file builds the button and the panel.
   Optional configuration, set before this script loads:
     window.MelioraA11yConfig = {
       statementUrl: '/accessibility/'            // or {default: '/accessibility/', he: '/accessibility/he/'}
     };

   Keys:  inside the panel   1–7, 0, + and −      (no modifier)
          anywhere on page   Shift + the same key (ignored while typing in a field)
          anywhere on page   Alt+0 opens / closes the panel
   "Turn off keyboard shortcuts" disables the page-wide ones (WCAG 2.1.4). */
(() => {
  const I18N = window.MelioraA11yI18n;
  const S = window.MelioraA11yState;
  if (!I18N || !S) return;
  const {state, apply, KEY, SCALES} = S;
  const LANGS = I18N.order; // English first (the default), then A–Z by English name
  let lang = LANGS.includes(state.lang) ? state.lang : 'en';
  const t = key => (I18N[lang] && I18N[lang][key]) ?? I18N.en[key];
  const save = () => {
    const {openerDisabled, ...rest} = state; // drop the older setting name
    try { localStorage.setItem(KEY, JSON.stringify(rest)); } catch { /* settings last for this visit only */ }
  };
  const HIDDEN_KEY = 'meliora.a11y.hidden';
  const hasMedia = () => Boolean(document.querySelector('video, audio'));
  const CONFIG = window.MelioraA11yConfig || {};
  const REPO_URL = 'https://github.com/melioradev/meliora-accessibility';
  const SITE_URL = 'https://melioranovotech.com';
  // Accessibility statement link: a URL, or a URL per menu language with a `default`. None = no statement button.
  const statementHref = () => {
    const url = CONFIG.statementUrl;
    if (typeof url === 'string') return url;
    if (url && typeof url === 'object') return url[lang] || url.default || null;
    return null;
  };
  // Meliora Consent (melioradev/meliora-consent) on the same page: the menu also offers its cookie settings.
  const hasConsent = () => Boolean(window.MelioraConsent && typeof window.MelioraConsent.open === 'function');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const pct = () => `${Math.round(state.scale * 100)}%`;

  const svg = body => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  const ICONS = {
    person: svg('<circle cx="12" cy="4.5" r="2"/><path d="M4 8.5c2.6.8 5.3 1.2 8 1.2s5.4-.4 8-1.2M12 9.7V15m0 0-3.2 6M12 15l3.2 6"/>'),
    focus: svg('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="8" height="8" rx="1.5"/>'),
    outline: svg('<path d="M4 6h16M8 12h12M8 18h12"/>'),
    textSize: svg('<path d="M3 19 8.5 5 14 19M5 14h7M16 19l3-8 3 8M17 16.5h4"/>'),
    contrast: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>'),
    motion: svg('<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'),
    links: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    captions: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 10.5a2 2 0 1 0 0 3M16 10.5a2 2 0 1 0 0 3"/>'),
    statement: svg('<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>'),
    reset: svg('<path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.7M4 4v4.7h4.7"/>'),
    cookie: svg('<path d="M12 3a9 9 0 1 0 9 9 3.5 3.5 0 0 1-4-3.5A3.5 3.5 0 0 1 12 3Z"/><circle cx="8.5" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="15.5" r="1" fill="currentColor"/><circle cx="15.5" cy="14" r="1" fill="currentColor"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    chevron: svg('<path d="m6 9 6 6 6-6"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    plus: svg('<path d="M5 12h14M12 5v14"/>'),
  };
  // Numbered options. Text size uses + and − instead of a number.
  const TOGGLES = {1: 'focus', 3: 'contrast', 4: 'motion', 5: 'links', 6: 'captions'};
  const kbd = k => `<kbd class="a11y-kbd" aria-hidden="true">${k}</kbd>`;
  const keys = k => `${k} Shift+${k}`;

  /* ---------- floating button (movable, with a small × that hides it) ---------- */
  const fab = document.createElement('div');
  fab.className = 'a11y-fab';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'a11y-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'a11y-panel');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-keyshortcuts', 'Alt+0');
  const hideButton = document.createElement('button');
  hideButton.type = 'button';
  hideButton.className = 'a11y-hide';
  fab.append(trigger, hideButton);
  const skip = document.querySelector(CONFIG.insertAfter || '.skip, .skip-link, a[href="#main"], a[href="#content"]');
  if (skip) skip.after(fab); else document.body.prepend(fab);
  // Short visible confirmation for changes made with the panel closed; also a live region.
  const toast = document.createElement('p');
  toast.className = 'a11y-toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  try { fab.hidden = sessionStorage.getItem(HIDDEN_KEY) === '1'; } catch { /* ignore */ }

  /* ---------- panel ---------- */
  const dialog = document.createElement('dialog');
  dialog.id = 'a11y-panel';
  dialog.className = 'a11y-panel';
  dialog.setAttribute('aria-labelledby', 'a11y-title');
  const content = document.createElement('div');
  const live = document.createElement('p');
  live.className = 'a11y-sr';
  live.setAttribute('aria-live', 'polite');
  dialog.append(content, live);
  document.body.append(dialog);

  let outlineOpen = false;
  let helpOpen = false;
  let opener = null;

  function toggleRow(n) {
    const key = TOGGLES[n];
    const noMedia = key === 'captions' && !hasMedia();
    const stateAttr = noMedia ? 'aria-disabled="true"' : `aria-pressed="${state[key] ? 'true' : 'false'}"`;
    const end = noMedia ? `<span class="a11y-note">${esc(t('noMedia'))}</span>` : '<span class="a11y-switch" aria-hidden="true"></span>';
    return `<li><button type="button" class="a11y-row a11y-nav" data-n="${n}" ${stateAttr} aria-keyshortcuts="${keys(n)}">
      ${ICONS[key]}<span class="a11y-label">${esc(t(key))}</span>${end}${kbd(n)}</button></li>`;
  }

  function render() {
    const def = I18N[lang] || I18N.en;
    dialog.lang = def.htmlLang;
    dialog.dir = def.dir;
    fab.lang = def.htmlLang;
    toast.lang = def.htmlLang;
    toast.dir = def.dir;
    trigger.innerHTML = `${ICONS.person}<span class="a11y-sr">${esc(t('open'))}</span>`;
    trigger.title = `${t('open')} (Alt+0). ${t('moveHelp')}`;
    hideButton.innerHTML = `${ICONS.close}<span class="a11y-sr">${esc(t('hideButton'))}</span>`;
    hideButton.title = t('hideButton');
    document.querySelectorAll('[data-a11y-open]').forEach(b => { b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-controls', 'a11y-panel'); });
    const atMin = state.scale <= SCALES[0], atMax = state.scale >= SCALES[SCALES.length - 1];
    content.innerHTML = `
      <div class="a11y-head">
        <h2 id="a11y-title" tabindex="-1">${esc(t('title'))}</h2>
        <button type="button" class="a11y-close" data-close aria-label="${esc(t('close'))}" title="${esc(t('close'))}">${ICONS.close}</button>
      </div>
      <div class="a11y-lang">
        <label for="a11y-lang">${esc(t('language'))}</label>
        <select id="a11y-lang">${LANGS.map(code => `<option value="${code}" lang="${I18N[code].htmlLang}"${code === lang ? ' selected' : ''}>${esc(I18N[code].langName)}</option>`).join('')}</select>
      </div>
      <ul class="a11y-list">
        ${toggleRow(1)}
        <li><button type="button" class="a11y-row a11y-nav" data-n="2" aria-expanded="${outlineOpen}" aria-controls="a11y-outline" aria-keyshortcuts="${keys(2)}">
          ${ICONS.outline}<span class="a11y-label">${esc(t('outline'))}</span><span class="a11y-chevron">${ICONS.chevron}</span>${kbd(2)}</button>
          <ul id="a11y-outline" class="a11y-outline"${outlineOpen ? '' : ' hidden'}></ul></li>
        <li class="a11y-size">
          ${ICONS.textSize}<span class="a11y-label" id="a11y-size-label">${esc(t('textSize'))}</span>
          <span class="a11y-stepper" role="group" aria-labelledby="a11y-size-label">
            <button type="button" class="a11y-nav" data-size="-1" aria-label="${esc(t('textSmaller'))}" title="${esc(t('textSmaller'))} (−)" aria-keyshortcuts="- Shift+-"${atMin ? ' aria-disabled="true"' : ''}>${ICONS.minus}</button>
            <span class="a11y-size-value">${pct()}</span>
            <button type="button" class="a11y-nav" data-size="1" aria-label="${esc(t('textLarger'))}" title="${esc(t('textLarger'))} (+)" aria-keyshortcuts="+ Shift++"${atMax ? ' aria-disabled="true"' : ''}>${ICONS.plus}</button>
          </span>
        </li>
        ${toggleRow(3)}${toggleRow(4)}${toggleRow(5)}${toggleRow(6)}
      </ul>
      <div class="a11y-actions${statementHref() ? '' : ' a11y-actions-single'}">
        ${statementHref() ? `<a class="a11y-action a11y-nav" data-n="7" aria-keyshortcuts="${keys(7)}" href="${esc(statementHref())}">${ICONS.statement}<span>${esc(t('statement'))}</span>${kbd(7)}</a>` : ''}
        <button type="button" class="a11y-action a11y-nav" data-n="0" aria-keyshortcuts="${keys(0)}">${ICONS.reset}<span>${esc(t('reset'))}</span>${kbd(0)}</button>
        ${hasConsent() ? `<button type="button" class="a11y-action a11y-nav a11y-action-wide" data-cookies aria-haspopup="dialog">${ICONS.cookie}<span>${esc(t('cookieSettings'))}</span></button>` : ''}
      </div>
      <details class="a11y-help"${helpOpen ? ' open' : ''}>
        <summary>${esc(t('shortcutsTitle'))}</summary>
        <ul>${t('help').map(line => `<li>${esc(line)}</li>`).join('')}<li>${esc(t('srTip'))}</li><li>${esc(t('moveHelp'))}</li></ul>
        <label class="a11y-check"><input type="checkbox" id="a11y-shortcuts-off"${state.shortcutsOff ? ' checked' : ''}> ${esc(t('disableShortcuts'))}</label>
      </details>
      <p class="a11y-credit">${esc(t('madeBy')).replace('{name}', `<a href="${REPO_URL}" rel="noopener">Meliora Novotech Ltd</a>`)} · <a href="${SITE_URL}" rel="noopener">melioranovotech.com</a></p>`;
    if (outlineOpen) fillOutline();
  }

  /* ---------- page outline ---------- */
  const outlineTargets = new Map();
  function fillOutline() {
    const list = content.querySelector('#a11y-outline');
    if (!list) return;
    outlineTargets.clear();
    const entries = [];
    const landmark = (selector, key) => { const el = document.querySelector(selector); if (el) entries.push({el, text: t(key), level: 0}); };
    landmark('header, [role="banner"]', 'lmHeader');
    landmark('nav, [role="navigation"]', 'lmNav');
    landmark('main, [role="main"]', 'lmMain');
    const main = document.querySelector('main');
    if (main) main.querySelectorAll('h1, h2, h3').forEach(h => {
      if (h.closest('dialog') || !h.getClientRects().length) return;
      entries.push({el: h, text: h.innerText.replace(/\s+/g, ' ').trim(), level: Number(h.tagName[1])});
    });
    landmark('footer, [role="contentinfo"]', 'lmFooter');
    list.innerHTML = entries.map((entry, i) => `<li class="lvl-${entry.level}"><a href="#" data-outline="${i}">${esc(entry.text)}</a></li>`).join('');
    entries.forEach((entry, i) => outlineTargets.set(String(i), entry.el));
  }

  function goTo(el) {
    dialog.close();
    if (!el.matches('a[href], button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
    el.scrollIntoView({block: 'start', behavior: state.motion ? 'auto' : 'smooth'});
    el.focus({preventScroll: true});
    opener = null; // focus stays on the chosen destination
  }

  /* ---------- actions ---------- */
  let toastTimer;
  function announce(message) {
    if (dialog.open) {
      live.textContent = '';
      setTimeout(() => { live.textContent = message; }, 60);
      return;
    }
    // Panel closed: show a short confirmation near the button (also read by screen readers).
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function refresh(focusSelector) {
    if (!dialog.open) return;
    render();
    if (focusSelector) content.querySelector(focusSelector)?.focus();
  }

  function applyMedia() {
    document.querySelectorAll('video').forEach(video => {
      for (const track of video.textTracks) if (track.kind === 'captions' || track.kind === 'subtitles') track.mode = state.captions ? 'showing' : 'hidden';
      if (state.motion && video.autoplay) video.pause();
    });
  }

  /* ---------- word highlight (part of "Highlight focus") ----------
     Marks the word under the mouse with the CSS Custom Highlight API, so the page's HTML is never changed.
     Word boundaries come from Intl.Segmenter, which handles Chinese, Hebrew and Arabic properly. */
  const canHighlight = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';
  const segmenters = new Map();
  function segmenterFor(node) {
    const code = node.parentElement?.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || 'en';
    if (!segmenters.has(code)) { try { segmenters.set(code, new Intl.Segmenter(code, {granularity: 'word'})); } catch { segmenters.set(code, null); } }
    return segmenters.get(code);
  }
  function caretAt(x, y) {
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p && {node: p.offsetNode, offset: p.offset}; }
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r && {node: r.startContainer, offset: r.startOffset}; }
    return null;
  }
  function wordRangeAt(x, y) {
    const caret = caretAt(x, y);
    if (!caret || !caret.node || caret.node.nodeType !== Node.TEXT_NODE) return null;
    const {node} = caret, text = node.data;
    let start = -1, end = -1;
    const seg = segmenterFor(node);
    if (seg) {
      for (const part of seg.segment(text)) {
        if (caret.offset >= part.index && caret.offset <= part.index + part.segment.length && part.isWordLike) { start = part.index; end = part.index + part.segment.length; break; }
      }
    } else {
      const isWord = c => /[\p{L}\p{N}'’-]/u.test(c);
      start = end = caret.offset;
      while (start > 0 && isWord(text[start - 1])) start--;
      while (end < text.length && isWord(text[end])) end++;
    }
    if (start < 0 || end <= start) return null;
    const range = document.createRange();
    range.setStart(node, start); range.setEnd(node, end);
    // Only when the pointer is really over the word, not in the empty space next to a line.
    const hit = [...range.getClientRects()].some(r => x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2);
    return hit ? range : null;
  }
  let wordFrame = 0;
  function clearWord() { if (canHighlight) CSS.highlights.delete('a11y-word'); }
  if (canHighlight) {
    document.addEventListener('pointermove', event => {
      if (!state.focus || event.pointerType === 'touch') return;
      cancelAnimationFrame(wordFrame);
      wordFrame = requestAnimationFrame(() => {
        const range = wordRangeAt(event.clientX, event.clientY);
        if (range) CSS.highlights.set('a11y-word', new Highlight(range)); else clearWord();
      });
    }, {passive: true});
    document.addEventListener('pointerleave', clearWord);
    window.addEventListener('scroll', clearWord, {passive: true});
  }

  function commit() { apply(state); applyMedia(); save(); if (!state.focus) clearWord(); }

  function resize(delta) {
    const i = SCALES.indexOf(state.scale);
    const next = SCALES[Math.min(SCALES.length - 1, Math.max(0, i + delta))];
    if (next !== state.scale) { state.scale = next; commit(); }
    refresh(`[data-size="${delta}"]`);
    announce(`${t('textSize')}: ${pct()}`);
  }

  function activate(n) {
    if (n === 7) { if (statementHref()) window.location.href = statementHref(); return; }
    if (n === 0) {
      Object.assign(state, {focus: false, contrast: false, motion: false, links: false, captions: false, scale: 1, shortcutsOff: false, pos: null});
      commit(); place(); refresh('[data-n="0"]'); announce(t('resetDone'));
      return;
    }
    if (n === 2) {
      if (!dialog.open) { outlineOpen = true; open(); content.querySelector('[data-n="2"]')?.focus(); return; }
      outlineOpen = !outlineOpen; refresh('[data-n="2"]');
      return;
    }
    const key = TOGGLES[n];
    if (!key) return;
    if (key === 'captions' && !hasMedia()) { refresh('[data-n="6"]'); announce(t('noMedia')); return; }
    state[key] = !state[key];
    commit(); refresh(`[data-n="${n}"]`);
    announce(`${t(key)}: ${state[key] ? t('on') : t('off')}`);
  }

  /* ---------- open / close ---------- */
  function open() {
    if (dialog.open) return;
    opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : trigger;
    if (fab.hidden) { fab.hidden = false; try { sessionStorage.removeItem(HIDDEN_KEY); } catch { /* ignore */ } }
    toast.classList.remove('show');
    render();
    // Open the panel on the same side of the screen as the button.
    const r = trigger.getBoundingClientRect();
    dialog.classList.toggle('a11y-left', r.left + r.width / 2 < window.innerWidth / 2);
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('dialog-open');
    content.querySelector('#a11y-title').focus();
  }
  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.toggle('dialog-open', Boolean(document.querySelector('dialog[open]')));
    if (opener && opener.isConnected) opener.focus({preventScroll: true});
    opener = null;
  });

  /* ---------- moving the button ---------- */
  const MARGIN = 8;
  function place() {
    if (!state.pos) { fab.style.left = fab.style.top = ''; fab.classList.remove('a11y-moved'); return; }
    const maxX = Math.max(MARGIN, window.innerWidth - fab.offsetWidth - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - fab.offsetHeight - MARGIN);
    fab.classList.add('a11y-moved');
    fab.style.left = `${MARGIN + state.pos.x * (maxX - MARGIN)}px`;
    fab.style.top = `${MARGIN + state.pos.y * (maxY - MARGIN)}px`;
  }
  function moveTo(left, top) {
    const maxX = Math.max(MARGIN, window.innerWidth - fab.offsetWidth - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - fab.offsetHeight - MARGIN);
    const clamp = (v, max) => Math.min(max, Math.max(MARGIN, v));
    state.pos = {
      x: maxX > MARGIN ? (clamp(left, maxX) - MARGIN) / (maxX - MARGIN) : 0,
      y: maxY > MARGIN ? (clamp(top, maxY) - MARGIN) / (maxY - MARGIN) : 0,
    };
    place();
  }
  let drag = null, justDragged = false;
  trigger.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const r = fab.getBoundingClientRect();
    drag = {id: event.pointerId, startX: event.clientX, startY: event.clientY, dx: event.clientX - r.left, dy: event.clientY - r.top, moving: false};
  });
  // Track the pointer on the window so a fast drag that leaves the button still moves it.
  window.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.moving && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    if (!drag.moving) { drag.moving = true; fab.classList.add('a11y-dragging'); }
    event.preventDefault();
    moveTo(event.clientX - drag.dx, event.clientY - drag.dy);
  });
  const endDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moving) {
      fab.classList.remove('a11y-dragging'); save();
      // Swallow the click that follows a drag, if the pointer was released over the button.
      justDragged = true; setTimeout(() => { justDragged = false; }, 0);
    }
    drag = null;
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  // Keyboard alternative to dragging: arrow keys move the focused button (Shift = bigger steps).
  trigger.addEventListener('keydown', event => {
    const step = event.shiftKey ? 64 : 16;
    const d = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]}[event.key];
    if (!d || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    event.stopPropagation();
    const r = fab.getBoundingClientRect();
    moveTo(r.left + d[0], r.top + d[1]);
    save();
  });
  window.addEventListener('resize', place);

  hideButton.addEventListener('click', () => {
    fab.hidden = true;
    try { sessionStorage.setItem(HIDDEN_KEY, '1'); } catch { /* ignore */ }
    const main = document.querySelector('main');
    if (main) main.focus({preventScroll: true});
    announce(t('buttonHidden'));
  });

  trigger.addEventListener('click', () => {
    if (justDragged) { justDragged = false; return; }
    if (dialog.open) close(); else open();
  });
  document.addEventListener('click', event => {
    const btn = event.target.closest('[data-a11y-open]');
    if (btn) { event.preventDefault(); open(); }
  });

  content.addEventListener('click', event => {
    const target = event.target;
    if (target.closest('[data-close]')) { close(); return; }
    // Close the menu first, so the cookie dialog returns focus to where the menu was opened from.
    if (target.closest('[data-cookies]') && hasConsent()) { close(); window.MelioraConsent.open(); return; }
    const outlineLink = target.closest('[data-outline]');
    if (outlineLink) { event.preventDefault(); const el = outlineTargets.get(outlineLink.dataset.outline); if (el) goTo(el); return; }
    const sizeButton = target.closest('[data-size]');
    if (sizeButton) { resize(Number(sizeButton.dataset.size)); return; }
    const row = target.closest('button[data-n]');
    if (row) activate(Number(row.dataset.n));
  });
  content.addEventListener('toggle', event => { if (event.target.matches('.a11y-help')) helpOpen = event.target.open; }, true);
  content.addEventListener('change', event => {
    if (event.target.id === 'a11y-lang') {
      lang = event.target.value; state.lang = lang; save();
      render();
      content.querySelector('#a11y-lang').focus();
    } else if (event.target.id === 'a11y-shortcuts-off') {
      state.shortcutsOff = event.target.checked; save();
    }
  });
  // Clicking the backdrop closes the panel.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  });

  /* ---------- keyboard ---------- */
  const digit = code => { const m = /^(?:Digit|Numpad)([0-9])$/.exec(code); return m ? Number(m[1]) : null; };
  // Matches the physical key (event.code) so it works on every keyboard layout; '+'/'−' also by character.
  const sizeKey = event => {
    if (event.code === 'NumpadAdd' || event.code === 'Equal' || event.key === '+') return 1;
    if (event.code === 'NumpadSubtract' || event.code === 'Minus' || event.key === '-') return -1;
    return 0;
  };
  const typing = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) && !(el.tagName === 'INPUT' && el.type === 'checkbox');

  // Inside the panel: plain number, + and − keys, and Up/Down arrows.
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.tagName === 'SELECT') return;
    const n = digit(event.code);
    if (n !== null && n <= 7) { event.preventDefault(); activate(n); return; }
    const delta = sizeKey(event);
    if (delta) { event.preventDefault(); resize(delta); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const nav = [...content.querySelectorAll('.a11y-nav')];
      const index = nav.indexOf(document.activeElement);
      if (index === -1) return;
      event.preventDefault();
      nav[(index + (event.key === 'ArrowDown' ? 1 : -1) + nav.length) % nav.length].focus();
    }
  });

  // Anywhere on the page: Alt+0 opens/closes the panel; Shift + an option's key uses it directly.
  document.addEventListener('keydown', event => {
    if (state.shortcutsOff || event.ctrlKey || event.metaKey) return;
    if (event.altKey && !event.shiftKey && digit(event.code) === 0) {
      event.preventDefault();
      if (dialog.open) close(); else open();
      return;
    }
    if (!event.shiftKey || event.altKey || typing(event.target)) return;
    const m = /^Digit([0-7])$/.exec(event.code);
    if (m) { event.preventDefault(); activate(Number(m[1])); return; }
    const delta = sizeKey(event);
    if (delta) { event.preventDefault(); resize(delta); }
  });

  render();
  place();
  applyMedia();
  window.MelioraA11y = {open, close};
})();

  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})();
