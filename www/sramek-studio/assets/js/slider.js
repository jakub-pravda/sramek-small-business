/* Generický slider: [data-slider] > .slider__viewport > .slider__slide*,
   ovládání [data-prev] / [data-next] / [data-counter].
   S atributem data-lightbox otevře kliknutí na fotografii celoobrazovkový náhled
   se stejným listováním. */

const sliders = document.querySelectorAll('[data-slider]');

let lightbox = null;

const buildLightbox = () => {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('data-lenis-prevent', '');
  dialog.setAttribute('aria-label', 'Náhled fotografie');
  dialog.innerHTML = `
    <button class="slider__btn lightbox__close" type="button" aria-label="Zavřít">✕</button>
    <button class="slider__btn lightbox__prev" type="button" aria-label="Předchozí fotografie">←</button>
    <img alt="">
    <button class="slider__btn lightbox__next" type="button" aria-label="Další fotografie">→</button>
    <span class="lightbox__counter" aria-live="polite"></span>`;
  document.body.append(dialog);

  const img = dialog.querySelector('img');
  const counter = dialog.querySelector('.lightbox__counter');
  const state = { items: [], index: 0 };

  const paint = () => {
    const item = state.items[state.index];
    img.src = item.src;
    img.alt = item.alt;
    counter.textContent = `${state.index + 1} / ${state.items.length}`;
  };
  const go = (step) => {
    state.index = (state.index + step + state.items.length) % state.items.length;
    paint();
  };

  dialog.querySelector('.lightbox__prev').addEventListener('click', () => go(-1));
  dialog.querySelector('.lightbox__next').addEventListener('click', () => go(1));
  dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  return {
    open(items, index) {
      state.items = items;
      state.index = index;
      paint();
      dialog.showModal();
    },
  };
};

sliders.forEach((root) => {
  const slides = [...root.querySelectorAll('.slider__slide')];
  if (!slides.length) return;
  const counter = root.querySelector('[data-counter]');
  let index = 0;

  const show = (n) => {
    index = (n + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
  };

  root.querySelector('[data-prev]')?.addEventListener('click', () => show(index - 1));
  root.querySelector('[data-next]')?.addEventListener('click', () => show(index + 1));

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // swipe na dotykových zařízeních
  let startX = 0;
  root.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  if (root.hasAttribute('data-lightbox')) {
    const items = slides.map((slide) => {
      const img = slide.querySelector('img');
      return { src: img.currentSrc || img.src, alt: img.alt };
    });
    slides.forEach((slide, i) => {
      slide.querySelector('img').addEventListener('click', () => {
        lightbox ||= buildLightbox();
        lightbox.open(items, i);
      });
    });
  }

  show(0);
});
