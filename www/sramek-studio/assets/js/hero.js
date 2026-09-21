/* Layered hero: cross-fading stills, a claim that follows the active slide and the
   parallax exit used while the sticky hero scrolls away.

   Markup contract (same data-* API as components/v0.18.1/hero/):
     [data-ss-hero]          the hero root
     .hero-image[data-claim] one still per slide; data-claim feeds the headline
     [data-ss-hero-claim]    the <strong> inside the headline
     .hero-dot               one button per slide (authored in HTML, not generated)
   The dots ship disabled and [aria-busy] stays on until every still has decoded,
   so nobody can page to a slide that has not painted yet. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const INTERVAL = 5600;   // matches the @keyframes progress duration on .hero-dot i

const initHero = (root) => {
  const media = root.querySelector('.hero-media');
  const images = [...root.querySelectorAll('.hero-image')];
  const dots = [...root.querySelectorAll('.hero-dot')];
  const claim = root.querySelector('[data-ss-hero-claim]');
  if (images.length < 2) return;

  let active = 0;
  let timer = 0;

  const show = (index) => {
    active = (index + images.length) % images.length;
    images.forEach((img, i) => img.classList.toggle('is-active', i === active));
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === active);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    const text = images[active].dataset.claim;
    if (claim && text) claim.textContent = text;
  };

  const stop = () => {
    clearInterval(timer);
    timer = 0;
  };

  const start = () => {
    stop();
    if (!REDUCED.matches) timer = setInterval(() => show(active + 1), INTERVAL);
  };

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    show(i);
    start();
  }));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (timer || !REDUCED.matches) start();
  });

  // Hold the controls until every still can paint, so the first switch is clean.
  Promise.all(images.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())))
    .then(() => {
      images[0].classList.remove('is-preloading');
      if (media) media.setAttribute('aria-busy', 'false');
      dots.forEach((dot) => { dot.disabled = false; });
      start();
    });

  show(0);
};

document.querySelectorAll('[data-ss-hero]').forEach(initHero);

/* Parallax exit for the sticky full-bleed hero. --hero-exit drives the shade,
   the copy and the controls from CSS; it is meaningless on the style-guide demo. */
const layered = document.querySelector('.hero--layered');

if (layered && !REDUCED.matches) {
  let frame = 0;

  const update = () => {
    frame = 0;
    const progress = Math.min(Math.max(scrollY / (layered.offsetHeight || 1), 0), 1);
    layered.style.setProperty('--hero-exit', progress.toFixed(4));
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  update();
}
