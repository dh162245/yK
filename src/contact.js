/* ======= CONFIG: replace these with your EmailJS values =======
   Example:
     const EMAILJS_SERVICE_ID = 'service_xxx';
     const EMAILJS_TEMPLATE_ID = 'template_yyy';
     const EMAILJS_PUBLIC_KEY = 'user_zzzz';
   ============================================================= */
const EMAILJS_SERVICE_ID = 'service_jkesakl';
const EMAILJS_TEMPLATE_ID = 'template_oxqka0i';
const EMAILJS_PUBLIC_KEY = 'M34wBecvV39femol6';
/* ============================================================= */

(function () {
  // make sure EmailJS v4 CDN is loaded
  if (!window.emailjs) {
    console.error('EmailJS library not found. Make sure you included the v4 script: https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
    return;
  }

  // init v4 style (object form)
  if (!EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS public key not set. Edit contact.js and add your key.');
  }
  try {
    // v4 recommended init
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  } catch (err) {
    // fallback older init if needed
    try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) { /* ignore */ }
  }

  const form = document.getElementById('contactForm');
  if (!form) { console.error('contactForm not found in DOM'); return; }
  const ts = document.getElementById('ts');
  const hpField = form.querySelector('[name=hp_field]');
  const status = document.getElementById('cfStatus');
  const submitBtn = document.getElementById('contactSubmit');

  // set timestamp to detect ultra-fast bot submits
  ts.value = String(Date.now());

  function show(msg, ok = true) {
    status.textContent = msg;
    status.style.color = ok ? '#0a0' : '#c33';
  }

  function simpleEmailIsValid(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    submitBtn.disabled = true;
    show('Отправляем…', true);

    const name = (form.name.value || '').trim();
    const email = (form.email.value || '').trim();
    const message = (form.message.value || '').trim();
    const honeypot = (hpField && hpField.value) ? hpField.value.trim() : '';

    // validation
    if (!name || name.length < 2) { show('Введите корректное имя', false); submitBtn.disabled = false; return; }
    if (!simpleEmailIsValid(email)) { show('Введите корректный email', false); submitBtn.disabled = false; return; }
    if (!message || message.length < 6) { show('Опишите коротко ваш запрос (мин. 6 символов)', false); submitBtn.disabled = false; return; }

    // invisible honeypot
    if (honeypot) { show('Spam detected', false); submitBtn.disabled = false; return; }

    // timing check (very short / suspicious submissions)
    const sentAt = Number(ts.value) || Date.now();
    const seconds = (Date.now() - sentAt) / 1000;
    if (seconds < 1.5) { show('Пожалуйста, подождите пару секунд и попробуйте снова.', false); submitBtn.disabled = false; return; }

    // prepare template params (must match your EmailJS template variables)
    const templateParams = {
      from_name: name,
      from_email: email,
      message: message,
      submitted_at: new Date().toISOString()
    };

    try {
      // send via v4 API
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      show('Спасибо! Заявка отправлена — я свяжусь с вами.', true);
      // optional: visual success class for 1.6s
form.classList.add('sent');
setTimeout(()=> form.classList.remove('sent'), 1600);

      form.reset();
      ts.value = String(Date.now());
    } catch (err) {
      console.error('EmailJS error', err);
      show('Ошибка отправки. Попробуйте позже.', false);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // set year in footer if element present
  const y = new Date().getFullYear();
  document.getElementById('year')?.appendChild(document.createTextNode(String(y)));
})();
