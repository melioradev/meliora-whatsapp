// Tests only: ?lang=he sets the page language, ?config=<JSON> is the whole MelioraWhatsAppConfig.
(() => {
  const params = new URLSearchParams(location.search);
  const lang = params.get('lang');
  if (lang && /^[a-z]{2}$/.test(lang)) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
  }
  window.MelioraWhatsAppConfig = JSON.parse(params.get('config') || '{"phone": "972500000000"}');


})();
