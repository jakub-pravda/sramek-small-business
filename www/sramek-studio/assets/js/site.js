/* Vstupní bod stránek (index.html, projekty.html). */

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import './header.js';
import './hero.js';
import './faq.js';
import './slider.js';
import './form.js';

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  new Lenis({
    autoRaf: true,
    anchors: { offset: -92 },
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    syncTouch: false,
  });
}
