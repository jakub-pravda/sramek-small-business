/* Scroll-scrubbed video. The shell is 235svh tall and the stage inside it is sticky,
   so the scroll distance past the shell maps 0..1 onto --tunnel-progress and onto the
   video's currentTime.

   Markup contract:
     .image-claim-shell[data-scroll-tunnel]  the tall scroll track
     video.image-claim-media                 preload="auto", muted, playsinline

   Firefox needs help here: seeking to an arbitrary timestamp is expensive, so seeks are
   snapped to the 24fps frame grid the asset was encoded on (GOP 6) and queued behind the
   previous `seeked` event instead of being fired on every frame. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

const FPS = 24;
const FRAME = 1 / FPS;
const LERP = 0.2;
const FIREFOX = navigator.userAgent.includes('Firefox');

const initTunnel = (shell) => {
  const video = shell.querySelector('video');
  if (!video) return;

  let target = 0;
  let current = 0;
  let frame = 0;
  let seeking = false;
  let queued = null;

  video.addEventListener('seeked', () => {
    seeking = false;
    if (queued !== null) {
      const next = queued;
      queued = null;
      seek(next);
    }
  });

  function seek(time) {
    if (seeking) {
      queued = time;
      return;
    }
    seeking = true;
    video.currentTime = time;
  }

  const apply = () => {
    shell.style.setProperty('--tunnel-progress', current.toFixed(4));
    const duration = video.duration;
    if (!duration || Number.isNaN(duration)) return;
    const time = duration * current;

    if (FIREFOX) {
      const snapped = Math.min(Math.max(Math.round(time / FRAME) * FRAME, 0), duration - 0.04);
      if (Math.abs(video.currentTime - snapped) >= FRAME * 0.45) seek(snapped);
    } else if (Math.abs(video.currentTime - time) > 0.006) {
      video.currentTime = time;
    }
  };

  const tick = () => {
    current += (target - current) * LERP;
    apply();
    frame = Math.abs(target - current) > 0.0005 ? requestAnimationFrame(tick) : 0;
  };

  const update = () => {
    const rect = shell.getBoundingClientRect();
    const travel = Math.max(1, shell.offsetHeight - innerHeight);
    target = Math.min(Math.max(-rect.top / travel, 0), 1);
    if (!frame) frame = requestAnimationFrame(tick);
  };

  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
  video.addEventListener('loadedmetadata', update);
  update();
};

if (!REDUCED.matches) {
  document.querySelectorAll('[data-scroll-tunnel]').forEach(initTunnel);
}
