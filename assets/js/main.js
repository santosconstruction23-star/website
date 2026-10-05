(() => {
  // Preloader: show once per session, then take it out of the DOM
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    try { sessionStorage.setItem('psPre', '1'); } catch (e) { /* storage blocked: preloader still self-hides via CSS */ }
    setTimeout(() => preloader.remove(), 2600);
  }

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');

  // Header shadow on scroll
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  if (toggle && nav) {
    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  // Highlight the nav link of the section in view
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const spied = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  if (spied.length) {
    let ticking = false;
    const spy = () => {
      ticking = false;
      const line = window.innerHeight * 0.4;
      let current = spied[0];
      spied.forEach((section) => { if (section.getBoundingClientRect().top <= line) current = section; });
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current.id));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }

  // Hero slideshow (client project photos)
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dot'));
  if (slides.length > 1) {
    let index = 0;
    let timer = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const load = (img) => {
      if (img.dataset.src) {
        img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      }
    };
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      load(slides[(index + 1) % slides.length]);
      slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
      dots.forEach((d, k) => {
        d.classList.toggle('is-active', k === index);
        if (k === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    };
    const play = () => {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => { if (!document.hidden) show(index + 1); }, 6000);
    };
    dots.forEach((d, k) => d.addEventListener('click', () => { load(slides[k]); show(k); play(); }));
    // Load the remaining slides only after the page is ready so the first photo stays fast
    window.addEventListener('load', () => { load(slides[1]); play(); });
  }

  // Services carousel: 3 visible, centre card in focus, infinite loop
  const svcTrack = document.getElementById('svc-track');
  if (svcTrack) {
    const cards = Array.from(svcTrack.querySelectorAll('.service-card'));
    const svcDots = Array.from(document.querySelectorAll('.svc-dot'));
    const carousel = svcTrack.closest('.svc-carousel');
    const total = cards.length;
    let active = 0;
    let paused = false;

    const render = () => {
      const vw = svcTrack.clientWidth;
      const w = parseFloat(svcTrack.style.getPropertyValue('--svc-w')) || 380;
      const step = vw < 700 ? w * 0.9 + 8 : w * 0.93 + 20;
      cards.forEach((card, i) => {
        let off = ((i - active) % total + total) % total;
        if (off > total / 2) off -= total;
        const dist = Math.abs(off);
        card.style.transform = `translateX(${off * step}px) scale(${off === 0 ? 1 : 0.86})`;
        card.style.opacity = dist > 1 ? 0 : off === 0 ? 1 : 0.55;
        card.style.zIndex = String(3 - dist);
        card.classList.toggle('is-center', off === 0);
        card.classList.toggle('is-side', dist === 1);
        card.classList.toggle('is-hidden', dist > 1);
        card.setAttribute('aria-hidden', off === 0 ? 'false' : 'true');
        card.querySelectorAll('a').forEach((a) => (off === 0 ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
      });
      svcDots.forEach((d, k) => {
        d.classList.toggle('is-active', k === active);
        if (k === active) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    };

    const layout = () => {
      const vw = svcTrack.clientWidth;
      const w = vw < 700 ? Math.min(vw * 0.82, 380) : Math.min(400, (vw - 48) / 3);
      svcTrack.style.setProperty('--svc-w', w + 'px');
      cards.forEach((c) => { c.style.height = 'auto'; });
      const h = Math.max(...cards.map((c) => c.offsetHeight));
      cards.forEach((c) => { c.style.height = h + 'px'; });
      svcTrack.style.setProperty('--svc-h', h + 'px');
      render();
    };

    const go = (i) => { active = ((i % total) + total) % total; render(); };

    document.querySelector('.svc-next').addEventListener('click', () => go(active + 1));
    document.querySelector('.svc-prev').addEventListener('click', () => go(active - 1));
    svcDots.forEach((d, k) => d.addEventListener('click', () => go(k)));

    // Clicking a side card brings it to the centre instead of following its link
    svcTrack.addEventListener('click', (e) => {
      const card = e.target.closest('.service-card');
      if (card && !card.classList.contains('is-center')) {
        e.preventDefault();
        go(cards.indexOf(card));
      }
    });

    // Swipe
    let startX = null;
    svcTrack.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    svcTrack.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    });

    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(active + 1);
      if (e.key === 'ArrowLeft') go(active - 1);
    });

    // Gentle autoplay, paused while the visitor is interacting
    carousel.addEventListener('mouseenter', () => { paused = true; });
    carousel.addEventListener('mouseleave', () => { paused = false; });
    carousel.addEventListener('focusin', () => { paused = true; });
    carousel.addEventListener('focusout', () => { paused = false; });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(() => { if (!paused && !document.hidden) go(active + 1); }, 6000);
    }

    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
  }

  // Why-us video: plays only while on screen; button toggles sound (stop icon = sound on)
  const whyVideo = document.getElementById('why-video');
  if (whyVideo) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) whyVideo.play().catch(() => {}); else whyVideo.pause();
      }, { threshold: 0.35 }).observe(whyVideo);
    } else {
      whyVideo.controls = true;
    }
    const soundBtn = document.querySelector('.why-sound');
    soundBtn.addEventListener('click', () => {
      if (whyVideo.paused) whyVideo.play().catch(() => {});
      whyVideo.muted = !whyVideo.muted;
      const on = !whyVideo.muted;
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.setAttribute('aria-label', on ? 'Turn video sound off' : 'Turn video sound on');
    });
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // "Get a quote" on a service card picks that service and opens the form at step 2
  let selectService = null;
  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      if (link.closest('.service-card.is-side, .service-card.is-hidden')) return; // side card just slides to the centre
      if (selectService) selectService(link.dataset.service);
    });
  });

  // Hide the mobile action bar while the estimate form is on screen
  const bar = document.getElementById('mobile-bar');
  const estimate = document.getElementById('estimate');
  if (bar && estimate && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => bar.classList.toggle('is-hidden', entry.isIntersecting), { threshold: 0.15 }).observe(estimate);
  }

  // Form: phone mask + submit state
  const form = document.getElementById('form01');
  if (form) {
    const phone = form.querySelector('input[type="tel"]');
    phone && phone.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').replace(/^1(?=\d{10})/, '').slice(0, 10);
      if (d.length > 6) phone.value = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
      else if (d.length > 3) phone.value = `(${d.slice(0, 3)}) ${d.slice(3)}`;
      else if (d.length) phone.value = `(${d}`;
    });
    // Multi-step flow: service -> project -> contact
    const steps = Array.from(form.querySelectorAll('.form-step'));
    let current = 0;
    if (steps.length > 1) {
      form.noValidate = true; // we validate step by step instead
      form.classList.add('is-stepped');
      const bars = Array.from(form.querySelectorAll('.step-bars i'));
      const stepNow = form.querySelector('[data-step-now]');
      const fieldsOf = (i) => Array.from(steps[i].querySelectorAll('input, select, textarea'));
      const stepOk = (i) => fieldsOf(i).every((f) => f.checkValidity());
      const report = (i) => { const bad = fieldsOf(i).find((f) => !f.checkValidity()); if (bad) bad.reportValidity(); };
      const show = (i, focus = true) => {
        current = Math.max(0, Math.min(steps.length - 1, i));
        steps.forEach((s, k) => s.classList.toggle('is-active', k === current));
        bars.forEach((b, k) => b.classList.toggle('is-done', k <= current));
        if (stepNow) stepNow.textContent = String(current + 1);
        if (focus) {
          const first = steps[current].querySelector('input:not([type="radio"]):not([type="hidden"]), textarea');
          if (first) first.focus({ preventScroll: true });
        }
      };

      form.addEventListener('change', (e) => {
        if (e.target.name === 'service' && current === 0) setTimeout(() => show(1), 220);
      });
      form.querySelectorAll('[data-step-next]').forEach((b) => b.addEventListener('click', () => {
        if (stepOk(current)) show(current + 1); else report(current);
      }));
      form.querySelectorAll('[data-step-back]').forEach((b) => b.addEventListener('click', () => show(current - 1)));
      // Enter on an earlier step moves forward instead of submitting
      form.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || current === steps.length - 1) return;
        e.preventDefault();
        if (stepOk(current)) show(current + 1); else report(current);
      });
      form.addEventListener('submit', (e) => {
        const bad = steps.findIndex((s, i) => !stepOk(i));
        if (bad !== -1) { e.preventDefault(); show(bad, false); report(bad); }
      });

      selectService = (name) => {
        const radio = Array.from(form.querySelectorAll('input[name="service"]')).find((r) => r.value === name);
        if (radio) { radio.checked = true; show(1, false); }
      };
    }

    // Spam guard: at most 10 estimate requests per browser in any rolling 24 hours
    const MAX_SUBMISSIONS = 10;
    const WINDOW_MS = 24 * 60 * 60 * 1000;
    const KEY = 'psFormSubs';
    const recent = () => {
      try { return (JSON.parse(localStorage.getItem(KEY)) || []).filter((t) => Date.now() - t < WINDOW_MS); } catch (err) { return []; }
    };
    form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) return;
      const sent = recent();
      if (sent.length >= MAX_SUBMISSIONS) {
        e.preventDefault();
        let note = form.querySelector('.form-limit');
        if (!note) {
          note = document.createElement('p');
          note.className = 'form-limit';
          note.setAttribute('role', 'alert');
          note.innerHTML = 'You have reached the limit of requests for today. Please call us at <a href="tel:+17744164001">(774) 416-4001</a>.';
          form.querySelector('.form-step:last-of-type').appendChild(note);
        }
        return;
      }
      try { localStorage.setItem(KEY, JSON.stringify(sent.concat(Date.now()))); } catch (err) { /* storage blocked: Web3Forms still rate-limits server-side */ }
    });
    form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) return;
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.firstChild.textContent = 'Sending… '; }
    });
  }

  // Gallery: mobile "show more"
  const gallery = document.getElementById('gallery');
  const galleryItems = gallery ? Array.from(gallery.querySelectorAll('.gallery-item')) : [];

  // Gallery: two rows of photos drifting in opposite directions (looping marquee)
  if (gallery && galleryItems.length > 3) {
    const half = Math.ceil(galleryItems.length / 2);
    const rows = [galleryItems.slice(0, half), galleryItems.slice(half).reverse()];
    gallery.classList.add('is-marquee');
    gallery.innerHTML = '';
    rows.forEach((list, r) => {
      const row = document.createElement('div');
      row.className = 'gallery-row' + (r % 2 ? ' is-reverse' : '');
      const track = document.createElement('div');
      track.className = 'gallery-track';
      track.style.setProperty('--dur', (list.length * 6) + 's');
      [0, 1].forEach((copy) => list.forEach((item) => {
        const el = copy ? item.cloneNode(true) : item;
        if (copy) {
          el.setAttribute('aria-hidden', 'true');
          el.tabIndex = -1;
          el.dataset.src = String(galleryItems.indexOf(item));
        }
        track.appendChild(el);
      }));
      row.appendChild(track);
      gallery.appendChild(row);
    });
    gallery.dataset.ready = '1';
  }
  // Lightbox (photos + videos)
  const dialog = document.getElementById('lightbox');
  if (gallery && dialog && typeof dialog.showModal === 'function') {
    const items = galleryItems;
    const stage = dialog.querySelector('.lightbox-stage');
    let current = 0;

    const render = (i) => {
      current = (i + items.length) % items.length;
      const item = items[current];
      const img = item.querySelector('img');
      stage.innerHTML = '';
      if (item.dataset.video) {
        const v = document.createElement('video');
        v.src = item.dataset.video;
        v.controls = true;
        v.autoplay = true;
        v.playsInline = true;
        v.poster = img.currentSrc || img.src;
        stage.appendChild(v);
      } else {
        const full = document.createElement('img');
        full.src = item.dataset.full;
        full.alt = img.alt;
        stage.appendChild(full);
      }
    };
    const close = () => { stage.innerHTML = ''; dialog.close(); };

    gallery.addEventListener('click', (e) => {
      const btn = e.target.closest('.gallery-item');
      if (!btn) return;
      const i = btn.dataset.src ? Number(btn.dataset.src) : items.indexOf(btn);
      render(i);
      dialog.showModal();
    });
    dialog.querySelector('.lightbox-close').addEventListener('click', close);
    dialog.querySelector('.lightbox-prev').addEventListener('click', () => render(current - 1));
    dialog.querySelector('.lightbox-next').addEventListener('click', () => render(current + 1));
    dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.classList.contains('lightbox-inner')) close(); });
    dialog.addEventListener('close', () => { stage.innerHTML = ''; });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') render(current + 1);
      if (e.key === 'ArrowLeft') render(current - 1);
    });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
