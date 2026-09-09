import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(SplitText, ScrollTrigger);

// ── Reproductor de animaciones dotLottie ───────────────────────────────────
// Define <dotlottie-wc>, que es lo que usa el mundo de El Viaje. No sirve el
// <dotlottie-player> de antes: aquel sólo lee archivos .lottie de la versión 1
// y falla con un "no animation selected" ante los de la versión 2, que es lo
// que exportan las herramientas actuales. Éste lee .json y .lottie v1 y v2.
import { setWasmUrl } from '@lottiefiles/dotlottie-wc';
// El runtime va en WebAssembly y por defecto se lo pide a jsdelivr. Lo servimos
// nosotros: `?url` hace que Vite lo copie al build con su hash y devuelva la
// ruta buena, así el sitio no depende de un CDN ajeno.
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url';
setWasmUrl(wasmUrl);

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
    // Un inline-block descarta su espacio final. Si el <strong> termina en espacio
    // (el editor suele dejarlo dentro de la negrita: "…de cine </strong>y"), al
    // cambiar el display se pegaría con la palabra siguiente → "ciney".
    // Lo movemos fuera antes de tocar el display. Es idempotente: en la segunda
    // pasada ya no hay espacio final que mover.
    const ultimo = el.lastChild;
    if (ultimo && ultimo.nodeType === Node.TEXT_NODE && /\s$/.test(ultimo.nodeValue)) {
      ultimo.nodeValue = ultimo.nodeValue.replace(/\s+$/, '');
      el.parentNode.insertBefore(document.createTextNode(' '), el.nextSibling);
    }

    el.style.position = 'relative';
    el.style.display  = 'inline-block';
    // El círculo va DETRÁS del texto, y para eso hace falta que la negrita sea
    // su propio contexto de apilado. Con `z-index: -1` a secas el SVG no se
    // quedaría detrás de la palabra: se iría detrás también del fondo del marco
    // y del video, y desaparecería. Dándole aquí un z-index, el -1 del SVG sólo
    // cuenta dentro de esta palabra: pinta por debajo de sus letras y por encima
    // de todo lo que hay detrás.
    el.style.zIndex   = '0';

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
    svg.style.cssText = `position:absolute;left:${-padX}px;top:${-padY}px;width:${w}px;height:${h}px;pointer-events:none;overflow:visible;z-index:-1;`;

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
  // Una posición por PANEL (no por diapositiva del CMS): las diapositivas de los
  // niveles y de las gorras se renderizan juntas en un solo panel, así que la
  // posición que era de las gorras ({ x: '32vw', y: '38vh' }) ya no se usa.
  // En el panel fusionado el mundo va abajo a la derecha, y las gorras + su texto
  // ocupan la media columna izquierda (ver home.antlers.html).
  const allFramePositions = [
    { x: '35vw',  y: '-5vh',  scale: 1    },
    { x: '-30vw', y: '25vh',  scale: 1    },
    { x: '34vw',  y: '62vh',  scale: 1    },
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
  // Una escala por PANEL (ver allFramePositions: niveles + gorras van juntas).
  const mScales = [1.0, 1.25, 1.25, 1.25, 1.0];

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
  // Las tarjetas de la home lo usan en medio de una frase, así que pueden pedir
  // su propia redacción con data-dias-texto.
  if (isWeekdays) el.textContent = el.dataset.diasTexto || 'De lunes a viernes';
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

// Separador de miles. Los precios se guardan planos (1500) porque ese mismo número
// va en data-item-price de Snipcart; aquí sólo se formatea para mostrarlo.
document.querySelectorAll('[data-precio]').forEach(el => {
  const n = Number(el.dataset.precio);
  if (Number.isFinite(n)) el.textContent = n.toLocaleString('es-MX');
});

// Fecha suelta en español: "19 de septiembre". El formateador de PHP devuelve el
// mes en inglés, así que la componemos aquí como el resto de fechas del sitio.
document.querySelectorAll('[data-fecha-larga]').forEach(el => {
  const [, mes, dia] = el.dataset.fechaLarga.split('-').map(Number);
  if (MESES[mes - 1]) el.textContent = `${dia} de ${MESES[mes - 1]}`;
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

// Cada retícula lleva su propio observador: la home ya tiene varias (zonas,
// galería de animautas, preguntas frecuentes) y con un solo querySelector las
// demás se quedaban sin entrada.
document.querySelectorAll('[data-stagger-cards]').forEach((staggerGrid) => {
  const staggerCards = staggerGrid.querySelectorAll('[data-stagger-child]');
  if (!staggerCards.length) return;
  gsap.set(staggerCards, { opacity: 0, y: 36 });
  const staggerIO = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    gsap.to(staggerCards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
    staggerIO.disconnect();
  }, { threshold: 0.1 });
  staggerIO.observe(staggerGrid);
});

// ── Disponibilidad según el inventario de Snipcart ─────────────────────────
// Fuente única de verdad para los lugares: se apagan los botones sin stock y se
// escribe el "Quedan N lugares" de las tarjetas. Si el inventario no responde o
// el producto no lleva control de stock, no se afirma nada.
const tallerBuyBtns = document.querySelectorAll('.snipcart-add-item[data-item-categories*="taller"]');
const lugaresEls    = document.querySelectorAll('[data-lugares]');

if (tallerBuyBtns.length || lugaresEls.length) {
  fetch('/api/snipcart/stock')
    .then((r) => r.json())
    .then((stock) => {
      tallerBuyBtns.forEach((btn) => {
        const id = btn.getAttribute('data-item-id');
        const s = stock[id];
        if (typeof s === 'number' && s <= 0) {
          btn.classList.remove('snipcart-add-item');
          btn.classList.add('animondo-agotado');
          btn.setAttribute('disabled', 'disabled');
          btn.textContent = 'Lugares agotados';
        }
      });

      lugaresEls.forEach((el) => {
        const s = stock[el.dataset.lugares];
        if (typeof s !== 'number') return;
        if (s > 0) {
          el.textContent = `Quedan ${s} ${s === 1 ? 'lugar' : 'lugares'}`;
        } else {
          el.textContent = 'Lugares agotados';
          el.classList.add('opacity-60');
        }
      });
    })
    .catch(() => {});
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

// ── Snipcart: idioma español ──────────────────────────────────────────────
// Fuente única: public/snipcart-es.json (antes había además un objeto inline
// aquí, desactualizado, que competía con el JSON en el mismo evento).
document.addEventListener('snipcart.ready', () => {
  fetch('/snipcart-es.json')
    .then(r => r.json())
    .then(es => Snipcart.api.session.setLanguage('es', es))
    .catch(() => {});
});

// ── Snipcart: transporte como producto aparte + desglose de la cuenta ─────
document.addEventListener('snipcart.ready', () => {
  const TRANSPORTE_INFO = '<strong>Paquete Animondo Express</strong><br>Transporte seguro. Los puntos de encuentro y horarios serán definidos antes del sábado previo a tu taller y confirmados por WhatsApp.';

  function cartItems() {
    try { return Snipcart.store.getState().cart.items.items || []; }
    catch (e) { return []; }
  }

  // Enlace "+ Agregar transporte" bajo cada taller que lo tenga disponible.
  function renderTransporteLinks() {
    const items = cartItems();

    document.querySelectorAll('.snipcart-item-line__title').forEach(titleEl => {
      // Apila el bloque a lo ancho dentro de la columna del producto (no en el flex del container)
      const line = titleEl.closest('.snipcart-item-line__product')
        || titleEl.closest('.snipcart-item-line__container')
        || titleEl.parentElement;
      if (!line) return;

      const title = (titleEl.textContent || '').trim();

      // Empareja la fila del carrito con su item del store (por nombre)
      const item  = items.find(i => (i.name || '').trim() === title) || null;
      const price = item && item.metadata ? item.metadata.transportePrice : null;

      const existing = line.querySelector('.animondo-transporte-add');

      // No es un taller con transporte disponible → nada
      if (!item || !price) { if (existing) existing.remove(); return; }

      // ¿el transporte de este taller ya está en el carrito?
      const transId = 'transporte-' + item.id;
      if (items.some(it => it.id === transId)) { if (existing) existing.remove(); return; }

      if (existing) return; // ya inyectado

      const box = document.createElement('div');
      box.className = 'animondo-transporte-add';
      box.innerHTML = TRANSPORTE_INFO
        + '<label class="animondo-cp-label">Colonia o Código Postal</label>'
        + '<input type="text" class="animondo-transporte-cp" placeholder="Colonia o Código Postal">'
        + '<a role="button">+ Agregar transporte (+$' + price + ' MXN)</a>';

      const cpInput = box.querySelector('.animondo-transporte-cp');

      box.querySelector('a').addEventListener('click', () => {
        const cp = (cpInput.value || '').trim();
        if (!cp) {
          cpInput.classList.add('animondo-cp-error');
          cpInput.focus();
          return;
        }
        Snipcart.api.cart.items.add({
          id:       transId,
          name:     'Transporte Animondo Express — ' + item.name,
          price:    price,
          url:      item.url,
          quantity: 1,
          customFields: [
            { name: 'Colonia o Código Postal', value: cp }
          ],
        });
      });

      cpInput.addEventListener('input', () => cpInput.classList.remove('animondo-cp-error'));

      line.appendChild(box);
    });
  }

  // ── Desglose de la cuenta antes del botón Pagar ──
  function money(n) {
    return '$' + (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';
  }

  function desgloseRow(label, amount, extraClass) {
    return '<div class="animondo-desglose__row ' + (extraClass || '') + '"><span>' + label + '</span><span>' + money(amount) + '</span></div>';
  }

  function snipcartTotal() {
    try {
      const c = Snipcart.store.getState().cart;
      return [c.total, c.grandTotal, c.finalTotal].find(v => typeof v === 'number' && isFinite(v)) ?? null;
    } catch (e) { return null; }
  }

  function renderDesglose() {
    const footerBtns = document.querySelector('.snipcart-cart__footer-buttons');
    const existing   = document.querySelector('.animondo-desglose');
    const items      = cartItems();
    if (!footerBtns || !items.length) { if (existing) existing.remove(); return; }

    let tallerSum = 0, transporteSum = 0;
    items.forEach(it => {
      const line = (it.price || 0) * (it.quantity || 1);
      if (String(it.id).indexOf('transporte-') === 0) transporteSum += line;
      else tallerSum += line;
    });

    const itemsSum  = tallerSum + transporteSum;
    let   total     = snipcartTotal();
    if (!(total > 0)) total = itemsSum;
    const descuento = Math.max(0, Math.round((itemsSum - total) * 100) / 100);

    let box = existing;
    if (!box) {
      box = document.createElement('div');
      box.className = 'animondo-desglose';
      footerBtns.parentNode.insertBefore(box, footerBtns);
    }

    let rows = desgloseRow('Talleres', tallerSum);
    if (descuento > 0)     rows += desgloseRow('Descuento', -descuento);
    if (transporteSum > 0) rows += desgloseRow('Transporte', transporteSum);
    rows += desgloseRow('Total', total, 'animondo-desglose__total');
    box.innerHTML = rows;
  }

  function renderAll() { renderTransporteLinks(); renderDesglose(); }

  if (Snipcart.store && Snipcart.store.subscribe) {
    Snipcart.store.subscribe(renderAll);
  }

  let raf = null;
  new MutationObserver(() => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; renderAll(); });
  }).observe(document.body, { childList: true, subtree: true });

  renderAll();
});

// ── Snipcart: 10% al llevar 2+ talleres de verano ─────────────────────────
// Sólo cuenta artículos de categoría `taller` (el taller de verano). Antes contaba
// cualquier artículo, así que un taller + su transporte ya disparaban el descuento,
// y al volver los sabatinos productos también lo habrían disparado. Los sabatinos
// usan la categoría `taller-sabatino` y su ahorro va en el precio del trimestre.
const DISCOUNT_ID = 'descuento-verano-10pct';
const CATEGORIA_DESCUENTO = 'taller';
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
    const real      = all.filter(i => i.id !== DISCOUNT_ID && (i.categories || []).includes(CATEGORIA_DESCUENTO));
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


// ── Galerías con carrusel y lightbox ───────────────────────────────────────
// Un solo componente para las dos galerías de la home: Espacios (fotos) y
// Trabajos (videos). El carrusel se apoya en scroll-snap, así que el swipe en
// táctil ya lo resuelve el navegador; aquí sólo van las flechas, los puntos y
// el lightbox. El lightbox recorre TODOS los elementos de su galería, no sólo
// los de la diapositiva visible.
const galerias = Array.from(document.querySelectorAll('[data-galeria]'));

if (galerias.length) {
  // Las vistas previas nacen con preload="none" (son varios MB por video) y
  // sólo piden metadata cuando la tarjeta se acerca a la pantalla. Como el
  // track recorta horizontalmente, las diapositivas siguientes no intersectan
  // hasta que el usuario navega hacia ellas.
  //
  // Esto sólo ahorra algo si el MP4 lleva su átomo `moov` al principio
  // (`ffmpeg -movflags +faststart`). Si va al final, que es como salen de casi
  // cualquier editor, el navegador tiene que descargar el archivo ENTERO para
  // leer la metadata, y pedir el primer fotograma acaba costando lo mismo que
  // reproducir el video. Los diez de la home ya vienen convertidos; los que se
  // suban después desde el CP hay que pasarlos por lo mismo.
  const previewIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      target.preload = 'metadata';
      target.load();
      obs.unobserve(target);
    });
  }, { rootMargin: '200px' });

  // ── Lightbox compartido ──
  // Trabaja con descriptores planos ({ tipo, src, alt, pie }) y no con nodos,
  // porque el conjunto que abre una tarjeta no siempre son sus hermanas: en
  // Trabajos es la galería entera, y en Espacios cada zona trae la suya.
  let lb = null;          // el nodo, construido la primera vez que se abre
  let lbItems = [];       // los descriptores del conjunto en curso
  let lbIndex = 0;
  let lbFocoPrevio = null;
  let lbOverflow = '';

  function construirLightbox() {
    const el = document.createElement('div');
    el.className = 'galeria-lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Galería');
    el.hidden = true;
    el.innerHTML = `
      <button type="button" class="galeria-lb-cerrar" data-lb-cerrar aria-label="Cerrar">&times;</button>
      <button type="button" class="galeria-lb-nav galeria-lb-prev" data-lb-prev aria-label="Anterior">&#8249;</button>
      <div class="galeria-lb-stage" data-lb-stage></div>
      <button type="button" class="galeria-lb-nav galeria-lb-next" data-lb-next aria-label="Siguiente">&#8250;</button>
      <p class="galeria-lb-pie" data-lb-pie hidden></p>
      <p class="galeria-lb-cuenta" data-lb-cuenta></p>`;
    document.body.appendChild(el);

    el.querySelector('[data-lb-cerrar]').addEventListener('click', cerrarLightbox);
    el.querySelector('[data-lb-prev]').addEventListener('click', () => mover(-1));
    el.querySelector('[data-lb-next]').addEventListener('click', () => mover(1));

    // Clic en el fondo cierra; clic en la imagen o el video, no.
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target === el.querySelector('[data-lb-stage]')) cerrarLightbox();
    });

    // Con el foco dentro del <video>, las flechas son para buscar en la pista:
    // ahí no se navega la galería. Escape siempre cierra.
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { cerrarLightbox(); return; }
      if (e.target.tagName === 'VIDEO') return;
      if (e.key === 'ArrowLeft')  mover(-1);
      if (e.key === 'ArrowRight') mover(1);
    });

    // Swipe, salvo sobre el video (ahí el gesto es para sus controles).
    let x0 = null;
    el.addEventListener('touchstart', (e) => {
      x0 = e.target.closest('video') ? null : e.touches[0].clientX;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });

    return el;
  }

  function limpiarEscenario(stage) {
    // Quitar el <video> del DOM no siempre corta la descarga: hay que pausarlo
    // y vaciarle el src antes de tirarlo.
    const previo = stage.querySelector('video');
    if (previo) {
      previo.pause();
      previo.removeAttribute('src');
      previo.load();
    }
    stage.replaceChildren();
  }

  function pintarLightbox() {
    const item  = lbItems[lbIndex];
    const stage = lb.querySelector('[data-lb-stage]');
    limpiarEscenario(stage);

    if (item.tipo === 'video') {
      const video = document.createElement('video');
      video.src         = item.src;
      video.controls    = true;
      video.playsInline = true;
      video.preload     = 'auto';
      stage.appendChild(video);
      // Se abrió por un clic, así que normalmente el navegador deja arrancar
      // con sonido. Si lo bloquea, quedan los controles.
      video.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || '';
      stage.appendChild(img);
    }

    const pie = lb.querySelector('[data-lb-pie]');
    pie.textContent = item.pie || '';
    pie.hidden = !item.pie;

    lb.querySelector('[data-lb-cuenta]').textContent = `${lbIndex + 1} / ${lbItems.length}`;

    const solaUna = lbItems.length < 2;
    lb.querySelector('[data-lb-prev]').hidden = solaUna;
    lb.querySelector('[data-lb-next]').hidden = solaUna;
  }

  function mover(paso) {
    lbIndex = (lbIndex + paso + lbItems.length) % lbItems.length;
    pintarLightbox();
  }

  function abrirLightbox(items, indice) {
    lb = lb || construirLightbox();
    lbItems = items;
    lbIndex = indice;
    lbFocoPrevio = document.activeElement;

    lb.hidden = false;
    pintarLightbox();
    // Un frame para que la transición de opacidad tenga de dónde salir.
    requestAnimationFrame(() => lb.classList.add('is-open'));

    lbOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lb.querySelector('[data-lb-cerrar]').focus();
  }

  function cerrarLightbox() {
    if (!lb || lb.hidden) return;
    limpiarEscenario(lb.querySelector('[data-lb-stage]'));
    lb.classList.remove('is-open');
    lb.hidden = true;
    document.body.style.overflow = lbOverflow;
    if (lbFocoPrevio) lbFocoPrevio.focus();
  }

  // ── Carrusel ──
  // Sin flechas: se cambia de diapositiva con el dedo (el scroll-snap del
  // navegador), arrastrando con el mouse, o con los puntos.
  galerias.forEach((galeria) => {
    const track  = galeria.querySelector('[data-galeria-track]');
    const slides = Array.from(track.querySelectorAll('.galeria-slide'));
    const items  = Array.from(galeria.querySelectorAll('[data-galeria-item]'));
    const puntos = galeria.querySelector('[data-galeria-puntos]');

    track.querySelectorAll('[data-galeria-preview]').forEach((v) => previewIO.observe(v));

    const descriptor = (el) => ({
      tipo: el.dataset.tipo,
      src:  el.dataset.src,
      alt:  el.dataset.alt,
      pie:  el.dataset.pie,
    });

    // Qué se abre al hacer clic en una tarjeta. Si la tarjeta trae fotos
    // propias escondidas es una portada: abre SU galería, con la portada al
    // frente. Si no, abre la galería entera empezando por ella misma.
    function conjuntoDe(item) {
      const propias = item.querySelectorAll('[data-galeria-foto]');
      if (!propias.length) return null;

      const portada = descriptor(item);
      const lista   = [portada];
      propias.forEach((f) => {
        // Repetir la portada dentro del campo es el error fácil de cometer
        // desde el CP, y saldría dos veces seguidas.
        if (f.dataset.src === portada.src) return;
        lista.push({ tipo: 'imagen', src: f.dataset.src, alt: f.dataset.alt, pie: portada.pie });
      });
      return lista;
    }

    // Un punto por foto sobre la portada, para que se vea cuántas hay sin
    // necesidad de leer nada. Se cuentan aquí porque `| count` no funciona sobre
    // el query builder de un campo `assets`, y porque hay que descontar la
    // portada si además viene repetida dentro del campo.
    //
    // El número deja de estar escrito, así que se le pasa al `aria-label` del
    // botón: los puntos son decorativos y quien navega por voz se quedaría sin
    // saber cuántas fotos va a abrir.
    items.forEach((item) => {
      const fila = item.querySelector('[data-galeria-bolitas]');
      if (!fila) return;
      const propio = conjuntoDe(item);
      if (!propio || propio.length < 2) {
        // Una sola foto no es una galería: ni puntos ni velo.
        fila.remove();
        item.querySelector('.galeria-vermas')?.remove();
        return;
      }
      propio.forEach((_, i) => {
        const punto = document.createElement('span');
        punto.className = 'galeria-bolita';
        if (i === 0) punto.setAttribute('aria-current', 'true');
        fila.appendChild(punto);
      });
      const etiqueta = item.getAttribute('aria-label');
      if (etiqueta) item.setAttribute('aria-label', `${etiqueta} (${propio.length} fotos)`);
    });

    // Firefox ignora `-webkit-user-drag`, así que las imágenes se desactivan
    // también por atributo: si no, arrastrar una arranca un drag-and-drop del
    // navegador y se pierde el gesto.
    track.querySelectorAll('img').forEach((img) => { img.draggable = false; });

    // Un arrastre que recorrió medio carrusel termina en un `click` sobre la
    // tarjeta que quedó bajo el cursor. Ese no debe abrir el lightbox.
    let recorrido = 0;
    const galeriaEntera = items.map(descriptor);

    items.forEach((item, i) => item.addEventListener('click', () => {
      // La marca se consume aquí: así el siguiente clic (o un Enter desde el
      // teclado, que no pasa por pointerdown) no se queda bloqueado.
      if (recorrido > 8) { recorrido = 0; return; }
      const propio = conjuntoDe(item);
      if (propio) abrirLightbox(propio, 0);
      else abrirLightbox(galeriaEntera, i);
    }));

    // Con una sola diapositiva no hay nada que navegar.
    if (slides.length < 2) {
      if (puntos) puntos.setAttribute('hidden', '');
      return;
    }

    let actual = 0;

    function irA(i) {
      track.scrollTo({ left: track.clientWidth * i, behavior: 'smooth' });
    }

    const bolitas = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'galeria-punto';
      b.setAttribute('aria-label', `Ir al grupo ${i + 1} de ${slides.length}`);
      b.addEventListener('click', () => irA(i));
      puntos.appendChild(b);
      return b;
    });

    function sincronizar() {
      // La diapositiva activa es la que quedó más cerca del borde izquierdo.
      actual = Math.min(Math.max(Math.round(track.scrollLeft / track.clientWidth), 0), slides.length - 1);
      bolitas.forEach((b, i) => b.setAttribute('aria-current', String(i === actual)));
    }

    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sincronizar);
    }, { passive: true });
    window.addEventListener('resize', sincronizar);

    // ── Arrastre con el mouse ──
    // En táctil no se toca nada: el scroll-snap ya da el swipe, y meterse ahí
    // sólo rompería el desplazamiento vertical de la página.
    track.classList.add('es-arrastrable');

    let arrastrando = false;
    let xInicio     = 0;
    let scrollIni   = 0;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      arrastrando = true;
      recorrido   = 0;
      xInicio     = e.clientX;
      scrollIni   = track.scrollLeft;
      // El snap y el scroll suave pelean con mover `scrollLeft` a mano: se
      // apagan mientras dura el gesto y vuelven al soltar.
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
      track.classList.add('esta-arrastrando');
    });

    // En window y no en el track: si el cursor se sale del carrusel a media
    // pasada, el gesto tiene que seguir vivo.
    window.addEventListener('pointermove', (e) => {
      if (!arrastrando) return;
      const dx  = e.clientX - xInicio;
      recorrido = Math.max(recorrido, Math.abs(dx));
      track.scrollLeft = scrollIni - dx;
    });

    function soltar() {
      if (!arrastrando) return;
      arrastrando = false;
      track.classList.remove('esta-arrastrando');
      track.style.scrollBehavior = '';
      track.style.scrollSnapType = '';
      // Devolver el snap no siempre re-encaja solo, así que se encaja a mano.
      irA(Math.round(track.scrollLeft / track.clientWidth));
    }

    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);

    sincronizar();
  });
}

// ── El Viaje (lotties) ─────────────────────────────────────────────────────
// Enciende una escena u otra según por dónde va el scroll dentro de la sección.
// A propósito no se toca el evento `wheel`: el otro viaje (#circle-scroll-wrapper)
// sí lo secuestra, y dos manejadores peleándose por el mismo gesto es justo lo
// que hay que evitar teniendo las dos secciones en la misma página. Aquí el
// scroll es el del navegador y esto sólo lo observa.
const viajeL = document.querySelector('[data-viaje-lotties]');

if (viajeL) {
  const escenas = Array.from(viajeL.querySelectorAll('[data-viaje-l-escena]'));

  if (escenas.length) {
    let actual = 0;
    let primeraPintada = false;
    let enPantalla = false;

    // ── Las tomas ──────────────────────────────────────────────────────────
    // Cuando la escena trae video manda él y el mundo de abajo sobra: el
    // acercamiento, el giro y el recorrido desde la escena anterior vienen ya
    // dentro de la propia toma. Aquí sólo hay que arrancarla y pararla.
    const videos = escenas.map((e) => e.querySelector('[data-viaje-l-video]'));

    // Las tomas que abren con un movimiento de cámara sólo lo enseñan la primera
    // vuelta: al acabar vuelven al segundo marcado, no al principio. El `loop` del
    // navegador no sirve para esto —siempre reinicia desde cero—, así que esas
    // vienen sin él y el ciclo lo cierra este manejador. Volver atrás sale barato
    // porque las tomas están codificadas con todos los fotogramas clave: el salto
    // no obliga a decodificar desde ningún sitio anterior.
    //
    // OJO al probarlo en local: `php artisan serve` contesta 200 a las peticiones
    // por rango y no manda `Accept-Ranges`, así que el navegador marca el video
    // como no buscable —`seekable` acaba en 0 aunque esté entero descargado— e
    // ignora este salto. La toma vuelve entonces al principio y parece que esto
    // no funciona. Con un servidor que sí sirva rangos, que es cualquiera de
    // verdad, va. Y si alguno no los sirviera, el peor caso es volver al
    // principio: se repetiría la transición, que es como estaba antes.
    // Saltar en el tiempo sólo funciona si quien sirve el video atiende peticiones
    // por rango de bytes. Si no las atiende, el navegador marca la toma como no
    // buscable —`seekable` acaba en 0 aunque esté entera descargada— y se traga
    // el salto sin avisar: la transición volvería a verse en cada vuelta. Cuando
    // se detecta ese caso se vuelve a pedir el archivo y se le entrega al
    // elemento como blob, que siempre es buscable. Cuesta una descarga de más,
    // pero sólo ocurre donde hace falta; con un servidor que sirva rangos esto
    // no llega a dispararse.
    function hacerBuscable(v) {
      if (v.dataset.blob) return;
      if (v.seekable.length && v.seekable.end(v.seekable.length - 1) > 0) return;
      v.dataset.blob = '1';
      fetch(v.currentSrc || v.src)
        .then((r) => r.blob())
        .then((b) => {
          const sonaba = !v.paused;
          v.src = URL.createObjectURL(b);
          if (sonaba) v.play().catch(() => {});
        })
        .catch(() => {});
    }

    videos.forEach((v) => {
      if (!v) return;
      const desde = parseFloat(v.dataset.bucle);
      if (!Number.isFinite(desde) || desde <= 0) return;

      v.addEventListener('loadeddata', () => hacerBuscable(v));

      v.addEventListener('ended', () => {
        // Si el punto cayera fuera de la toma, mejor repetirla entera que
        // quedarse en un fotograma congelado.
        v.currentTime = desde < v.duration ? desde : 0;
        v.play().catch(() => {});
      });
    });

    // Se pide la toma de la escena siguiente en cuanto se enciende la actual,
    // para que esté lista cuando el scroll llegue. Todas de golpe al cargar la
    // página son quince megas ocupando la conexión sin que nadie las esté
    // mirando todavía.
    function precargar(i) {
      const v = videos[i];
      if (!v || v.preload === 'auto') return;
      v.preload = 'auto';
      v.load();
    }

    function reproducir(i) {
      videos.forEach((v, j) => {
        if (!v) return;
        if (j !== i) { v.pause(); return; }
        // Desde el principio: la toma abre con el movimiento de cámara que
        // viene de la escena anterior, y entrar a mitad se salta justo eso.
        v.currentTime = 0;
        // Sin esto el navegador rechaza el arranque automático. Y `play()`
        // devuelve una promesa que se rompe sola si la escena cambia antes de
        // que llegue a sonar: no es un error que haya que atender.
        v.muted = true;
        v.play().catch(() => {});
      });
      precargar(i + 1);
    }

    // El mundo es uno solo para todas las escenas: cambiar de escena no cambia
    // de imagen, mueve ésta. De ahí que la transición sea un desplazamiento y
    // no un fundido.
    const mundo = viajeL.querySelector('.viaje-l-anim');

    // Lo coloca dentro de su caja: lo ajusta como haría `contain`, le aplica el
    // acercamiento de la escena, lo endereza y planta el punto de foco donde
    // diga la escena. Va en JS y no en CSS porque hace falta el tamaño real con
    // el que se pinta —que depende de la caja— para saber cuánto desplazar.
    // El lienzo de la animación. Un <img> lo diría con `naturalWidth`, pero el
    // reproductor de dotLottie no expone nada parecido, así que viene en
    // atributos desde la plantilla.
    const anchoMundo = parseFloat(mundo?.dataset.ancho) || 1920;
    const altoMundo  = parseFloat(mundo?.dataset.alto) || 1080;

    function encuadrar(escena, animado) {
      if (!mundo || !escena) return;
      const caja = mundo.parentElement;
      const cw = caja.clientWidth, ch = caja.clientHeight;
      if (!cw || !ch) return;

      const zoom = parseFloat(escena.dataset.zoom) || 1;
      const fx = (parseFloat(escena.dataset.focoX) || 50) / 100;
      const fy = (parseFloat(escena.dataset.focoY) || 50) / 100;
      const giro = parseFloat(escena.dataset.rotacion) || 0;
      const cx = (parseFloat(escena.dataset.centroX) || 50) / 100;
      const cy = (parseFloat(escena.dataset.centroY) || 50) / 100;

      const escala = Math.min(cw / anchoMundo, ch / altoMundo) * zoom;
      const w = anchoMundo * escala;
      const h = altoMundo * escala;

      // El giro va siempre sobre el centro de la imagen, y es el desplazamiento
      // el que compensa para dejar la zona enfocada donde toca. Girar sobre el
      // propio punto de foco sería más directo de escribir, pero obliga a mover
      // el `transform-origin` en cada escena, y eso no se interpola: cambia de
      // golpe, y con una rotación ya aplicada el mundo pega un salto al empezar
      // la transición. Se notaba al volver de una escena girada a otra que no
      // lo estaba.
      //
      // Dónde cae el foco respecto al centro, una vez girado:
      const rad = giro * Math.PI / 180;
      const dx = fx * w - w / 2;
      const dy = fy * h - h / 2;
      const gx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const gy = dx * Math.sin(rad) + dy * Math.cos(rad);
      // Se coloca el centro de modo que el foco caiga en el punto pedido.
      const x = cw * cx - gx - w / 2;
      const y = ch * cy - gy - h / 2;

      mundo.style.visibility = 'visible';
      const destino = {
        width: w, height: h, x, y,
        rotation: giro,
        transformOrigin: '50% 50%',
      };
      if (animado) gsap.to(mundo, { ...destino, duration: 1.1, ease: 'power2.inOut' });
      else gsap.set(mundo, destino);
    }

    // El reproductor tarda en arrancar (baja su runtime en WebAssembly), así que
    // se reencuadra cuando avisa de que está listo. El evento no está garantizado
    // en todas las versiones, de ahí el reintento por si acaso.
    if (mundo) {
      mundo.addEventListener('dotlottie-load', () => encuadrar(escenas[actual], false));
      setTimeout(() => encuadrar(escenas[actual], false), 1200);
    }

    // Las negritas del título llevan el mismo adorno que en el viaje anterior:
    // a una la rodea un círculo dibujándose y a la siguiente la subraya un
    // trazo de marcador, alternando. El retardo es más corto que el de allí
    // (1.1 s) porque aquí el texto no entra con su propia animación: sólo se
    // espera a que termine el fundido de la escena.
    function pintarEscena(i) {
      if (i === actual && primeraPintada) return;
      if (escenas[actual] && i !== actual) {
        escenas[actual].classList.remove('esta-activa');
        animateAnnotations(escenas[actual], false);
      }
      escenas[i]?.classList.add('esta-activa');
      // `primeraPintada` distingue el arranque —donde el mundo se coloca de
      // golpe— de un cambio de escena, que sí se recorre.
      if (escenas[i]) { encuadrar(escenas[i], primeraPintada); animateAnnotations(escenas[i], true, 0.5); }
      reproducir(i);
      actual = i;
      primeraPintada = true;
    }

    function alScroll() {
      const r = viajeL.getBoundingClientRect();
      const seVe = r.top < window.innerHeight && r.bottom > 0;

      // Fuera de pantalla las tomas se paran: van en bucle, y si no seguirían
      // gastando en decodificar algo que nadie está viendo.
      if (!seVe) {
        if (enPantalla) { videos.forEach((v) => v && v.pause()); enPantalla = false; }
        return;
      }
      // Al volver a asomar hay que rearrancar la de la escena en curso, que
      // `pintarEscena` no lo hará: para él la escena no ha cambiado.
      if (!enPantalla) { enPantalla = true; if (primeraPintada) reproducir(actual); }

      // La primera escena ya viene marcada como activa desde la plantilla, así
      // que su adorno hay que dispararlo a mano —y sólo cuando la sección
      // asoma, no al cargar la página, o se lo pierde quien aún no ha bajado.
      if (!primeraPintada) pintarEscena(0);
      // Cuánto se lleva recorrido de la sección, de 0 a 1. El recorrido útil es
      // su alto menos una pantalla, que es lo que el sticky se queda quieto.
      const recorrido = viajeL.offsetHeight - window.innerHeight;
      if (recorrido <= 0) return;
      const avance = Math.min(Math.max(-r.top / recorrido, 0), 1);
      // El 0.999 evita que al tocar el final justo se salga del array.
      pintarEscena(Math.floor(avance * escenas.length * 0.999));
    }

    let pendiente = 0;
    window.addEventListener('scroll', () => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(alScroll);
    }, { passive: true });
    window.addEventListener('resize', () => { alScroll(); encuadrar(escenas[actual], false); });

    alScroll();
  }
}
