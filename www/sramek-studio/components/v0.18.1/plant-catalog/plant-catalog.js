(() => {
  const init = (root) => {
    if (root.dataset.ssPlantReady === "true") return;
    root.dataset.ssPlantReady = "true";

    const carousel = root.querySelector("[data-plant-carousel]");
    const track = root.querySelector("[data-plant-track]");
    const motif = root.querySelector("[data-plant-motif]");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motif && !reducedMotion.matches) {
      let current = 0;
      const renderParallax = () => {
        const rect = root.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const target = Math.max(-56, Math.min(56, (innerHeight / 2 - (rect.top + rect.height / 2)) * .08));
          current += (target - current) * .05;
          motif.style.setProperty("--ss-parallax-y", `${current.toFixed(2)}px`);
        }
        requestAnimationFrame(renderParallax);
      };
      requestAnimationFrame(renderParallax);
    }
    const originals = [...root.querySelectorAll("[data-plant]")];
    if (carousel && track && originals.length) {
      const clone = (card) => {
        const copy = card.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.setAttribute("tabindex", "-1");
        return copy;
      };
      track.prepend(...originals.map(clone));
      track.append(...originals.map(clone));
    }
    const cards = [...root.querySelectorAll("[data-plant]")];
    const dialog = root.querySelector("[data-plant-dialog]");
    if (!cards.length || !(dialog instanceof HTMLDialogElement)) return;

    const fields = Object.fromEntries(
      [...dialog.querySelectorAll("[data-field]")].map((node) => [node.dataset.field, node]),
    );
    let activeIndex = 0;
    let closeTimer;
    let switchTimer;
    let dragged = false;
    const stage = dialog.querySelector("[data-plant-stage]");

    const close = () => {
      if (!dialog.open || dialog.classList.contains("is-closing")) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        dialog.close();
        return;
      }
      dialog.classList.add("is-closing");
      closeTimer = setTimeout(() => {
        dialog.classList.remove("is-closing");
        dialog.close();
      }, 280);
    };

    const select = (index, open = true) => {
      const direction = index < activeIndex ? "prev" : "next";
      activeIndex = (index + originals.length) % originals.length;
      const card = originals[activeIndex];
      cards.forEach((item, itemIndex) => {
        const active = itemIndex % originals.length === activeIndex;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-expanded", String(active && dialog.open));
      });
      Object.entries(fields).forEach(([key, node]) => {
        const value = card.dataset[key];
        if (value == null) return;
        if (node instanceof HTMLImageElement) {
          node.src = value;
          node.alt = card.dataset.alt || "";
        } else node.textContent = value;
      });
      const careMeter = dialog.querySelector("[data-care-meter]");
      if (careMeter) careMeter.dataset.level = card.dataset.care === "Nízká" ? "1" : card.dataset.care === "Střední" ? "2" : "3";
      if (open && !dialog.open) dialog.showModal();
      if (!open && dialog.open && stage && !reducedMotion.matches) {
        clearTimeout(switchTimer);
        stage.dataset.direction = direction;
        stage.classList.remove("is-switching");
        void stage.offsetWidth;
        stage.classList.add("is-switching");
        switchTimer = setTimeout(() => stage.classList.remove("is-switching"), 480);
      }
    };

    cards.forEach((card, index) => card.addEventListener("click", () => { if (!dragged) select(index % originals.length); }));
    dialog.querySelector("[data-plant-close]")?.addEventListener("click", close);
    dialog.querySelector("[data-plant-prev]")?.addEventListener("click", () => select(activeIndex - 1, false));
    dialog.querySelector("[data-plant-next]")?.addEventListener("click", () => select(activeIndex + 1, false));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
    dialog.addEventListener("close", () => {
      clearTimeout(closeTimer);
      dialog.classList.remove("is-closing");
      cards.forEach((card) => card.setAttribute("aria-expanded", "false"));
    });
    let swipeX = 0;
    let swipeY = 0;
    let swipeTime = 0;
    stage?.addEventListener("dragstart", (event) => event.preventDefault());
    stage?.addEventListener("pointerdown", (event) => { swipeX = event.clientX; swipeY = event.clientY; swipeTime = event.timeStamp; });
    stage?.addEventListener("pointerup", (event) => {
      const dx = event.clientX - swipeX;
      const dy = event.clientY - swipeY;
      const velocity = Math.abs(dx) / Math.max(1, event.timeStamp - swipeTime);
      if ((Math.abs(dx) >= 44 || velocity >= .45) && Math.abs(dx) > Math.abs(dy) * 1.15) select(activeIndex + (dx < 0 ? 1 : -1), false);
    });
    document.addEventListener("keydown", (event) => {
      if (!dialog.open || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      event.preventDefault();
      select(activeIndex + (event.key === "ArrowLeft" ? -1 : 1), false);
    });
    if (carousel && track) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      let paused = false;
      let lastTime = performance.now();
      let resumeTimer;
      let travel = 0;
      let desiredSpeed = 25;
      let currentSpeed = 25;
      let dragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let dragAxis = null;
      let dragLastX = 0;
      let dragLastTime = 0;
      let dragVelocity = 0;
      let inertiaFrame;
      const loopMetrics = () => {
        const loopCards = [...track.querySelectorAll(".ss-plant-card")];
        const count = originals.length;
        const start = loopCards[count]?.offsetLeft ?? carousel.scrollWidth / 3;
        const end = loopCards[count * 2]?.offsetLeft ?? carousel.scrollWidth * 2 / 3;
        return { start, end, segment: end - start };
      };
      const centerLoop = () => {
        const { start, end, segment } = loopMetrics();
        if (!segment) return;
        if (carousel.scrollLeft < start) carousel.scrollLeft += segment;
        else if (carousel.scrollLeft >= end) carousel.scrollLeft -= segment;
      };
      const pause = () => { paused = true; clearTimeout(resumeTimer); };
      const resume = () => {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => { paused = false; }, 1200);
      };
      const tick = (time) => {
        if (!paused && !reduced.matches && !dialog.open && document.visibilityState === "visible") {
          currentSpeed += (desiredSpeed - currentSpeed) * .08;
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
      const steer = (event) => {
        if (event.pointerType === "touch") return;
        const rect = carousel.getBoundingClientRect();
        const normalized = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
        desiredSpeed = Math.abs(normalized) < .12 ? 25 : normalized * 180;
      };
      const dragStart = (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        cancelAnimationFrame(inertiaFrame);
        dragging = true;
        dragged = false;
        dragStartX = dragLastX = event.clientX;
        dragStartY = event.clientY;
        dragAxis = null;
        dragLastTime = event.timeStamp;
        dragVelocity = 0;
        pause();
      };
      const dragMove = (event) => {
        steer(event);
        if (!dragging) return;
        const totalX = event.clientX - dragStartX;
        const totalY = event.clientY - dragStartY;
        if (!dragAxis && Math.max(Math.abs(totalX), Math.abs(totalY)) > 7) {
          if (Math.abs(totalX) > Math.abs(totalY) * 1.15) dragAxis = "x";
          else if (Math.abs(totalY) > Math.abs(totalX) * 1.15) dragAxis = "y";
        }
        if (dragAxis !== "x") return;
        const delta = event.clientX - dragLastX;
        const elapsed = Math.max(8, event.timeStamp - dragLastTime);
        if (Math.abs(event.clientX - dragStartX) > 6) {
          dragged = true;
          carousel.classList.add("is-dragging");
          if (!carousel.hasPointerCapture(event.pointerId)) carousel.setPointerCapture(event.pointerId);
        }
        carousel.scrollLeft -= delta;
        dragVelocity = delta / elapsed;
        dragLastX = event.clientX;
        dragLastTime = event.timeStamp;
      };
      const dragEnd = (event) => {
        if (!dragging) return;
        dragging = false;
        carousel.classList.remove("is-dragging");
        if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);
        if (dragAxis !== "x") { resume(); return; }
        let velocity = dragVelocity * 16;
        const glide = () => {
          if (Math.abs(velocity) < .25) { resume(); return; }
          carousel.scrollLeft -= velocity;
          velocity *= .94;
          inertiaFrame = requestAnimationFrame(glide);
        };
        inertiaFrame = requestAnimationFrame(glide);
        setTimeout(() => { dragged = false; }, 0);
      };
      carousel.addEventListener("pointerdown", dragStart);
      carousel.addEventListener("pointerup", dragEnd);
      carousel.addEventListener("pointercancel", dragEnd);
      carousel.addEventListener("pointermove", dragMove);
      carousel.addEventListener("dragstart", (event) => event.preventDefault());
      carousel.addEventListener("pointerleave", () => { desiredSpeed = 25; });
      carousel.addEventListener("focusin", pause);
      carousel.addEventListener("focusout", resume);
      carousel.addEventListener("scroll", centerLoop, { passive: true });
      const move = (direction) => {
        const card = carousel.querySelector(".ss-plant-card");
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const step = (card?.offsetWidth || carousel.clientWidth * .72) + gap;
        const { start, end, segment } = loopMetrics();
        pause();
        if (direction < 0 && carousel.scrollLeft <= start + 1) carousel.scrollLeft += segment;
        if (direction > 0 && carousel.scrollLeft + step >= end) carousel.scrollLeft -= segment;
        carousel.scrollBy({ left: direction * step, behavior: reduced.matches ? "auto" : "smooth" });
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => { centerLoop(); paused = false; }, reduced.matches ? 0 : 420);
      };
      root.querySelector("[data-plant-carousel-prev]")?.addEventListener("click", () => move(-1));
      root.querySelector("[data-plant-carousel-next]")?.addEventListener("click", () => move(1));
    }
    select(3, false);
  };

  const boot = () => document.querySelectorAll("[data-ss-plant-catalog]").forEach(init);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
