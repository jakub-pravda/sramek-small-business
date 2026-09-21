/* Style-guide entry point. Reuses the real components so the page documents what the
   site actually ships, and adds the manual scrubber that stands in for scroll on the
   video demo. */

import '../css/style-guide.css';

import './header.js';
import './hero.js';
import './plant-catalog.js';
import './faq.js';

/* Links to the raw component sources. The path lives in data-component-src rather than
   href so the bundler leaves components/ alone and ships it byte-identical; see the note
   in style-guide.html. */
document.querySelectorAll('[data-component-src]').forEach((link) => {
  link.href = link.dataset.componentSrc;
});

/* The scroll-driven video is demonstrated with a range input rather than a 235svh
   scroll track, so the effect can be inspected without leaving the section. */
document.querySelectorAll('.sg-video-demo').forEach((demo) => {
  const video = demo.querySelector('video');
  const range = demo.querySelector('input[type="range"]');
  const output = demo.querySelector('output');
  if (!video || !range) return;

  const apply = () => {
    const progress = Number(range.value) / 100;
    if (output) output.textContent = `${Math.round(progress * 100)}%`;
    if (video.duration) video.currentTime = video.duration * progress;
  };

  range.addEventListener('input', apply);
  video.addEventListener('loadedmetadata', apply);
  apply();
});
