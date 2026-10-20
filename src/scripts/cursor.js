// Cursor halo: a soft ring that trails the arrow, grows and turns amber over
// anything clickable, and ripples on click. Decorative only (the arrow is the
// CSS cursor), so it stays off for touch, pens and reduced motion.
const CLICKABLE = 'a[href], button:not(:disabled), [role="button"], summary, label[for], select, .cursor-pointer';

if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  document.body.append(halo);

  let x = 0, y = 0, hx = 0, hy = 0, frame = 0, shown = false;
  const isLink = (el) => !!el?.closest?.(CLICKABLE) || /link/.test(el?.style?.cursor ?? '');

  const step = () => {
    hx += (x - hx) * 0.22;
    hy += (y - hy) * 0.22;
    halo.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
    frame = Math.abs(x - hx) + Math.abs(y - hy) > 0.1 ? requestAnimationFrame(step) : 0;
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX;
    y = e.clientY;
    if (!shown) {
      hx = x;
      hy = y;
      shown = true;
      halo.classList.add('on');
    }
    halo.classList.toggle('link', isLink(e.target));
    if (!frame) frame = requestAnimationFrame(step);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    shown = false;
    halo.classList.remove('on');
  });

  addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    halo.classList.add('press');
    const ripple = document.createElement('div');
    ripple.className = 'cursor-ripple' + (isLink(e.target) ? ' link' : '');
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    document.body.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, { passive: true });
  addEventListener('pointerup', () => halo.classList.remove('press'), { passive: true });
}
