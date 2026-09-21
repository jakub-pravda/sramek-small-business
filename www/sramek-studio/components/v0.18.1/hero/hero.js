(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-ss-hero]").forEach((root) => {
    const images = [...root.querySelectorAll(".ss-hero__image")];
    const claim = root.querySelector("[data-ss-hero-claim]");
    const controls = root.querySelector(".ss-hero__controls");
    let active = 0;
    let timer;
    images.forEach((image) => { const preload = new Image(); preload.src = image.currentSrc || image.src; });
    const show = (index) => {
      active = (index + images.length) % images.length;
      images.forEach((image, i) => image.classList.toggle("is-active", i === active));
      controls.querySelectorAll("button").forEach((button, i) => {
        button.classList.toggle("is-active", i === active);
        button.setAttribute("aria-current", i === active ? "true" : "false");
      });
      claim.textContent = images[active].dataset.claim || "";
    };
    const restart = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => show(active + 1), 5600); };
    images.forEach((_, index) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "ss-hero__dot";
      button.setAttribute("aria-label", `Zobrazit snímek ${index + 1}`);
      button.innerHTML = `<span>0${index + 1}</span><i></i>`;
      button.addEventListener("click", () => { show(index); restart(); }); controls.append(button);
    });
    show(0); restart();
    document.addEventListener("visibilitychange", () => document.hidden ? clearInterval(timer) : restart());
  });
})();
