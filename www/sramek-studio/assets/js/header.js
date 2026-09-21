/* Sticky header, hide-on-scroll and the mobile navigation drawer.
   Thresholds and the 850ms close timing are ported from the original build. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

const SCROLLED_AT = 32;   // px before the header switches to its light state
const HIDE_BELOW = 140;   // px before scrolling down is allowed to hide it
const HYSTERESIS = 12;    // px of movement required before re-evaluating
const CLOSE_MS = 850;     // matches mobileNavPanelOut (.34s) + its .28s delay

const header = document.querySelector('.site-header');
const nav = header && header.querySelector('.site-nav');
const toggle = header && header.querySelector('.menu-toggle');
const cta = header && header.querySelector('.header-cta');

if (header && nav && toggle) {
  // Opt-in glass treatment, kept from the original build for side-by-side reviews.
  if (new URLSearchParams(location.search).get('experiment') === 'glass-header') {
    header.classList.add('has-glass-experiment');
  }

  let open = false;
  let closeTimer = 0;

  const paint = () => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('has-open-menu', open || nav.classList.contains('is-closing'));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Zavřít navigaci' : 'Otevřít navigaci');
  };

  const openNav = () => {
    clearTimeout(closeTimer);
    nav.classList.remove('is-closing');
    open = true;
    paint();
  };

  const closeNav = () => {
    if (!open) return;
    clearTimeout(closeTimer);
    open = false;
    if (REDUCED.matches) {
      nav.classList.remove('is-closing');
      paint();
      return;
    }
    nav.classList.add('is-closing');
    paint();
    closeTimer = setTimeout(() => {
      nav.classList.remove('is-closing');
      header.classList.remove('has-open-menu');
    }, CLOSE_MS);
  };

  toggle.addEventListener('click', () => (open ? closeNav() : openNav()));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // -- sticky / hide-on-scroll ----------------------------------------------
  // The logo itself is swapped in CSS (.brand-logo--light/--dark), so nothing here
  // has to know the built filenames.
  let anchor = scrollY;
  let hidden = false;
  let frame = 0;

  const update = () => {
    frame = 0;
    const y = scrollY;
    const scrolled = y > SCROLLED_AT;
    header.classList.toggle('is-scrolled', scrolled);

    if (cta) {
      cta.classList.toggle('button--dark', scrolled);
      cta.classList.toggle('button--linen', !scrolled);
    }

    if (open || y <= SCROLLED_AT) {
      hidden = false;
      anchor = y;
    } else if (Math.abs(y - anchor) >= HYSTERESIS) {
      hidden = y > anchor && y > HIDE_BELOW;
      anchor = y;
    }
    header.classList.toggle('is-hidden', hidden && !open);
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  update();
}
