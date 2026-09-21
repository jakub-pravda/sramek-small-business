(() => {
  document.querySelectorAll(".ss-faq").forEach((root) => {
    const items = [...root.querySelectorAll("details")];
    items.forEach((item) => item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((other) => { if (other !== item) other.open = false; });
    }));
  });
})();
