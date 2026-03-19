import { gsap } from 'gsap';
import { PROJECTS } from '../scenes.js';

// ─── Project panel ────────────────────────────────────────────────────────────

export function openProjectPanel(projectId) {
  const panel = document.getElementById('project-panel');
  if (!panel) return;

  const data = PROJECTS[projectId];
  if (!data) return;

  panel.querySelector('.pp-title').textContent = data.title;
  panel.querySelector('.pp-hook').textContent  = data.hook;

  // Tech icons (new .pp-icons element)
  panel.querySelector('.pp-icons').innerHTML = (data.icons || [])
    .map(src => `<img src="${src}" alt="" class="pp-icon">`)
    .join('');

  // Screenshots with click-to-lightbox
  const shots = panel.querySelector('.pp-screenshots');
  shots.innerHTML = data.screenshots
    .map(s => `<img src="${s}" alt="${data.title}" class="pp-screenshot" data-src="${s}">`)
    .join('');
  shots.querySelectorAll('.pp-screenshot').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.dataset.src));
  });

  // External link
  const link = panel.querySelector('.pp-link');
  if (data.link) {
    link.href = data.link;
    link.querySelector('.pp-link-label').textContent = data.linkLabel;
    link.style.display = 'inline-flex';
  } else {
    link.style.display = 'none';
  }

  panel.style.pointerEvents = 'all';

  const h = panel.offsetHeight || 130;
  gsap.fromTo(panel,
    { y: h, autoAlpha: 0 },
    { y: 0,  autoAlpha: 1, duration: 0.5, ease: 'power3.out' },
  );
}

export function closeProjectPanel() {
  const panel = document.getElementById('project-panel');
  if (!panel) return;
  const h = panel.offsetHeight || 200;
  gsap.to(panel, {
    y: h,
    autoAlpha: 0,
    duration: 0.35,
    ease: 'power3.in',
    onComplete: () => {
      panel.style.pointerEvents = 'none';
    },
  });
}

// ─── About overlay ────────────────────────────────────────────────────────────
// Pure CSS transitions — no GSAP, no delay, instant response on close.

export function openAbout() {
  const el = document.getElementById('about-overlay');
  if (!el) return;
  el.style.pointerEvents = 'all';
  // Force reflow so transition fires from the closed state
  el.getBoundingClientRect();
  el.classList.add('about-visible');
}

export function closeAbout() {
  const el = document.getElementById('about-overlay');
  if (!el) return;
  el.classList.remove('about-visible');
  el.style.pointerEvents = 'none';
}

// ─── Screenshot lightbox ──────────────────────────────────────────────────────

function openLightbox(src) {
  const lb  = document.getElementById('pp-lightbox');
  const img = document.getElementById('pp-lightbox-img');
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add('lb-open');
  lb.addEventListener('click', closeLightbox, { once: true });
  window.addEventListener('keydown', _lbKeyClose, { once: true });
}

function closeLightbox() {
  const lb = document.getElementById('pp-lightbox');
  if (lb) lb.classList.remove('lb-open');
}

function _lbKeyClose(e) {
  if (e.key === 'Escape') closeLightbox();
}