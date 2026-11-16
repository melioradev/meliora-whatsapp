// Demo only: shows whether the business is open now and the link the button uses.
(() => {
  const out = document.getElementById('demo-state');
  const show = () => {
    const api = window.MelioraWhatsApp;
    if (!api) { out.textContent = 'The button did not start: check the console.'; return; }
    out.textContent = `Open now: ${api.isOpen() ? 'yes' : 'no'}\nLink: ${api.url()}`;
  };
  if (document.readyState === 'complete') show(); else addEventListener('load', show);
})();
