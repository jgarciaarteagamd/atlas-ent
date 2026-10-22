// Light / dark switch. The choice is kept in a cookie for the whole
// jgarciaarteaga.pro domain, so the Bio (bio.jgarciaarteaga.pro) opens in the
// same mode. Until the visitor picks one, the page follows the device setting.
// Base.astro sets data-theme on <html> before the first paint; this module
// keeps it in sync and wires the header switch.
const root = document.documentElement;
const COLORS = { dark: '#03070c', light: '#ffffff' };
const system = matchMedia('(prefers-color-scheme: light)');
const saved = () => document.cookie.match(/(?:^|; )theme=(light|dark)/)?.[1];

function apply(theme) {
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme]);
  for (const b of document.querySelectorAll('[data-theme-toggle]')) b.setAttribute('aria-pressed', String(theme === 'light'));
}

function save(theme) {
  const domain = /(^|\.)jgarciaarteaga\.pro$/.test(location.hostname) ? '; domain=jgarciaarteaga.pro' : '';
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax${domain}${secure}`;
}

apply(root.dataset.theme === 'light' ? 'light' : 'dark');
system.addEventListener('change', (e) => { if (!saved()) apply(e.matches ? 'light' : 'dark'); });
for (const b of document.querySelectorAll('[data-theme-toggle]')) {
  b.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    save(next);
    apply(next);
  });
}
