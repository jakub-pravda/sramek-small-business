/* Homepage entry point. Loaded as <script src="assets/js/main.js" type="module">, so it
   runs after the document has parsed and every module below can query the DOM directly. */

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import './header.js';
import './hero.js';
import './scroll-video.js';
import './plant-catalog.js';
import './reveal.js';
import './faq.js';

/* Smooth scrolling. The anchor offset matches the 92px fixed header, so in-page links
   land below it instead of behind it. Options are carried over from the previous build. */
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
