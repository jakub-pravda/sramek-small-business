(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  document.querySelectorAll("[data-ss-scroll-video]").forEach((root) => {
    const video = root.querySelector("video"); let target = 0; let current = 0; let raf = 0;
    const tick = () => { current += (target - current) * .14; root.style.setProperty("--ss-progress", current.toFixed(4)); if (video.duration && Math.abs(video.currentTime - video.duration * current) > 1 / 24) video.currentTime = video.duration * current; raf = Math.abs(target-current) > .0005 ? requestAnimationFrame(tick) : 0; };
    const update = () => { const rect = root.getBoundingClientRect(); target = Math.max(0, Math.min(1, -rect.top / Math.max(1, root.offsetHeight-innerHeight))); if (!raf) raf=requestAnimationFrame(tick); };
    addEventListener("scroll", update, { passive:true }); addEventListener("resize", update, { passive:true }); update();
  });
})();
