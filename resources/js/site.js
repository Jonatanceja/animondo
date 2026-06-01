import gsap from 'gsap';

// ── Mobile nav toggle ─────────────────────────────────────────────────────
const hamburger   = document.getElementById('nav-hamburger');
const mobileMenu  = document.getElementById('nav-mobile-menu');
const ham1        = document.getElementById('ham-1');
const ham2        = document.getElementById('ham-2');
const ham3        = document.getElementById('ham-3');

if (hamburger && mobileMenu) {
  let menuOpen = false;

  hamburger.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.style.maxHeight = menuOpen ? mobileMenu.scrollHeight + 'px' : '0';

    // Animate to X
    if (menuOpen) {
      ham1.style.transform = 'translateY(11px) rotate(45deg)';
      ham2.style.opacity   = '0';
      ham3.style.transform = 'translateY(-11px) rotate(-45deg)';
      ham1.style.width = ham3.style.width = '36px';
    } else {
      ham1.style.transform = ham3.style.transform = '';
      ham2.style.opacity   = '1';
      ham1.style.width = ham3.style.width = '';
    }
  });
}

// ── Nav logo hide on scroll ────────────────────────────────────────────────
const navLogo = document.getElementById('nav-logo');
if (navLogo) {
  window.addEventListener('scroll', () => {
    navLogo.classList.toggle('logo-hidden', window.scrollY > 10);
  }, { passive: true });
}

// ── Video section ──────────────────────────────────────────────────────────
const videoBg = document.querySelector('.video-bg');
if (videoBg) {
  const rawUrl = videoBg.dataset.videoUrl || '';
  if (rawUrl) {
    let embedUrl = rawUrl;
    try {
      if (rawUrl.includes('youtube.com/watch')) {
        const id = new URL(rawUrl).searchParams.get('v');
        embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1`;
      } else if (rawUrl.includes('youtu.be/')) {
        const id = rawUrl.split('youtu.be/')[1].split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1`;
      } else if (rawUrl.includes('vimeo.com/')) {
        const id = rawUrl.split('vimeo.com/')[1].split('?')[0];
        embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&controls=0&background=1`;
      }
    } catch (_) {}

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    videoBg.appendChild(iframe);
  }
}

// ── Hero slider (Ken Burns) ────────────────────────────────────────────────
const heroSlider = document.getElementById('hero-slider');
if (heroSlider) {
  const slides  = Array.from(heroSlider.querySelectorAll('.hero-slide'));
  const kbAnims = ['kenburns-1', 'kenburns-2', 'kenburns-3', 'kenburns-4'];
  let currentSlide = 0;

  function activateSlide(index) {
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('active', active);
      if (active) {
        const img = slide.querySelector('img');
        if (img) {
          img.style.animation = 'none';
          img.offsetHeight; // force reflow to restart animation
          img.style.animation = `${kbAnims[i % kbAnims.length]} 8s ease-in-out forwards`;
        }
      }
    });
  }

  if (slides.length > 0) {
    activateSlide(0);
    if (slides.length > 1) {
      setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        activateSlide(currentSlide);
      }, 5000);
    }
  }
}

// ── Personajes grid cards ──────────────────────────────────────────────────
const personajesGrid = document.querySelector('.personajes-grid');
if (personajesGrid) {
  const cards = Array.from(personajesGrid.querySelectorAll('.personaje-card'));

  gsap.set(cards, { opacity: 0, y: 40, scale: 0.9 });

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      gsap.to(cards, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.55,
        ease: 'power2.out',
        stagger: { each: 0.06, from: 'start' },
      });
      observer.disconnect();
    }
  }, { threshold: 0.1 });

  observer.observe(personajesGrid);
}

// ── Talleres cards ─────────────────────────────────────────────────────────
const tallerCards = document.querySelectorAll('[data-taller-card]');
if (tallerCards.length) {
  gsap.set(tallerCards, { opacity: 0, y: 50 });

  let pending = new Set();
  let batchTimer = null;

  const cardIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      pending.add(entry.target);
      cardIO.unobserve(entry.target);
    });
    clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
      const batch = Array.from(pending);
      pending.clear();
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', stagger: 0.12 });
    }, 50);
  }, { threshold: 0.08 });

  tallerCards.forEach(el => cardIO.observe(el));
}

// ── Circle scroll animation ────────────────────────────────────────────────
const wrapper = document.getElementById('circle-scroll-wrapper');
const circle  = document.getElementById('circle');

if (wrapper && circle && window.matchMedia('(min-width: 640px)').matches) {
  const allFramePositions = [
    { x: '35vw',  y: '-5vh',  scale: 1    },
    { x: '-30vw', y: '25vh',  scale: 1    },
    { x: '0vw',   y: '45vh',  scale: 1    },
    { x: '32vw',  y: '38vh',  scale: 1    },
    { x: '-30vw', y: '0vh',   scale: 1    },
    { x: '0vw',   y: '14vh',  scale: 0.83 },
  ];

  const panels = Array.from({ length: allFramePositions.length }, (_, i) => document.getElementById(`content-${i + 1}`)).filter(Boolean);
  const frames = allFramePositions.slice(0, panels.length);

  let current          = 0;
  let animating        = false;
  let circleActive     = false;
  let snapping         = false;
  let lastFrameChange  = 0;
  let rotation         = 0;

  gsap.set(circle, { x: frames[0].x, y: frames[0].y, scale: frames[0].scale, rotation: 0 });
  gsap.set(panels[0], { opacity: 1 });
  panels.slice(1).forEach(p => gsap.set(p, { opacity: 0 }));

  function getPanelChildren(panel) {
    return Array.from(panel.querySelectorAll('h2, p, a, .flex > div, img'));
  }

  // Set initial state for all panels
  panels.forEach((p, i) => {
    gsap.set(getPanelChildren(p), { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 18 });
  });
  const markerColors = ['#89F0D8cc', '#F5E554cc', '#F289B8cc', '#F57F20cc', '#AFFFECCC'];

  function animateMarkers(panel, enter = true) {
    const strongs = Array.from(panel.querySelectorAll('h2 strong'));
    strongs.forEach((el, i) => {
      const hex = markerColors[i % markerColors.length];
      el.style.backgroundImage = `linear-gradient(${hex}, ${hex})`;
      if (enter) {
        gsap.fromTo(el,
          { backgroundSize: '0% 42%' },
          { backgroundSize: '108% 42%', duration: 0.55, delay: 1.1 + i * 0.18, ease: 'back.out(1.4)' }
        );
      } else {
        gsap.to(el, { backgroundSize: '0% 42%', duration: 0.18, ease: 'power2.in' });
      }
    });
  }

  animateMarkers(panels[0], true);

  function sectionInRange(scrollingDown) {
    const r = wrapper.getBoundingClientRect();
    if (scrollingDown) return r.top >= 0 && r.top < window.innerHeight * 0.15;
    return r.top < 0 && r.bottom > 0; // returning from image section
  }

  function smoothScrollTo(targetY, onComplete) {
    snapping = true;
    const proxy = { y: window.scrollY };
    gsap.to(proxy, {
      y: targetY,
      duration: 0.55,
      ease: 'power2.inOut',
      onUpdate()    { window.scrollTo(0, proxy.y); },
      onComplete()  { snapping = false; if (onComplete) onComplete(); },
    });
  }

  function snapToCircle() {
    const top = wrapper.getBoundingClientRect().top + window.scrollY;
    smoothScrollTo(top);
  }

  function snapToVideo() {
    smoothScrollTo(0, () => { circleActive = false; });
  }

  function goTo(index) {
    if (animating || index === current || index < 0 || index >= frames.length) return;

    animating    = true;
    const prev   = current;
    const dir    = index > prev ? 1 : -1;
    current      = index;
    const frame  = frames[index];
    rotation    += dir * 45;

    gsap.to(circle, { x: frame.x, y: frame.y, scale: frame.scale, rotation, duration: 0.9, ease: 'power2.inOut' });

    // Fade out previous panel + its children
    animateMarkers(panels[prev], false);
    gsap.to(panels[prev], { opacity: 0, duration: 0.25, ease: 'power1.out' });
    gsap.to(getPanelChildren(panels[prev]), { opacity: 0, y: dir * -12, duration: 0.2, ease: 'power1.out', stagger: 0.04 });

    // Fade in new panel + stagger-animate children + markers
    gsap.to(panels[current], { opacity: 1, duration: 0.1, delay: 0.3 });
    gsap.fromTo(
      getPanelChildren(panels[current]),
      { opacity: 0, y: dir * 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.32, ease: 'power2.out', stagger: 0.07 }
    );
    animateMarkers(panels[current], true);

    setTimeout(() => { animating = false; lastFrameChange = Date.now(); }, 1100);
  }

  window.addEventListener('wheel', (e) => {
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 40;
    if (e.deltaMode === 2) delta *= 800;

    // ── Enter / re-enter circle section ──────────────────────────────────
    if (!circleActive) {
      if (!sectionInRange(delta > 0)) return;
      circleActive = true;
      e.preventDefault();
      if (Math.abs(wrapper.getBoundingClientRect().top) > 2) snapToCircle();
      return;
    }

    // Last frame + scroll down → release scroll lock, let page scroll naturally
    if (delta > 0 && current === frames.length - 1 && !animating && !snapping) {
      circleActive = false;
      return;
    }

    // ── Inside circle section — lock page scroll ──────────────────────────
    e.preventDefault();

    if (snapping) return;
    if (Math.abs(delta) < 10) return; // ignore inertia tail
    if (animating) return;

    // Frame 0 + scroll up → smooth return to hero (require deliberate second gesture)
    if (delta < 0 && current === 0) {
      if (Date.now() - lastFrameChange < 600) return;
      snapToVideo();
      return;
    }

    if (delta > 0) goTo(current + 1);
    else           goTo(current - 1);
  }, { passive: false });

  // ── Touch ────────────────────────────────────────────────────────────────
  let touchStartY = 0;

  wrapper.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    if (!circleActive) {
      const r = wrapper.getBoundingClientRect();
      // Activate if wrapper is filling the viewport (already snapped)
      if (Math.abs(r.top) < 10) {
        circleActive = true;
      }
    }
  }, { passive: true });

  wrapper.addEventListener('touchmove', (e) => {
    if (circleActive) e.preventDefault();
  }, { passive: false });

  wrapper.addEventListener('touchend', (e) => {
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(delta) < 30) return;

    if (!circleActive) {
      if (!sectionInRange(delta > 0)) return;
      circleActive = true;
      if (Math.abs(wrapper.getBoundingClientRect().top) > 2) snapToCircle();
      return;
    }

    if (delta > 0 && current === frames.length - 1 && !animating) {
      circleActive = false;
      return;
    }

    if (delta < 0 && current === 0) {
      circleActive = false;
      snapToVideo();
      return;
    }

    if (animating) return;
    if (delta > 0) goTo(current + 1);
    else           goTo(current - 1);
  }, { passive: true });

  // ── Keyboard ─────────────────────────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    const down = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const up   = e.key === 'ArrowUp'   || e.key === 'ArrowLeft';
    if (!down && !up) return;

    if (!circleActive) {
      if (!sectionInRange(down)) return;
      circleActive = true;
      if (Math.abs(wrapper.getBoundingClientRect().top) > 2) snapToCircle();
      return;
    }

    if (up && current === 0) {
      circleActive = false;
      snapToVideo();
      return;
    }

    if (down) goTo(current + 1);
    if (up)   goTo(current - 1);
  });
}

// ── Mobile El Viaje slider ─────────────────────────────────────────────────
const mobileViaje  = document.getElementById('mobile-viaje');
const mobileCircle = document.getElementById('mobile-circle');

if (mobileViaje && mobileCircle && !window.matchMedia('(min-width: 640px)').matches) {
  const mScales = [1.0, 1.25, 1.25, 1.25, 1.25, 1.0];

  const mPanels = Array.from({ length: 6 }, (_, i) =>
    document.getElementById(`mobile-content-${i + 1}`)
  ).filter(Boolean);

  let mCur     = 0;
  let mAnim    = false;
  let mActive  = false;
  let mLastChg = 0;
  let mRot     = 0;
  let mSavedY  = 0;
  const mTotal = mPanels.length;

  gsap.set(mobileCircle, { scale: mScales[0], rotation: 0 });
  gsap.set(mPanels[0], { opacity: 1 });
  mPanels.slice(1).forEach(p => gsap.set(p, { opacity: 0 }));

  function mChildren(panel) {
    return Array.from(panel.querySelectorAll('h2, p, img, .flex > div'));
  }
  mPanels.forEach((p, i) => {
    gsap.set(mChildren(p), { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 18 });
  });

  const mColors = ['#89F0D8cc', '#F5E554cc', '#F289B8cc', '#F57F20cc', '#AFFFECCC'];

  function mMarkers(panel, enter) {
    Array.from(panel.querySelectorAll('h2 strong')).forEach((el, i) => {
      el.style.backgroundImage = `linear-gradient(${mColors[i % mColors.length]}, ${mColors[i % mColors.length]})`;
      if (enter) {
        gsap.fromTo(el, { backgroundSize: '0% 42%' },
          { backgroundSize: '108% 42%', duration: 0.55, delay: 1.0 + i * 0.18, ease: 'back.out(1.4)' });
      } else {
        gsap.to(el, { backgroundSize: '0% 42%', duration: 0.18, ease: 'power2.in' });
      }
    });
  }
  mMarkers(mPanels[0], true);

  // Body scroll lock — stops iOS momentum scroll completely
  function mLock(snapToDocY) {
    const currentY = window.scrollY;
    mSavedY = snapToDocY ?? currentY;
    document.body.style.position = 'fixed';
    document.body.style.top      = `-${currentY}px`;
    document.body.style.left     = '0';
    document.body.style.right    = '0';
    document.body.style.overflow = 'hidden';
    // Animate body.top to snap section to viewport top
    if (Math.abs(mSavedY - currentY) > 3) {
      gsap.to(document.body, { top: `-${mSavedY}px`, duration: 0.4, ease: 'power2.inOut' });
    }
  }

  function mUnlock(scrollTo) {
    gsap.killTweensOf(document.body);
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.left     = '';
    document.body.style.right    = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollTo ?? mSavedY);
  }

  function mGoTo(idx) {
    if (mAnim || idx === mCur || idx < 0 || idx >= mTotal) return;
    mAnim = true;
    const prev = mCur;
    const dir  = idx > prev ? 1 : -1;
    mCur  = idx;
    mRot += dir * 45;

    gsap.to(mobileCircle, { scale: mScales[idx] ?? 1, rotation: mRot, duration: 0.9, ease: 'power2.inOut' });
    mMarkers(mPanels[prev], false);
    gsap.to(mPanels[prev], { opacity: 0, duration: 0.25 });
    gsap.to(mChildren(mPanels[prev]), { opacity: 0, y: dir * -12, duration: 0.2, stagger: 0.04 });
    gsap.to(mPanels[mCur], { opacity: 1, duration: 0.1, delay: 0.3 });
    gsap.fromTo(mChildren(mPanels[mCur]),
      { opacity: 0, y: dir * 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.32, ease: 'power2.out', stagger: 0.07 });
    mMarkers(mPanels[mCur], true);
    setTimeout(() => { mAnim = false; mLastChg = Date.now(); }, 1100);
  }

  let mTouchY = 0;

  // touchstart: activate if section is anywhere in the top 40% of viewport
  window.addEventListener('touchstart', (e) => {
    mTouchY = e.touches[0].clientY;
    if (!mActive) {
      const r = mobileViaje.getBoundingClientRect();
      if (r.top > -window.innerHeight * 0.1 && r.top < window.innerHeight * 0.4) {
        mActive = true;
        mLock(r.top + window.scrollY);
      }
    }
  }, { passive: true });

  // touchmove: while locked, block all native scroll
  document.addEventListener('touchmove', (e) => {
    if (mActive) e.preventDefault();
  }, { passive: false });

  // touchend: navigate slides or exit
  window.addEventListener('touchend', (e) => {
    const delta = mTouchY - e.changedTouches[0].clientY;
    if (!mActive || Math.abs(delta) < 30) return;

    if (delta > 0 && mCur === mTotal - 1 && !mAnim) {
      // Exit forward — scroll past section
      mActive = false;
      mUnlock(mSavedY + window.innerHeight);
      return;
    }
    if (delta < 0 && mCur === 0) {
      if (Date.now() - mLastChg < 600) return;
      mActive = false;
      mUnlock(0);
      return;
    }
    if (mAnim) return;
    if (delta > 0) mGoTo(mCur + 1);
    else           mGoTo(mCur - 1);
  }, { passive: true });
}

// ── Taller schedule formatting ────────────────────────────────────────────
const WEEKDAYS = ['lunes','martes','miercoles','jueves','viernes'];
const MESES    = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

document.querySelectorAll('.taller-dias[data-dias]').forEach(el => {
  const dias = el.dataset.dias ? el.dataset.dias.split(',').map(s => s.trim()) : [];
  const isWeekdays = WEEKDAYS.every(d => dias.includes(d)) && !dias.includes('sabado') && !dias.includes('domingo');
  if (isWeekdays) el.textContent = 'De Lunes a Viernes';
});

document.querySelectorAll('[data-time]').forEach(el => {
  const [hStr, mStr] = el.dataset.time.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  el.textContent = `${h % 12 || 12}:${mStr} ${ampm}`;
});

document.querySelectorAll('[data-date]').forEach(el => {
  const parts = el.dataset.date.split('-').map(Number);
  el.textContent = `${parts[2]} de ${MESES[parts[1] - 1]} de ${parts[0]}`;
});

// ── Taller page scroll animations ─────────────────────────────────────────
const tallerReveals = document.querySelectorAll('[data-reveal]');
if (tallerReveals.length) {
  gsap.set(tallerReveals, { opacity: 0, y: 36 });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      gsap.to(entry.target, {
        opacity: 1, y: 0,
        duration: 0.65,
        delay: parseFloat(entry.target.dataset.delay ?? 0),
        ease: 'power3.out'
      });
      revealIO.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  tallerReveals.forEach(el => revealIO.observe(el));
}

const tallerChar = document.querySelector('[data-reveal-char]');
if (tallerChar) {
  gsap.set(tallerChar, { opacity: 0, x: 80 });
  const charIO = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    gsap.to(tallerChar, { opacity: 1, x: 0, duration: 0.9, delay: 0.2, ease: 'power3.out' });
    charIO.disconnect();
  }, { threshold: 0.05 });
  charIO.observe(tallerChar);
}

const staggerGrid = document.querySelector('[data-stagger-cards]');
if (staggerGrid) {
  const staggerCards = staggerGrid.querySelectorAll('[data-stagger-child]');
  gsap.set(staggerCards, { opacity: 0, y: 36 });
  const staggerIO = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    gsap.to(staggerCards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
    staggerIO.disconnect();
  }, { threshold: 0.1 });
  staggerIO.observe(staggerGrid);
}

// ── Viaje del Animador tabs ────────────────────────────────────────────────
const viajeBtns   = document.querySelectorAll('.viaje-tab-btn');
const viajePanels = document.querySelectorAll('.viaje-tab-panel');

if (viajeBtns.length) {
  function setViajeTab(i) {
    viajeBtns.forEach((b, j)  => b.classList.toggle('viaje-tab-active', j === i));
    viajePanels.forEach((p, j) => { p.style.display = j === i ? '' : 'none'; });
  }
  viajeBtns.forEach((b, i) => b.addEventListener('click', () => setViajeTab(i)));
  setViajeTab(0);
}
