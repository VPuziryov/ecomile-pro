(function () {
  const path = window.location.pathname.toLowerCase();

  // Если уже внутри языковой версии — ничего не делаем
  if (
    path.startsWith('/ru/') ||
    path.startsWith('/en/') ||
    path.startsWith('/vn/')
  ) {
    return;
  }

  const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();

  // Языки бывших стран СНГ
  const ruLangs = [
    'ru','uk','be','kk','uz','az','hy','ka','ky','tg','tk'
  ];

  const isCIS = ruLangs.some(code => lang.startsWith(code));

  if (isCIS) {
    window.location.replace('/ru/');
    return;
  }

  if (lang.startsWith('vi')) {
    window.location.replace('/vn/');
    return;
  }

  window.location.replace('/en/');
})();
