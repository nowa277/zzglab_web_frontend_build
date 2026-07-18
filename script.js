document.documentElement.classList.add('js');

const body = document.body;
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.primary-nav');
const languageMenus = document.querySelectorAll('[data-language-menu]');
const inertTargets = document.querySelectorAll('main, .site-footer');
const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const languageStorageKey = 'zzglab-language';

function setBackgroundInert(inert) {
  inertTargets.forEach((element) => {
    element.inert = inert;
  });
}

function closeMenu(returnFocus = false) {
  body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', menuButton.dataset.openLabel || 'Open menu');
  setBackgroundInert(false);
  if (returnFocus) menuButton?.focus();
}

function openMenu() {
  closeLanguageMenus();
  body.classList.add('menu-open');
  menuButton?.setAttribute('aria-expanded', 'true');
  menuButton?.setAttribute('aria-label', menuButton.dataset.closeLabel || 'Close menu');
  setBackgroundInert(true);
  menu?.querySelector('a')?.focus();
}

function closeLanguageMenus(returnFocus = false) {
  languageMenus.forEach((languageMenu) => {
    const trigger = languageMenu.querySelector('[data-language-trigger]');
    const options = languageMenu.querySelector('[data-language-options]');
    if (trigger?.getAttribute('aria-expanded') !== 'true') return;
    trigger.setAttribute('aria-expanded', 'false');
    options.hidden = true;
    if (returnFocus) trigger.focus();
  });
}

function openLanguageMenu(languageMenu, focusOption = false) {
  closeLanguageMenus();
  if (body.classList.contains('menu-open')) closeMenu();
  const trigger = languageMenu.querySelector('[data-language-trigger]');
  const options = languageMenu.querySelector('[data-language-options]');
  trigger.setAttribute('aria-expanded', 'true');
  options.hidden = false;
  if (focusOption) options.querySelector('a')?.focus();
}

menuButton?.addEventListener('click', () => {
  if (body.classList.contains('menu-open')) closeMenu();
  else openMenu();
});

menu?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

languageMenus.forEach((languageMenu) => {
  const trigger = languageMenu.querySelector('[data-language-trigger]');
  trigger.addEventListener('click', () => {
    if (trigger.getAttribute('aria-expanded') === 'true') closeLanguageMenus();
    else openLanguageMenu(languageMenu);
  });
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    openLanguageMenu(languageMenu, true);
  });
});

document.addEventListener('click', (event) => {
  if (![...languageMenus].some((languageMenu) => languageMenu.contains(event.target))) closeLanguageMenus();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && [...languageMenus].some((languageMenu) => languageMenu.querySelector('[data-language-trigger]')?.getAttribute('aria-expanded') === 'true')) {
    closeLanguageMenus(true);
    return;
  }
  if (!body.classList.contains('menu-open')) return;
  if (event.key === 'Escape') {
    closeMenu(true);
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...menu.querySelectorAll(focusableSelector), menuButton].filter(Boolean);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 960 && body.classList.contains('menu-open')) closeMenu();
});

document.querySelectorAll('[data-language-switch]').forEach((link) => {
  link.addEventListener('click', () => {
    const targetLanguage = link.dataset.language;
    if (targetLanguage === 'en' || targetLanguage === 'zh') {
      try {
        window.localStorage.setItem(languageStorageKey, targetLanguage);
      } catch {}
      document.cookie = `${languageStorageKey}=${encodeURIComponent(targetLanguage)}; Max-Age=31536000; Path=/; SameSite=Lax`;
    }
    if (location.hash) link.href = `${link.href.split('#')[0]}${location.hash}`;
  });
});

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px' });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}
