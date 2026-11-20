/* ==========================================================
   anupama.dev: interactions + scroll storytelling
   Everything is readable without JS. GSAP only enhances.
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Header: solid background once scrolled ───────────── */
  const header = $('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile menu ───────────────────────────────────────── */
  const menuBtn = $('[data-menu-btn]');
  const nav = $('[data-nav]');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ── Light / dark toggle ───────────────────────────────
     Follows the device until the visitor picks; the choice is remembered. */
  const themeBtn = $('[data-theme-toggle]');
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);
  const themeMetas = $$('meta[name="theme-color"]');
  const syncTheme = () => {
    const dark = isDark();
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    // Browser chrome colour: once the visitor has chosen, both metas use that theme's colour
    if (root.dataset.theme) themeMetas.forEach((m) => { m.content = dark ? '#000000' : '#F5F5F7'; });
  };
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (_) { /* private mode: still switches for this visit */ }
      syncTheme();
    };
    // Soft cross-fade where supported, like the OS appearance switch
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
    else apply();
  });
  systemDark.addEventListener('change', syncTheme);
  syncTheme();

  /* ── Project cards: spotlight follows the cursor ──────── */
  $$('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ── Code challenge: check the answer against a salted hash ─
     Must match .challenge/generate.mjs (normalize, salt and claim-code format). */
  const form = $('[data-challenge]');
  if (form) {
    const input = $('#challenge-answer', form);
    const result = $('[data-result]', form);
    const claim = $('[data-claim]', form);
    const normalize = (s) => s.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const sha256 = async (s) => {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const answer = normalize(input.value);
      if (!answer) { input.focus(); return; }
      if (!window.crypto?.subtle) { result.textContent = 'Your browser can\'t check answers here. Try a recent browser over https.'; return; }
      const ok = (await sha256('anupama.dev/challenge/v1:' + answer)) === form.dataset.hash;
      result.classList.toggle('is-wrong', !ok);
      if (!ok) {
        result.textContent = 'Not quite. Check your merge-base rules and try again.';
        form.classList.remove('is-shake'); void form.offsetWidth; form.classList.add('is-shake');
        return;
      }
      const h = (await sha256('claim:v1:' + answer)).slice(0, 12).toUpperCase();
      const code = `${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8)}`;
      result.textContent = '';
      $('[data-code]', form).textContent = code;
      const body = `Hi Anupama,\n\nI solved The lost commit.\n\nClaim code: ${code}\nName for the wall: \nLink (GitHub, LinkedIn or site, optional): \nLanguage I solved it in: \n`;
      $('[data-mail]', form).href = `mailto:anupama.dilshan@icloud.com?subject=${encodeURIComponent(`The lost commit: claim ${code}`)}&body=${encodeURIComponent(body)}`;
      claim.hidden = false;
      $('[data-copy]', form).focus();
    });
    $('[data-copy]', form).addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText($('[data-code]', form).textContent); e.target.textContent = 'Copied'; }
      catch (_) { e.target.textContent = 'Select and copy'; }
      setTimeout(() => { e.target.textContent = 'Copy'; }, 1800);
    });
  }

  /* ── Active nav link ───────────────────────────────────── */
  const links = new Map($$('.nav a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-active'));
      links.get(en.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['story', 'work', 'stack', 'life', 'challenge', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

  /* ── Smooth in-page anchor scrolling ───────────────────
     Done in JS rather than CSS `scroll-behavior: smooth`, which fights
     ScrollTrigger's scroll restoration and makes pins jump when scrolling back up. */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : document.documentElement;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.pushState(null, '', id ? `#${id}` : location.pathname);
  });

  /* ── Terminal typing in the hero ───────────────────────── */
  const cmd = $('[data-type]');
  if (cmd && !reduceMotion) {
    const text = cmd.dataset.type;
    cmd.textContent = '';
    let i = 0;
    const tick = () => {
      cmd.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 45 + Math.random() * 55);
    };
    setTimeout(tick, 350);
  }

  /* ── Rotating job title: type, hold, delete, next ──────── */
  const role = $('[data-roles]');
  if (role && !reduceMotion) {
    const out = $('.role__text', role);
    let roles = [];
    try { roles = JSON.parse(role.dataset.roles); } catch (_) { /* keep static text */ }
    if (roles.length > 1) {
      let idx = 0;
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const loop = async () => {
        await wait(2600); // let the hero intro finish first
        for (;;) {
          const current = roles[idx];
          for (let n = current.length; n >= 0; n--) { out.textContent = current.slice(0, n); await wait(32); }
          await wait(280);
          idx = (idx + 1) % roles.length;
          const next = roles[idx];
          for (let n = 1; n <= next.length; n++) { out.textContent = next.slice(0, n); await wait(55 + Math.random() * 40); }
          await wait(2200);
        }
      };
      loop();
    }
  }

  /* ── Fallbacks when GSAP is unavailable ────────────────── */
  const bar = $('.progress__bar');
  const fallback = () => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    update();
    addEventListener('scroll', update, { passive: true });
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) en.target.classList.add('is-active');
    }), { rootMargin: '0px 0px -40% 0px' });
    $$('[data-commit]').forEach((c) => io.observe(c));
  };

  const start = () => {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) { fallback(); return; }
    gsap.registerPlugin(ScrollTrigger);

    /* Page progress */
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    /* Commit nodes light up as each chapter crosses 60% of the viewport */
    $$('[data-commit]').forEach((c) => {
      ScrollTrigger.create({ trigger: c, start: 'top 62%', toggleClass: 'is-active' });
    });

    if (reduceMotion) {
      gsap.set('[data-log-fill]', { scaleY: 1 });
      return;
    }


    /* 1. Hero: one orchestrated load moment */
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .from('.hero__title .line > span', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.25)
      .from('.hero__lede, .hero__actions, .hero__facts', { y: 16, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.75)
      .from('[data-hero-photo] .window', { y: 24, scale: 0.96, autoAlpha: 0, duration: 1.2 }, 0.35)
      .from('.status', { y: 10, autoAlpha: 0, duration: 0.7 }, 1.1);

    /* Hero parallax as you leave it */
    gsap.to('[data-hero-photo]', {
      yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('[data-hero-copy]', {
      y: -40, autoAlpha: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true },
    });

    /* 2. Story preface: words brighten as you read */
    const preface = $('[data-words]');
    if (preface) {
      preface.innerHTML = preface.textContent.trim().split(/\s+/)
        .map((w) => `<span class="w">${w}</span>`).join(' ');
      gsap.fromTo(preface.querySelectorAll('.w'), { opacity: 0.18 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: preface, start: 'top 85%', end: 'bottom 50%', scrub: true },
      });
    }

    /* 3. The git graph draws itself down the story */
    gsap.fromTo('[data-log-fill]', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '[data-log]', start: 'top 62%', end: 'bottom 62%', scrub: 0.4 },
    });
    $$('[data-commit]').forEach((c) => {
      gsap.from(c.querySelectorAll('.commit__meta, .commit__msg, p, .diff, .link-arrow'), {
        y: 16, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out',
        scrollTrigger: { trigger: c, start: 'top 85%', once: true },
      });
    });
    const branch = $('.branch path');
    if (branch) {
      const len = branch.getTotalLength();
      gsap.fromTo(branch, { strokeDasharray: `${len}`, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.commit--branch', start: 'top 80%', end: 'top 45%', scrub: true },
      });
    }

    /* 4. Work (bento grid)
          Entrance: each row scales up and comes into focus, slightly staggered. */
    const cards = $$('[data-work-track] .card');
    gsap.set(cards, { y: 40, scale: 0.94, autoAlpha: 0, filter: 'blur(8px)' });
    ScrollTrigger.batch(cards, {
      start: 'top 92%', once: true,
      onEnter: (batch) => gsap.to(batch, {
        y: 0, scale: 1, autoAlpha: 1, filter: 'blur(0px)', duration: 1.1, stagger: 0.09, ease: 'expo.out',
        clearProps: 'filter',
      }),
    });
    /* Screenshots drift inside their frames as the page scrolls (both directions) */
    $$('[data-work-track] .card__media img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    /* Gentle 3D tilt toward the cursor (mouse/trackpad only) */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      cards.forEach((card) => {
        const max = card.classList.contains('card--feature') || card.classList.contains('card--more') ? 2.5 : 5;
        gsap.set(card, { transformPerspective: 1000 });
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ry(px * max * 2);
          rx(-py * max * 2);
        });
        card.addEventListener('pointerleave', () => { rx(0); ry(0); });
      });
    }

    /* 5. Stack: the file "types" itself in line by line */
    gsap.from('.code .ln', {
      autoAlpha: 0, y: 6, duration: 0.5, stagger: 0.06, ease: 'power2.out',
      scrollTrigger: { trigger: '[data-editor]', start: 'top 75%', once: true },
    });

    /* 6. Hobbies: each photo slowly zooms out and drifts as it passes through the viewport.
          Only transforms are scrubbed, so the photos are always visible. */
    $$('.hobby__art--photo img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.2, yPercent: -4 }, {
        scale: 1.04, yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    /* 6b. Challenge cards rise in together */
    gsap.from('.challenge__brief, .challenge__form, .challenge__wall', {
      y: 24, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.challenge__grid', start: 'top 82%', once: true },
    });

    /* 7. Contact */
    gsap.from('.contact__title, .contact__lede, .contact__email, .socials', {
      y: 20, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact', start: 'top 70%', once: true },
    });

    /* Re-measure once fonts and lazy images settle */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
