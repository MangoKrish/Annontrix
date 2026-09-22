// ==========================================================
// ANNONTRIX — SOFTWARE STUDIO, ISSUE 01
// Theme switch · folio indicator · scroll reveals ·
// generative plates · copy email · project brief (mailto)
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Masthead load animation (one-time) ---
  if (!reducedMotion) html.classList.add('anim');

  // --- Theme switch (pre-paint theme set inline in <head>) ---
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.setAttribute('aria-checked', String(html.getAttribute('data-theme') === 'ink'));
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'ink' ? 'paper' : 'ink';
    html.classList.add('theming');
    html.setAttribute('data-theme', next);
    themeToggle.setAttribute('aria-checked', String(next === 'ink'));
    try { localStorage.setItem('anx-theme', next); } catch (e) { /* private mode */ }
    setTimeout(() => html.classList.remove('theming'), 300);
  });

  // --- Running header + scroll progress ---
  const header = document.getElementById('runningHeader');
  const progress = document.getElementById('scrollProgress');
  const masthead = document.querySelector('.masthead');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle('visible', y > masthead.offsetHeight * 0.72);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Folio indicator ---
  const folio = document.getElementById('folioIndicator');
  const folioSections = document.querySelectorAll('[data-folio]');
  const folioIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) folio.textContent = entry.target.dataset.folio;
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  folioSections.forEach((s) => folioIO.observe(s));

  // --- Scroll reveals ---
  document.querySelectorAll('.reveal').forEach((el) => {
    const inner = document.createElement('span');
    inner.className = 'reveal-inner';
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
  });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal, .rise').forEach((el) => revealIO.observe(el));

  // --- Generative figure plates (deterministic per row) ---
  const PLATE_CHARS = ['·', '▘', '▝', '▖', '▗', '▚', '▞', '▌', '█', ' ', ' ', ' '];
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 1000) / 1000;
    };
  }
  document.querySelectorAll('.plate').forEach((plate) => {
    const rand = seeded(plate.dataset.plate || 'plate');
    const rows = 7, cols = 24;
    let out = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = rand();
        if (v > 0.94) {
          out += '<b>' + PLATE_CHARS[Math.floor(rand() * 8)] + '</b>';
        } else {
          out += PLATE_CHARS[Math.floor(v * PLATE_CHARS.length)];
        }
      }
      if (r < rows - 1) out += '\n';
    }
    plate.innerHTML = out;
  });

  // --- Open a service row directly from a URL hash (e.g. #s-web) ---
  (function initFromHash() {
    let h;
    try {
      h = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      h = ''; // malformed percent-encoding in a shared link
    }
    if (!h) return;
    const row = document.getElementById(h);
    if (row && row.tagName === 'DETAILS') row.setAttribute('open', '');
  })();

  // --- Copy email ---
  const copyBtn = document.getElementById('copyEmail');
  const copyStatus = document.getElementById('copyStatus');
  let copyTimer;
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      clearTimeout(copyTimer);
      copyBtn.textContent = 'COPIED ✓';
      copyBtn.classList.add('copied');
      copyStatus.textContent = 'Email copied to clipboard';
      copyTimer = setTimeout(() => {
        copyBtn.textContent = 'COPY';
        copyBtn.classList.remove('copied');
        copyStatus.textContent = '';
      }, 1600);
    } catch (e) {
      location.href = 'mailto:' + copyBtn.dataset.email;
    }
  });

  // --- Project brief -> mailto (no backend required) ---
  const briefForm = document.getElementById('briefForm');
  const briefStatus = document.getElementById('briefStatus');
  const BRIEF_TO = copyBtn.dataset.email;

  briefForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = briefForm.name.value.trim();
    const email = briefForm.email.value.trim();
    const type = briefForm.type.value;
    const budget = briefForm.budget.value;
    const message = briefForm.message.value.trim();

    if (!name || !email || !message) {
      briefStatus.textContent = 'NAME, EMAIL AND A FEW WORDS ABOUT THE PROJECT, PLEASE.';
      briefStatus.classList.add('is-error');
      (!name ? briefForm.name : !email ? briefForm.email : briefForm.message).focus();
      return;
    }

    const subject = `Project brief — ${type} — ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Looking for: ${type}`,
      `Budget: ${budget}`,
      '',
      message,
    ].join('\n');

    location.href = `mailto:${BRIEF_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    briefStatus.classList.remove('is-error');
    briefStatus.textContent = 'OPENING YOUR MAIL APP — THANKS.';
  });
});
