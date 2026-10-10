// Språkmenyen: lukk når man klikker utenfor eller trykker Escape
document.addEventListener('click', function (e) {
  document.querySelectorAll('details.lang-menu[open]').forEach(function (d) {
    if (!d.contains(e.target)) d.removeAttribute('open');
  });
});
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('details.lang-menu[open]').forEach(function (d) {
    d.removeAttribute('open');
    d.querySelector('summary').focus();
  });
});
