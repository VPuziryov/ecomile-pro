(function () {
  if (localStorage.getItem('ecomile_lang_selected')) return;

  const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();

  const ruLangs = ['ru', 'uk', 'be', 'kk', 'uz', 'az', 'hy', 'ka'];
  const isRULang = ruLangs.some(code => lang.startsWith(code));

  if (isRULang) {
    localStorage.setItem('ecomile_lang_selected', 'ru');
    return;
  }

  if (lang.startsWith('vi')) {
    localStorage.setItem('ecomile_lang_selected', 'vn');
    window.location.replace('/vn/');
    return;
  }

  localStorage.setItem('ecomile_lang_selected', 'en');
  window.location.replace('/en/');
})();
