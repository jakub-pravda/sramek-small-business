/* Plant catalog: an infinite drifting carousel plus one shared <dialog> detail.

   Ported from components/v0.18.1/plant-catalog/plant-catalog.js, which is the published
   portable version of this component. Keep the two in step when either changes.

   Markup contract — every hook is a data attribute, so the markup is the API:
     [data-ss-plant-catalog]     section root
     [data-plant-motif]          decorative background, moved via --ss-parallax-y
     [data-plant-carousel]       the horizontal scroller
     [data-plant-track]          the flex track that gets the cloned cards
     [data-plant]                one card; data-name/latin/description/light/height/
                                 care/image/alt carry its content
     [data-plant-dialog]         the shared dialog
     [data-plant-stage]          the animated inner stage
     [data-field="…"]            a dialog node filled from the card's dataset
     [data-care-meter]           three-bar meter, driven by data-level
     [data-plant-close|prev|next], [data-plant-carousel-prev|next]

   The track is authored with the ten real cards only; the leading and trailing copies
   that make the loop seamless are cloned here at runtime. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

const BASE_SPEED = 25;     // px/s idle drift
const STEER_SPEED = 180;   // px/s at the far edge of the carousel
const DEAD_ZONE = 0.12;    // middle of the carousel that does not steer
const CLOSE_MS = 280;      // matches ssPlantOut
const RESUME_MS = 1200;

const CARE_LEVEL = { 'Nízká': '1', 'Střední': '2' };

const init = (root) => {
  if (root.dataset.ssPlantReady === 'true') return;
  root.dataset.ssPlantReady = 'true';

  const carousel = root.querySelector('[data-plant-carousel]');
  const track = root.querySelector('[data-plant-track]');
  const motif = root.querySelector('[data-plant-motif]');

  // -- decorative parallax ----------------------------------------------------
  if (motif && !REDUCED.matches) {
    let current = 0;
    const render = () => {
      const rect = root.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) {
        const centre = rect.top + rect.height / 2;
        const target = Math.max(-56, Math.min(56, (innerHeight / 2 - centre) * 0.08));
        current += (target - current) * 0.05;
        motif.style.setProperty('--ss-parallax-y', `${current.toFixed(2)}px`);
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  // -- clone the track into three segments ------------------------------------
  const originals = [...root.querySelectorAll('[data-plant]')];
  if (carousel && track && originals.length) {
    const clone = (card) => {
      const copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('tabindex', '-1');
      return copy;
    };
    track.prepend(...originals.map(clone));
    track.append(...originals.map(clone));
  }

  const cards = [...root.querySelectorAll('[data-plant]')];
  const dialog = root.querySelector('[data-plant-dialog]');
  if (!cards.length || !(dialog instanceof HTMLDialogElement)) return;

  // -- dialog -----------------------------------------------------------------
  const stage = dialog.querySelector('[data-plant-stage]');
  const careMeter = dialog.querySelector('[data-care-meter]');
  const fields = Object.fromEntries(
    [...dialog.querySelectorAll('[data-field]')].map((node) => [node.dataset.field, node]),
  );

  let activeIndex = 0;
  let closeTimer = 0;
  let dragged = false;

  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (REDUCED.matches) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    closeTimer = setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
    }, CLOSE_MS);
  };

  const select = (index, open = true) => {
    const direction = index < activeIndex ? 'prev' : 'next';
    activeIndex = (index + originals.length) % originals.length;
    const card = originals[activeIndex];

    cards.forEach((item, i) => {
      const active = i % originals.length === activeIndex;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-expanded', String(active && dialog.open));
    });

    Object.entries(fields).forEach(([key, node]) => {
      const value = card.dataset[key];
      if (value == null) return;
      if (node instanceof HTMLImageElement) {
        node.src = value;
        node.alt = card.dataset.alt || '';
      } else {
        node.textContent = value;
      }
    });

    if (careMeter) careMeter.dataset.level = CARE_LEVEL[card.dataset.care] || '3';
    if (open && !dialog.open) dialog.showModal();

    // Direction is recorded for CSS, but `is-switching` is deliberately not set: the
    // shipped site keeps the stage transition disabled (see the vendor override in
    // assets/css/main.css). The portable component in components/ does set it.
    if (!open && stage && !REDUCED.matches) stage.dataset.direction = direction;
  };

  cards.forEach((card, i) => card.addEventListener('click', () => {
    if (!dragged) select(i % originals.length);
  }));

  dialog.querySelector('[data-plant-close]')?.addEventListener('click', close);
  dialog.querySelector('[data-plant-prev]')?.addEventListener('click', () => select(activeIndex - 1, false));
  dialog.querySelector('[data-plant-next]')?.addEventListener('click', () => select(activeIndex + 1, false));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    cards.forEach((card) => card.setAttribute('aria-expanded', 'false'));
  });

  document.addEventListener('keydown', (e) => {
    if (!dialog.open || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    select(activeIndex + (e.key === 'ArrowLeft' ? -1 : 1), false);
  });

  // -- swipe between plants inside the dialog ---------------------------------
  if (stage) {
    let swipeX = 0;
    let swipeY = 0;
    let swipeTime = 0;
    stage.addEventListener('dragstart', (e) => e.preventDefault());
    stage.addEventListener('pointerdown', (e) => {
      swipeX = e.clientX;
      swipeY = e.clientY;
      swipeTime = e.timeStamp;
    });
    stage.addEventListener('pointerup', (e) => {
      const dx = e.clientX - swipeX;
      const dy = e.clientY - swipeY;
      const velocity = Math.abs(dx) / Math.max(1, e.timeStamp - swipeTime);
      if ((Math.abs(dx) >= 44 || velocity >= 0.45) && Math.abs(dx) > Math.abs(dy) * 1.15) {
        select(activeIndex + (dx < 0 ? 1 : -1), false);
      }
    });
  }

  // -- carousel drift, steering and drag --------------------------------------
  if (carousel && track) {
    let paused = false;
    let lastTime = performance.now();
    let resumeTimer = 0;
    let travel = 0;
    let desiredSpeed = BASE_SPEED;
    let currentSpeed = BASE_SPEED;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragAxis = null;
    let dragLastX = 0;
    let dragLastTime = 0;
    let dragVelocity = 0;
    let inertiaFrame = 0;

    const loopMetrics = () => {
      const loopCards = [...track.querySelectorAll('.ss-plant-card')];
      const count = originals.length;
      const start = loopCards[count]?.offsetLeft ?? carousel.scrollWidth / 3;
      const end = loopCards[count * 2]?.offsetLeft ?? (carousel.scrollWidth * 2) / 3;
      return { start, end, segment: end - start };
    };

    const centerLoop = () => {
      const { start, end, segment } = loopMetrics();
      if (!segment) return;
      if (carousel.scrollLeft < start) carousel.scrollLeft += segment;
      else if (carousel.scrollLeft >= end) carousel.scrollLeft -= segment;
    };

    const pause = () => {
      paused = true;
      clearTimeout(resumeTimer);
    };

    const resume = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, RESUME_MS);
    };

    const tick = (time) => {
      if (!paused && !REDUCED.matches && !dialog.open && document.visibilityState === 'visible') {
        currentSpeed += (desiredSpeed - currentSpeed) * 0.08;
        travel += Math.min(time - lastTime, 40) * Math.abs(currentSpeed) / 1000;
        const step = Math.floor(travel);
        if (step > 0) {
          carousel.scrollLeft += step * Math.sign(currentSpeed || 1);
          travel -= step;
        }
        centerLoop();
      }
      lastTime = time;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(() => {
      carousel.scrollLeft = loopMetrics().start;
      requestAnimationFrame(tick);
    });

    const steer = (e) => {
      if (e.pointerType === 'touch') return;
      const rect = carousel.getBoundingClientRect();
      const normalized = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      desiredSpeed = Math.abs(normalized) < DEAD_ZONE ? BASE_SPEED : normalized * STEER_SPEED;
    };

    const dragStart = (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      cancelAnimationFrame(inertiaFrame);
      dragging = true;
      dragged = false;
      dragStartX = dragLastX = e.clientX;
      dragStartY = e.clientY;
      dragAxis = null;
      dragLastTime = e.timeStamp;
      dragVelocity = 0;
      pause();
    };

    const dragMove = (e) => {
      steer(e);
      if (!dragging) return;
      const totalX = e.clientX - dragStartX;
      const totalY = e.clientY - dragStartY;
      if (!dragAxis && Math.max(Math.abs(totalX), Math.abs(totalY)) > 7) {
        if (Math.abs(totalX) > Math.abs(totalY) * 1.15) dragAxis = 'x';
        else if (Math.abs(totalY) > Math.abs(totalX) * 1.15) dragAxis = 'y';
      }
      if (dragAxis !== 'x') return;
      const delta = e.clientX - dragLastX;
      const elapsed = Math.max(8, e.timeStamp - dragLastTime);
      if (Math.abs(e.clientX - dragStartX) > 6) {
        dragged = true;
        carousel.classList.add('is-dragging');
        if (!carousel.hasPointerCapture(e.pointerId)) carousel.setPointerCapture(e.pointerId);
      }
      carousel.scrollLeft -= delta;
      dragVelocity = delta / elapsed;
      dragLastX = e.clientX;
      dragLastTime = e.timeStamp;
    };

    const dragEnd = (e) => {
      if (!dragging) return;
      dragging = false;
      carousel.classList.remove('is-dragging');
      if (carousel.hasPointerCapture(e.pointerId)) carousel.releasePointerCapture(e.pointerId);
      if (dragAxis !== 'x') {
        resume();
        return;
      }
      let velocity = dragVelocity * 16;
      const glide = () => {
        if (Math.abs(velocity) < 0.25) {
          resume();
          return;
        }
        carousel.scrollLeft -= velocity;
        velocity *= 0.94;
        inertiaFrame = requestAnimationFrame(glide);
      };
      inertiaFrame = requestAnimationFrame(glide);
      setTimeout(() => { dragged = false; }, 0);
    };

    carousel.addEventListener('pointerdown', dragStart);
    carousel.addEventListener('pointerup', dragEnd);
    carousel.addEventListener('pointercancel', dragEnd);
    carousel.addEventListener('pointermove', dragMove);
    carousel.addEventListener('dragstart', (e) => e.preventDefault());
    carousel.addEventListener('pointerleave', () => { desiredSpeed = BASE_SPEED; });
    carousel.addEventListener('focusin', pause);
    carousel.addEventListener('focusout', resume);
    carousel.addEventListener('scroll', centerLoop, { passive: true });

    const move = (direction) => {
      const card = carousel.querySelector('.ss-plant-card');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = (card?.offsetWidth || carousel.clientWidth * 0.72) + gap;
      const { start, end, segment } = loopMetrics();
      pause();
      if (direction < 0 && carousel.scrollLeft <= start + 1) carousel.scrollLeft += segment;
      if (direction > 0 && carousel.scrollLeft + step >= end) carousel.scrollLeft -= segment;
      carousel.scrollBy({ left: direction * step, behavior: REDUCED.matches ? 'auto' : 'smooth' });
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        centerLoop();
        paused = false;
      }, REDUCED.matches ? 0 : 420);
    };

    root.querySelector('[data-plant-carousel-prev]')?.addEventListener('click', () => move(-1));
    root.querySelector('[data-plant-carousel-next]')?.addEventListener('click', () => move(1));
  }

  select(Math.min(3, originals.length - 1), false);
};

document.querySelectorAll('[data-ss-plant-catalog]').forEach(init);
