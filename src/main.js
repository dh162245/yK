
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

