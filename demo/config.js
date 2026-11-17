// The demo's settings. ?lang=he shows the Hebrew button; ?demo=away pretends today is a day off, ?demo=email also
// offers email instead of WhatsApp, and ?demo=open keeps it open around the clock.
(() => {
  const params = new URLSearchParams(location.search);
  const lang = params.get('lang');
  if (lang === 'he' || lang === 'en') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }
  const demo = params.get('demo');
  // Today's date in Israel, for the "day off" demo.
  const today = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Jerusalem'}).format(new Date());

  window.MelioraWhatsAppConfig = {
    phone: '972500000000', // an example number: put yours here, international format, digits only
    telegram: '+972500000000', // the same example number; on your site, your Telegram username is more reliable
    name: 'Meliora Novotech',
    message: {
      en: 'Hello, I have a question about {title}',
      he: 'שלום, יש לי שאלה לגבי {title}',
    },
    timeZone: 'Asia/Jerusalem',
    hours: demo === 'open'
      ? {sun: '00:00-24:00', mon: '00:00-24:00', tue: '00:00-24:00', wed: '00:00-24:00', thu: '00:00-24:00', fri: '00:00-24:00', sat: '00:00-24:00'}
      : {sun: '09:00-17:00', mon: '09:00-17:00', tue: '09:00-17:00', wed: '09:00-17:00', thu: '09:00-17:00', fri: '09:00-13:00'},
    closedDates: demo === 'away' || demo === 'email' ? [today] : [],
    afterHours: demo === 'email' ? 'email' : 'notice',
    email: 'hello@example.com',
    emailSubject: {en: 'A question from the website', he: 'שאלה מהאתר'},
  };
})();
