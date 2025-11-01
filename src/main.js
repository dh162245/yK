
  (function () {
    const btn = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobile-menu');
    const nav = document.querySelector('.navbar');

    function openMenu() {
      menu.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    function toggleMenu() {
      if (menu.classList.contains('open')) closeMenu();
      else openMenu();
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // close on link click (useful for single-page nav)
    document.querySelectorAll('.nav-links a').forEach((link) =>
      link.addEventListener('click', () => closeMenu())
    );

    // close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // close when clicking outside the navbar
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && menu.classList.contains('open')) {
        closeMenu();
      }
    });
  })();


(function () {
  // find all images inside the container
  const imgs = document.querySelectorAll('.modal-container img');

  // create modal markup once and append to body
  const overlay = document.createElement('div');
  overlay.className = 'img-modal-overlay';
  overlay.innerHTML = `
    <div class="img-modal" role="dialog" aria-modal="true" aria-label="Image preview">
      <button class="close-btn" aria-label="Close preview">&times;</button>
      <div class="img-wrap">
        <img src="" alt="">
        <div class="img-caption" aria-hidden="true"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const modal = overlay.querySelector('.img-modal');
  const modalImg = modal.querySelector('img');
  const caption = modal.querySelector('.img-caption');
  const closeBtn = modal.querySelector('.close-btn');

  let lastFocused = null;

  // helper to open modal
  function openModal(src, alt, triggerEl) {
    lastFocused = triggerEl || document.activeElement;
    modalImg.src = src;
    modalImg.alt = alt || '';
    caption.textContent = alt || '';
    caption.style.display = alt ? 'block' : 'none';
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
    closeBtn.focus();
    // small focus trap: if tabbing inside modal, keep focus on close button only
    document.addEventListener('keydown', trapTab);
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
    modalImg.src = '';
    document.removeEventListener('keydown', trapTab);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  // close handlers
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(); // click outside modal
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // small focus trap: if tab is pressed while modal open, keep focus within closeBtn
  function trapTab(e) {
    if (e.key !== 'Tab') return;
    // only focusable element is closeBtn and maybe modalImg (but images not focusable),
    // so keep focus on close button
    e.preventDefault();
    closeBtn.focus();
  }

  // attach click to images (delegation could be used but simple loop works)
  imgs.forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openModal(img.src, img.alt, img));
    // optional: support keyboard activation if image is focusable (make it accessible)
    img.setAttribute('tabindex', '0');
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(img.src, img.alt, img);
      }
    });
  });
})();



(function () {
  const carousels = document.querySelectorAll('.carousel');

  carousels.forEach(initCarousel);

  function initCarousel(carousel) {
    // gather initial slides
    const slides = Array.from(carousel.querySelectorAll('.carousel-item'));
    if (slides.length === 0) return;

    // build track and move slides into it
    const track = document.createElement('div');
    track.className = 'carousel-track';
    slides.forEach(s => track.appendChild(s));
    // clear container and append track
    carousel.innerHTML = '';
    carousel.appendChild(track);

    const slideCount = slides.length;

    // clone last and first for seamless looping
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.firstChild);

    // updated items collection (with clones)
    const items = Array.from(track.children);
    let index = 1; // start on real first slide (after prepended clone)
    let isTransitioning = false;
    const transitionTime = 450; // ms (matches CSS .45s)

    // set widths (each item == 100% of carousel)
    function setSizes() {
      const width = carousel.clientWidth;
      items.forEach(item => item.style.width = width + 'px');
      // jump to current index (no transition) after resizing
      track.style.transition = 'none';
      track.style.transform = `translateX(${-index * width}px)`;
      // force reflow then restore transition
      void track.offsetWidth;
      track.style.transition = '';
    }
    setSizes();
    window.addEventListener('resize', setSizes);

    // create dots
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'carousel-dots';
    const dots = [];
    for (let i = 0; i < slideCount; i++) {
      const btn = document.createElement('button');
      btn.className = 'carousel-dot';
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => goTo(i + 1)); // +1 because of clone
      dotsWrap.appendChild(btn);
      dots.push(btn);
    }
    carousel.appendChild(dotsWrap);

    // autoplay settings
    let autoplay = true;
    const autoplayDelay = 4500;
    let autoplayId = null;

    function startAutoplay() {
      if (!autoplay) return;
      stopAutoplay();
      autoplayId = setInterval(() => next(), autoplayDelay);
    }
    function stopAutoplay() {
      if (autoplayId) { clearInterval(autoplayId); autoplayId = null; }
    }

    // move helpers
    function updateDots() {
      // map real slides 1...slideCount to dots 0...slideCount-1
      let active = (index - 1) % slideCount;
      if (active < 0) active += slideCount;
      dots.forEach((d, i) => d.setAttribute('aria-current', i === active ? 'true' : 'false'));
    }

    function goTo(targetIndex) {
      if (isTransitioning) return;
      isTransitioning = true;
      const width = carousel.clientWidth;
      index = targetIndex;
      track.style.transition = `transform ${transitionTime}ms cubic-bezier(.22,.9,.32,1)`;
      track.style.transform = `translateX(${-index * width}px)`;
      // wait for transition end to handle clones
      setTimeout(() => {
        handleLoop();
        isTransitioning = false;
      }, transitionTime + 20);
      updateDots();
    }

    function next() {
      if (isTransitioning) return;
      isTransitioning = true;
      const width = carousel.clientWidth;
      index++;
      track.style.transition = `transform ${transitionTime}ms cubic-bezier(.22,.9,.32,1)`;
      track.style.transform = `translateX(${-index * width}px)`;
      setTimeout(() => {
        handleLoop();
        isTransitioning = false;
      }, transitionTime + 20);
      updateDots();
    }

    function prev() {
      if (isTransitioning) return;
      isTransitioning = true;
      const width = carousel.clientWidth;
      index--;
      track.style.transition = `transform ${transitionTime}ms cubic-bezier(.22,.9,.32,1)`;
      track.style.transform = `translateX(${-index * width}px)`;
      setTimeout(() => {
        handleLoop();
        isTransitioning = false;
      }, transitionTime + 20);
      updateDots();
    }

    // if we moved onto a clone, jump to the real slide without animation
    function handleLoop() {
      const width = carousel.clientWidth;
      if (index <= 0) {
        // moved to clone of last => jump to last real
        index = slideCount;
        track.style.transition = 'none';
        track.style.transform = `translateX(${-index * width}px)`;
        void track.offsetWidth;
        track.style.transition = '';
      } else if (index >= items.length - 1) {
        // moved to clone of first => jump to first real
        index = 1;
        track.style.transition = 'none';
        track.style.transform = `translateX(${-index * width}px)`;
        void track.offsetWidth;
        track.style.transition = '';
      }
    }

    // init position
    const initWidth = carousel.clientWidth;
    track.style.transform = `translateX(${-index * initWidth}px)`;

    // autoplay start
    startAutoplay();

    // pause on hover / focus
    carousel.addEventListener('mouseenter', () => stopAutoplay());
    carousel.addEventListener('mouseleave', () => startAutoplay());
    carousel.addEventListener('focusin', () => stopAutoplay());
    carousel.addEventListener('focusout', () => startAutoplay());

    // keyboard navigation
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
    });

    // expose next/prev via swipe (simple touch support)
    let startX = 0, deltaX = 0;
    carousel.addEventListener('touchstart', (e) => {
      stopAutoplay();
      startX = e.touches[0].clientX;
      deltaX = 0;
    }, {passive:true});
    carousel.addEventListener('touchmove', (e) => {
      deltaX = e.touches[0].clientX - startX;
    }, {passive:true});
    carousel.addEventListener('touchend', () => {
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) prev(); else next();
      }
      startAutoplay();
      startX = 0; deltaX = 0;
    });

    // cleanup on remove (optional)
    carousel._destroyCarousel = () => {
      stopAutoplay();
      window.removeEventListener('resize', setSizes);
    };
  }
})();
// GSAP reveals (page load + scroll)
// Put this after GSAP scripts and run once DOM is ready
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not found');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // --------- page load / intro animations ----------
  const introTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // nav slide/fade
  introTL.from('.navbar', { y: -18, opacity: 0, duration: 0.55 });

  // headline and paragraph reveal (staggered)
  introTL.from('.header-content h1', { y: 30, opacity: 0, duration: 0.7 }, '-=0.3');
  introTL.from('.header-content p', { y: 18, opacity: 0, duration: 0.6 }, '-=0.45');

  // hero image subtle scale/opacity
  introTL.from('.header-image img', { scale: 1.06, opacity: 0, duration: 0.9 }, '-=0.5');

  // CTA pop (if present)
  introTL.from('.cta-btn button', { scale: 0.94, opacity: 0, duration: 0.45 }, '-=0.5');

  // --------- small utility reveal function ----------
  // usage: reveal(selector, options)
  function reveal(sel, opts = {}) {
    const defaults = {
      trigger: sel,
      start: 'top 82%',
      duration: 0.7,
      y: 28,
      opacity: 0,
      stagger: 0.12,
      ease: 'power3.out',
      scrub: false,
      once: true, // do once by default
    };
    const config = Object.assign({}, defaults, opts);

    if (config.stagger && config.targets) {
      // if user passed targets array (rare) - not needed here
    }

    // create animation
    gsap.from(sel, {
      y: config.y,
      opacity: config.opacity,
      duration: config.duration,
      stagger: config.stagger,
      ease: config.ease,
      scrollTrigger: {
        trigger: config.trigger,
        start: config.start,
        toggleActions: config.once ? 'play none none none' : 'play pause resume reverse',
        // markers: true, // enable for debugging
      }
    });
  }

  // --------- scroll reveals for sections ----------
  // services cards: staggered cards reveal
  reveal('.service-card', { trigger: '.services', start: 'top 80%', stagger: 0.12, y: 22, duration: 0.7 });

  // about images (bg and portrait)
  reveal('.bg-img', { trigger: '.about', start: 'top 85%', y: 20, duration: 0.9 });
  reveal('.portrait', { trigger: '.about', start: 'top 85%', y: 8, duration: 0.9, stagger: 0.06 });

  // about text content (heading & paragraph) — use a little clip / slide effect for headings
  gsap.from('.about-text h1', {
    y: 18, opacity: 0, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-text', start: 'top 85%', toggleActions: 'play none none none' }
  });
  gsap.from('.about-text p', {
    y: 22, opacity: 0, duration: 0.85, delay: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-text', start: 'top 85%', toggleActions: 'play none none none' }
  });

  // certificates images
  reveal('.modal-container img', { trigger: '.certificates', start: 'top 90%', y: 18, duration: 0.7, stagger: 0.12 });

  // reviews container — fade + slight y
  reveal('.reviews', { trigger: '.reviews', start: 'top 85%', y: 20, duration: 0.7, stagger: 0 });

  // individual carousel item (when entering view animate text lines)
  gsap.utils.toArray('.carousel-item').forEach(item => {
    gsap.from(item.querySelectorAll('p, h3'), {
      y: 18,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 92%',
        toggleActions: 'play none none none',
      }
    });
  });

  // FAQ: reveal each faq-item one by one
  gsap.utils.toArray('.faq-item').forEach((el, i) => {
    gsap.from(el, {
      y: 20, opacity: 0, duration: 0.6, delay: i * 0.03,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' }
    });
  });

  // footer entrance
  reveal('footer', { trigger: 'footer', start: 'top 95%', y: 26, duration: 0.7 });

  // --------- small hover micro-interaction (optional) ----------
  // subtle tilt on service card hover (nice microfeedback)
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', () => gsap.to(card, { y: -6, boxShadow: '0 22px 60px rgba(18,14,12,0.12)', duration: 0.28 }));
    card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, boxShadow: '0 14px 40px rgba(18,14,12,0.06)', duration: 0.28 }));
  });

  // --------- responsiveness: adjust triggers for small screens ----------
  ScrollTrigger.matchMedia({
    // desktop
    "(min-width: 820px)": function() {
      // desktop-specific tweaks (no-op for now)
    },
    // mobile
    "(max-width: 819px)": function() {
      // make animations shorter on small devices
      gsap.globalTimeline.duration = 0.7;
    }
  });

  // Debug helper (uncomment to turn on ScrollTrigger markers)
  // ScrollTrigger.getAll().forEach(st => st.refresh());
});

(function(){
  // config
  const mottoDelay = 0.18;     // seconds before motto appears
  const mottoIn = 0.7;         // motto reveal duration
  const hold = 0.7;            // how long motto is visible before curtains move
  const curtainTime = 1.0;     // curtains open duration
  const ease = "power3.inOut";

  const reveal = document.getElementById('pageReveal');
  const left = document.querySelector('.curtain-left');
  const right = document.querySelector('.curtain-right');
  const motto = document.querySelector('.motto');
  const subtitle = document.querySelector('.motto-sub');

  if (!reveal || !left || !right || !motto) return;

  // lock scrolling while reveal active
  document.body.classList.add('reveal-locked');

  // initial state
  gsap.set([left, right], { xPercent: 0 }); // curtains covering
  gsap.set(motto, { scale: 0.96, y: 12, opacity: 0 });
  gsap.set(subtitle, { opacity: 0, y: 6 });

  const tl = gsap.timeline({
    defaults: { ease },
    onComplete: cleanup
  });

  // motto pop in
  tl.to(motto, { duration: mottoIn, opacity: 1, scale: 1, y: 0, ease: "back.out(1.1)" }, `+=${mottoDelay}`);
  tl.to(subtitle, { duration: 0.6, opacity: 1, y: 0 }, `-=${mottoIn/2}`);

  // hold then animate curtains splitting
  tl.to({}, { duration: hold }); // empty delay

  // animate curtains: left slides left, right slides right (out of viewport)
  tl.to(left, { duration: curtainTime, xPercent: -110, rotation: -0.4, ease }, `>0`);
  tl.to(right, { duration: curtainTime, xPercent: 110, rotation: 0.4, ease }, `<`); // start same time

  // motto fade/move up while curtains open
  tl.to([motto, subtitle], { duration: 0.6, opacity: 0, y: -14, ease: "power2.in" }, `<+${curtainTime*0.25}`);

  // slight reveal glide for page content (optional)
  tl.to(reveal, { duration: 0.001, pointerEvents: "none" }, "+=0.02"); // disable pointer events on overlay if needed

  // small pause then remove element completely
  tl.to(reveal, { duration: 0.4, autoAlpha: 0, ease: "power1.out", delay: 0.08 });

  // cleanup function after timeline completes
  function cleanup() {
    // remove overlay from DOM (optional), unlock scrolling
    document.body.classList.remove('reveal-locked');
    // you can remove element to save nodes
    if (reveal && reveal.parentNode) reveal.parentNode.removeChild(reveal);
    // if you want to trigger any entrance GSAP animations for page content, start them here
  }
})();

// smooth-scroll-to-form.js — add to contact.js or main.js
(function () {
  const btn = document.getElementById('signUp');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();

    const target = document.getElementById('contactForm');
    if (!target) return;

    // detect fixed header height (select your navbar or fallback)
    const navbar = document.querySelector('.navbar');
    const headerOffset = navbar ? navbar.offsetHeight : 80; // fallback 80px
    const extraGap = 16; // additional spacing between navbar and form

    const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerOffset - extraGap;

    window.scrollTo({
      top: Math.max(0, Math.round(targetY)),
      behavior: 'smooth'
    });

    // focus first input after the scroll finishes (approx)
    // setTimeout used to wait for the scroll; tweak delay if needed
    setTimeout(() => {
      const firstInput = target.querySelector('input, textarea, button');
      if (firstInput) firstInput.focus({ preventScroll: true });
    }, 550); // matches typical scroll duration; adjust if necessary
  });
})();

