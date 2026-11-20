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

  /* ── Active nav link ───────────────────────────────────── */
  const links = new Map($$('.nav a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-active'));
      links.get(en.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['story', 'work', 'stack', 'life', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

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

    const mm = gsap.matchMedia();

    /* 1. Hero: one orchestrated load moment */
    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro
      .from('.hero__title .line > span', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.25)
      .from('.hero__lede, .hero__actions, .hero__facts', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.75)
      .from('[data-hero-photo] .window', { y: 40, rotate: 6, scale: 0.94, autoAlpha: 0, duration: 1.3 }, 0.35)
      .from('.status', { x: -20, autoAlpha: 0, duration: 0.7 }, 1.2);

    /* Hero parallax as you leave it */
    gsap.to('[data-hero-photo]', {
      yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('[data-hero-copy]', {
      y: -60, autoAlpha: 0.15, ease: 'none',
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
        x: 28, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: c, start: 'top 82%', once: true },
      });
    });
    const branch = $('.branch path');
    if (branch) {
      const len = branch.getTotalLength();
      gsap.fromTo(branch, { strokeDasharray: `${len}`, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: 'none',
        onComplete: () => gsap.set(branch, { clearProps: 'strokeDasharray,strokeDashoffset' }),
        scrollTrigger: { trigger: '.commit--branch', start: 'top 80%', end: 'top 45%', scrub: true },
      });
    }

    /* 4. Work: pinned horizontal gallery on large screens */
    const work = $('[data-work]');
    const track = $('[data-work-track]');
    mm.add('(min-width: 900px) and (min-height: 620px)', () => {
      work.classList.add('is-horizontal');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: work, start: 'top top', end: () => `+=${distance()}`,
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
      // Cards ease up from the right as they enter the viewport
      $$('.card', track).forEach((card) => {
        gsap.from(card.querySelector('.card__media img'), {
          scale: 1.25, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right 60%', scrub: true },
        });
      });
      return () => work.classList.remove('is-horizontal');
    });
    mm.add('(max-width: 899px), (max-height: 619px)', () => {
      $$('.card', track).forEach((card) => {
        gsap.from(card, { y: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%', once: true } });
      });
    });

    /* 5. Stack: the file "types" itself in line by line */
    gsap.from('.code .ln', {
      autoAlpha: 0, x: -14, duration: 0.5, stagger: 0.08, ease: 'power2.out',
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

    /* 7. Contact */
    gsap.from('.contact__title, .contact__lede, .contact__email, .socials', {
      y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact', start: 'top 70%', once: true },
    });

    /* Re-measure once fonts and lazy images settle */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
