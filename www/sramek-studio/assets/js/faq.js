/* The FAQ is a native <details name="studio-faq"> accordion, so exclusivity is free in
   browsers that support the name attribute (Chrome 120+, Safari 17.2+, Firefox 130+).
   This closes the siblings by hand everywhere else. Ported from
   components/v0.18.1/faq/faq.js. */

const supportsName = 'name' in document.createElement('details');

if (!supportsName) {
  document.querySelectorAll('.ss-faq').forEach((root) => {
    const items = [...root.querySelectorAll('details')];
    items.forEach((item) => item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => { if (other !== item) other.open = false; });
    }));
  });
}
