/* Two scroll-driven reveals, both styled only below 720px.

   Services  — a spotlight, not a one-shot reveal: whichever card is most visible is the
               only one carrying .is-in-view, so exactly one card is lit at a time.
   Process   — a one-shot reveal per step. .has-scroll-motion is added from JS so that
               without JS the steps never sit at opacity:0. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

// -- services spotlight -------------------------------------------------------
const cards = [...document.querySelectorAll('.services-grid .service-card')];

if (cards.length && !REDUCED.matches) {
  const ratios = new Map();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));

    let winner = null;
    let best = 0.15;                      // below this nothing is lit
    ratios.forEach((ratio, card) => {
      if (ratio > best) {
        best = ratio;
        winner = card;
      }
    });

    cards.forEach((card) => card.classList.toggle('is-in-view', card === winner));
  }, { rootMargin: '-20% 0px -20% 0px', threshold: [0, 0.2, 0.4, 0.6, 0.8] });

  cards.forEach((card) => observer.observe(card));
}

// -- process reveal -----------------------------------------------------------
const grid = document.querySelector('.process-grid');

if (grid && !REDUCED.matches) {
  const steps = [...grid.querySelectorAll('article')];
  grid.classList.add('has-scroll-motion');

  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      self.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });

  steps.forEach((step) => observer.observe(step));
}
