import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(SplitText, ScrollTrigger);

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

// ── Hero headline animation ────────────────────────────────────────────────
const heroHeadline = document.querySelector('.hero-headline-text');
if (heroHeadline) {
  const split = new SplitText(heroHeadline, { type: 'words', wordsClass: 'hero-word' });

  gsap.fromTo(split.words,
    { opacity: 0, y: 40, rotateX: -60, transformOrigin: '50% 0%' },
    {
      opacity: 1, y: 0, rotateX: 0,
      duration: 0.7, delay: 0.3,
      ease: 'back.out(1.6)',
      stagger: 0.07,
      onComplete() {
        const markerColors = ['#89F0D8cc', '#F5E554cc', '#F289B8cc', '#F57F20cc'];
        heroHeadline.querySelectorAll('strong').forEach((el, i) => {
          const hex = markerColors[i % markerColors.length];
          el.style.backgroundImage = `linear-gradient(${hex}, ${hex})`;
          gsap.fromTo(el,
            { backgroundSize: '0% 42%' },
            { backgroundSize: '108% 42%', duration: 0.55, delay: i * 0.18, ease: 'back.out(1.4)' }
          );
        });
      }
    }
  );
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

// ── Talleres headline ──────────────────────────────────────────────────────
const talleresHeadline = document.getElementById('talleres-headline');
if (talleresHeadline) {
  const split = new SplitText(talleresHeadline, { type: 'words' });
  gsap.set(split.words, { opacity: 0, y: 40, rotateX: -60, transformOrigin: '50% 0%' });

  const aboveFold = talleresHeadline.getBoundingClientRect().top < window.innerHeight;
  if (aboveFold) {
    gsap.to(split.words, { opacity: 1, y: 0, rotateX: 0, duration: 0.7, delay: 0.3, ease: 'back.out(1.6)', stagger: 0.07 });
  } else {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        gsap.to(split.words, { opacity: 1, y: 0, rotateX: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.07 });
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    obs.observe(talleresHeadline);
  }
}

// ── Marca section ─────────────────────────────────────────────────────────
const marcaSuper  = document.querySelector('[data-marca="super"]');
const marcaTitulo = document.querySelector('[data-marca="titulo"]');

if (marcaSuper || marcaTitulo) {
  const splits = [];

  [marcaSuper, marcaTitulo].forEach((el, i) => {
    if (!el) return;
    const split = new SplitText(el, { type: 'words' });
    gsap.set(split.words, { opacity: 0, y: 40, rotateX: -60, transformOrigin: '50% 0%' });
    splits.push({ words: split.words, delay: i * 0.25 });
  });

  const anchor = marcaSuper || marcaTitulo;
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      splits.forEach(({ words, delay }) => {
        gsap.to(words, { opacity: 1, y: 0, rotateX: 0, duration: 0.7, delay, ease: 'back.out(1.6)', stagger: 0.07 });
      });
      obs.disconnect();
    }
  }, { threshold: 0.2 });
  obs.observe(anchor);
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

// ── Annotation helpers (marker + circle effects) ──────────────────────────
const annoColors = ['#89F0D8', '#F5E554', '#F289B8', '#F57F20', '#AFFFEC'];

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeAnnoCircle(el, color, delay) {
  // Defer SVG creation to the moment it should start drawing so layout is settled
  gsap.delayedCall(delay, () => {
    el.style.position = 'relative';
    el.style.display  = 'inline-block';

    const padX = 14, padY = 8;
    const w  = el.offsetWidth  + padX * 2;
    const h  = el.offsetHeight + padY * 2;
    const cx = w / 2;
    const cy = h / 2;
    const rx = cx - 3;
    const ry = cy - 3;
    const perim = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);

    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'anno-circle');
    svg.style.cssText = `position:absolute;left:${-padX}px;top:${-padY}px;width:${w}px;height:${h}px;pointer-events:none;overflow:visible;`;

    const ellipse = document.createElementNS(ns, 'ellipse');
    ellipse.setAttribute('cx', cx);
    ellipse.setAttribute('cy', cy);
    ellipse.setAttribute('rx', rx);
    ellipse.setAttribute('ry', ry);
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', color);
    ellipse.setAttribute('stroke-width', '4');
    ellipse.setAttribute('stroke-linecap', 'round');
    ellipse.style.strokeDasharray  = perim;
    ellipse.style.strokeDashoffset = perim;

    svg.appendChild(ellipse);
    el.appendChild(svg);

    gsap.to(ellipse, { strokeDashoffset: 0, duration: 0.65, ease: 'power2.inOut' });
  });
}

function clearAnnoCircles(el) {
  el.querySelectorAll('.anno-circle').forEach(svg => {
    const ellipse = svg.querySelector('ellipse');
    if (ellipse) {
      const perim = parseFloat(ellipse.style.strokeDasharray);
      gsap.to(ellipse, { strokeDashoffset: perim, duration: 0.18, ease: 'power2.in', onComplete: () => svg.remove() });
    } else { svg.remove(); }
  });
}

function animateAnnotations(panel, enter, baseDelay = 1.1) {
  const strongs = Array.from(panel.querySelectorAll('h2 strong'));
  if (!strongs.length) return;

  if (!enter) {
    strongs.forEach(el => {
      gsap.to(el, { backgroundSize: '0% 42%', duration: 0.18, ease: 'power2.in' });
      clearAnnoCircles(el);
    });
    return;
  }

  const colors = shuffled(annoColors);
  const startCircle = Math.random() > 0.5;

  strongs.forEach((el, i) => {
    const color = colors[i % colors.length];
    const delay = baseDelay + i * 0.18;
    const useCircle = (i % 2 === 0) === startCircle;

    if (useCircle) {
      makeAnnoCircle(el, color, delay);
    } else {
      el.style.backgroundImage = `linear-gradient(${color}cc, ${color}cc)`;
      gsap.fromTo(el,
        { backgroundSize: '0% 42%' },
        { backgroundSize: '108% 42%', duration: 0.55, delay, ease: 'back.out(1.4)' }
      );
    }
  });
}

// ── Circle scroll animation ────────────────────────────────────────────────
const wrapper = document.getElementById('circle-scroll-wrapper');
const circle  = document.getElementById('circle');

if (wrapper && circle && window.matchMedia('(min-width: 640px)').matches) {
  const allFramePositions = [
    { x: '35vw',  y: '-5vh',  scale: 1    },
    { x: '-30vw', y: '25vh',  scale: 1    },
    { x: '0vw',   y: '60vh',  scale: 1    },
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
    return Array.from(panel.querySelectorAll('p, a, .flex > div, img'));
  }

  // Pre-split all panel h2s into words
  const panelSplits = panels.map(panel => {
    const h2 = panel.querySelector('h2');
    return h2 ? new SplitText(h2, { type: 'words', reduceWhiteSpace: false }) : null;
  });

  // Set initial state for all panels — all hidden until section activates
  panels.forEach((p, i) => {
    gsap.set(getPanelChildren(p), { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 18 });
    if (panelSplits[i]) {
      gsap.set(panelSplits[i].words, { opacity: 0, y: 18, rotateX: -40, transformOrigin: '50% 0%' });
    }
  });
  function animateMarkers(panel, enter = true) {
    animateAnnotations(panel, enter, 1.1);
  }

  let firstPanelAnimated = false;
  function animateFirstPanel() {
    if (firstPanelAnimated) return;
    firstPanelAnimated = true;
    if (panelSplits[0]) {
      gsap.fromTo(panelSplits[0].words,
        { opacity: 0, y: 40, rotateX: -60, transformOrigin: '50% 0%' },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.7, delay: 0.3, ease: 'back.out(1.6)', stagger: 0.07 }
      );
    }
    animateMarkers(panels[0], true);
  }

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
    if (panelSplits[prev]) {
      gsap.to(panelSplits[prev].words, { opacity: 0, y: dir * -12, rotateX: dir * 30, duration: 0.2, ease: 'power1.out', stagger: 0.03 });
    }

    // Fade in new panel + stagger-animate children + markers
    gsap.to(panels[current], { opacity: 1, duration: 0.1, delay: 0.3 });
    gsap.fromTo(
      getPanelChildren(panels[current]),
      { opacity: 0, y: dir * 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.32, ease: 'power2.out', stagger: 0.07 }
    );
    if (panelSplits[current]) {
      gsap.fromTo(panelSplits[current].words,
        { opacity: 0, y: 40, rotateX: -60, transformOrigin: '50% 0%' },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.7, delay: 0.32, ease: 'back.out(1.6)', stagger: 0.07 }
      );
    }
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
      animateFirstPanel();
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
        animateFirstPanel();
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
      animateFirstPanel();
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
    return Array.from(panel.querySelectorAll('p, img, .flex > div'));
  }

  const mSplits = mPanels.map(panel => {
    const h2 = panel.querySelector('h2');
    return h2 ? new SplitText(h2, { type: 'words', reduceWhiteSpace: false }) : null;
  });

  mPanels.forEach((p, i) => {
    gsap.set(mChildren(p), { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 18 });
    if (mSplits[i]) {
      gsap.set(mSplits[i].words, { opacity: 0, y: 18, rotateX: -40, transformOrigin: '50% 0%' });
    }
  });

  function mMarkers(panel, enter) {
    animateAnnotations(panel, enter, 1.0);
  }

  let mFirstAnimated = false;
  function mAnimateFirstPanel() {
    if (mFirstAnimated) return;
    mFirstAnimated = true;
    if (mSplits[0]) {
      gsap.fromTo(mSplits[0].words,
        { opacity: 0, y: 40, rotateX: -60, transformOrigin: '50% 0%' },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.7, delay: 0.3, ease: 'back.out(1.6)', stagger: 0.07 }
      );
    }
    mMarkers(mPanels[0], true);
  }

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
    if (mSplits[prev]) {
      gsap.to(mSplits[prev].words, { opacity: 0, y: dir * -12, rotateX: dir * 30, duration: 0.2, ease: 'power1.out', stagger: 0.03 });
    }
    gsap.to(mPanels[mCur], { opacity: 1, duration: 0.1, delay: 0.3 });
    gsap.fromTo(mChildren(mPanels[mCur]),
      { opacity: 0, y: dir * 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.32, ease: 'power2.out', stagger: 0.07 });
    if (mSplits[mCur]) {
      gsap.fromTo(mSplits[mCur].words,
        { opacity: 0, y: 40, rotateX: -60, transformOrigin: '50% 0%' },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.7, delay: 0.32, ease: 'back.out(1.6)', stagger: 0.07 }
      );
    }
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
        mAnimateFirstPanel();
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

// ── Marca section scroll animation ────────────────────────────────────────
const marcaSection = document.querySelector('[data-marca="super"], [data-marca="titulo"]')?.closest('section');
if (marcaSection) {
  const marcaSuper = marcaSection.querySelector('[data-marca="super"]');
  const marcaTitulo = marcaSection.querySelector('[data-marca="titulo"]');
  const marcaLogo   = marcaSection.querySelector('[data-marca="logo"]');
  const marcaChars  = marcaSection.querySelector('[data-marca="chars"]');

  const toAnimate = [marcaSuper, marcaTitulo, marcaLogo].filter(Boolean);
  if (toAnimate.length) gsap.set(toAnimate, { opacity: 0, y: 40 });
  if (marcaChars) gsap.set(marcaChars, { y: 120, opacity: 0 });

  const marcaIO = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    marcaIO.disconnect();
    gsap.to(toAnimate, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 });
    if (marcaChars) {
      gsap.to(marcaChars, { y: 0, opacity: 1, duration: 1.0, delay: 0.35, ease: 'power3.out' });
    }
  }, { threshold: 0.15 });

  marcaIO.observe(marcaSection);
}

// ── Taller schedule formatting ────────────────────────────────────────────
const WEEKDAYS = ['lunes','martes','miercoles','jueves','viernes'];
const MESES    = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

document.querySelectorAll('.taller-dias[data-dias]').forEach(el => {
  const dias = el.dataset.dias ? el.dataset.dias.split(',').map(s => s.trim()) : [];
  const isWeekdays = WEEKDAYS.every(d => dias.includes(d)) && !dias.includes('sabado') && !dias.includes('domingo');
  if (isWeekdays) el.textContent = 'De lunes a viernes';
});

document.querySelectorAll('[data-time]').forEach(el => {
  const [hStr, mStr] = el.dataset.time.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  el.textContent = `${h % 12 || 12}:${mStr} ${ampm}`;
});

document.querySelectorAll('[data-date]').forEach(el => {
  const start = el.dataset.date.split('-').map(Number);
  const startMes = MESES[start[1] - 1];
  const startYear = start[0];

  if (el.dataset.dateFin) {
    const end = el.dataset.dateFin.split('-').map(Number);
    const endMes = MESES[end[1] - 1];
    const endYear = end[0];
    const sameYear = startYear === endYear;
    const label = sameYear
      ? `Talleres semanales de ${startMes} a ${endMes} de ${endYear}`
      : `Talleres semanales de ${startMes} ${startYear} a ${endMes} de ${endYear}`;
    el.textContent = label;
  } else {
    el.textContent = `Talleres semanales de ${startMes} de ${startYear}`;
  }
});

document.querySelectorAll('[data-semana-inicio]').forEach(el => {
  const fmt = d => `${d[2]} de ${MESES[d[1] - 1]}`;
  const start = el.dataset.semanaInicio.split('-').map(Number);
  if (el.dataset.semanaFin) {
    const end = el.dataset.semanaFin.split('-').map(Number);
    el.textContent = `${fmt(start)} – ${fmt(end)}`;
  } else {
    el.textContent = fmt(start);
  }
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

// ── Snipcart: Spanish translations ────────────────────────────────────────
document.addEventListener('snipcart.ready', () => {
  Snipcart.api.session.setLanguage('es', {
    default: { loading: 'Cargando...', error: 'Se ha producido un error.', success: '¡Éxito!' },
    actions: { edit: 'Editar', cancel: 'Cancelar', continue_shopping: 'Seguir comprando', back_to_checkout: 'Volver a pago', checkout: 'Pagar', apply: 'Aplicar', dismiss: 'Descartar', type_address: 'Escribe tu dirección', use_this_address: 'Usar esta dirección', back_to_store: 'Volver a la tienda', close_cart: 'Cerrar carrito', show: 'Mostrar', hide: 'Ocultar', apply_changes: 'Aplicar cambios', yes_use_it: 'Sí, úsalo', save_changes: 'Guardar cambios', back_to_orders: 'Volver a pedidos', change_password: 'Cambiar contraseña', clear_cart: 'Vaciar carrito', add: 'Añadir' },
    header: { title_cart_summary: 'Resumen carrito', loading: 'Cargando...' },
    item: { quantity: 'Cantidad', quantity_short: 'Cant.', decrement_quantity: 'Reducir cantidad', increment_quantity: 'Aumentar cantidad', remove_item: 'Quitar artículo' },
    cart: { subtotal: 'Subtotal', shipping_taxes_calculated_at_checkout: '', loading: 'Estamos preparando tu carrito...', secured_by: 'Asegurado por Snipcart', summary: 'Resumen del pedido', empty: 'Tu carrito está vacío.', invoice_number: 'Factura número', view_detailed_cart: 'Ver detalle del carrito' },
    order: { loading: 'Estamos recuperando los detalles de tu pedido...', title: 'Pedido' },
    discount_box: { promo_code: '¿Código promocional?', promo_code_placeholder: 'Código promocional', promocode_applied: 'Promoción aplicada' },
    address_form: { name: 'Nombre completo', email: 'Email', firstName: 'Nombre', lastName: 'Apellido', address1: 'Dirección', address2: 'Número/Piso', city: 'Ciudad', country: 'País', phone: 'Teléfono', postalCode: 'Código Postal', province: 'Estado / Provincia', dont_see_address: 'No encuentro mi dirección' },
    billing: { title: 'Facturación', address: 'Dirección de Facturación', continue_to_shipping: 'Seguir a envío', use_different_shipping_address: 'Usar una dirección de envío diferente' },
    shipping: { title: 'Envío', shipping_to: 'Enviar a:', address: 'Dirección de envío', method: 'Método de envío' },
    payment: { title: 'Pago', continue_to_payment: 'Continuar a pago', credit_card: 'Tarjeta de Crédito', place_order: 'Confirmar Pedido', preparing_payment_session: 'Preparando pago...', processing_payment: 'Procesando pago...', checkout_with: 'Pagar mediante', no_payment: 'Este pedido no requiere ningún pago.', form: { card_label: 'Tarjeta de Crédito', card_number: 'Número de Tarjeta', card_expiration: 'MM/AA', card_cvv: 'CVV', card_postal_code: 'Código Postal', invalid_number: 'El número de tarjeta no es válido.', invalid_expiration: 'La fecha de caducidad no es válida.', invalid_cvv: 'El CVV no es válido.', invalid_postal_code: 'Código postal no válido' } },
    cart_summary: { taxes: 'Impuestos', total: 'Total', subtotal: 'Subtotal', shipping: 'Envío', discount: 'Descuentos', quantity: 'x', calculated_at_checkout: 'Calculado antes del pago' },
    discounts: { title: 'Descuentos' },
    guest_checkout: { or: 'O', continue_as_a_guest: 'Continuar como invitado' },
    signin_form: { signin: 'Identificarte', dont_have_an_account: '¿No tienes una cuenta?', email: 'Email', password: 'Contraseña', forgot_your_password: '¿Olvidaste tu contraseña?', close_form: 'Volver' },
    register_form: { register: 'Registrarse', already_have_an_account: '¿Ya tienes una cuenta?', email: 'Email', password: 'Contraseña', confirm_password: 'Confirmar contraseña' },
    customer: { information: 'Información de cliente' },
    customer_dashboard: { my_account: 'Mi cuenta', ordered_on: 'Comprado el', price: 'Precio', total: 'Total', status: 'Estado', order_details: 'Detalles del Pedido', loading: 'Cargando...', no_orders: 'No se encontraron pedidos.', view_invoice: 'Ver factura', sign_out: 'Salir', orders: 'Pedidos' },
    confirmation: { thank_you_for_your_order: 'Gracias por tu pedido', async_confirmation_notice: 'Hemos recibido tu pedido y actualmente se está preparando. Recibirás una confirmación en breve.' },
    checkout: { shipping_taxes_calculated_when_address_provided: 'Los gastos de envío e impuestos se calcularán cuando se indique una dirección.' },
    errors: { default: 'Ocurrió un error, inténtelo de nuevo o contáctenos.', required: 'Este campo es obligatorio', email: 'Por favor indique una dirección de correo válida', stringEmpty: 'Este campo es obligatorio', emailEmpty: 'El correo electrónico es obligatorio', promo_code_is_invalid: 'Este código promocional no es válido', promo_code_is_expired: 'Esta promoción ha expirado', card: { invalid_number: 'El número de tarjeta no es válido.', invalid_date: 'La fecha de caducidad no es válida.', invalid_cvv: 'El CVV no es válido.', expired: 'La tarjeta está caducada.', declined: 'La tarjeta ha sido rechazada.' } },
    digital_goods: { download: 'Descargar' },
    shippingRates: { loading: 'Cargando...' },
  });
});

// ── Snipcart: 10% discount when 2+ talleres in cart ───────────────────────
const DISCOUNT_ID = 'descuento-verano-10pct';
let syncingDiscount = false;

function onCartItemChange() {
  if (syncingDiscount) return;
  syncDiscount();
}

async function syncDiscount() {
  syncingDiscount = true;
  try {
    const state     = Snipcart.store.getState();
    const all       = state.cart.items.items ?? [];
    const real      = all.filter(i => i.id !== DISCOUNT_ID);
    const existing  = all.find(i => i.id === DISCOUNT_ID);
    const count     = real.length;
    const subtotal  = real.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount  = parseFloat((subtotal * 0.1).toFixed(2));

    if (existing) await Snipcart.api.items.remove(existing.uniqueId);

    if (count >= 2) {
      await Snipcart.api.items.add({
        id:       DISCOUNT_ID,
        name:     'Descuento por 2 talleres (10%)',
        price:    -discount,
        url:      window.location.pathname,
        quantity: 1,
      });
    }
  } finally {
    syncingDiscount = false;
  }
}

document.addEventListener('snipcart.ready', () => {
  Snipcart.events.on('item.added',   onCartItemChange);
  Snipcart.events.on('item.removed', onCartItemChange);
  Snipcart.events.on('item.updated', onCartItemChange);
});

