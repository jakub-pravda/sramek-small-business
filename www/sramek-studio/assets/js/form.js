/* Kontaktní formulář: odeslání zatím není napojeno (backend se doplní v další iteraci). */

document.querySelectorAll('[data-contact-form]').forEach((form) => {
  const status = form.querySelector('[data-form-status]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (status) status.textContent = 'Formulář zatím není napojen na odesílání. Napište nám prosím e-mailem.';
  });
});
