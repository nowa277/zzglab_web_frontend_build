(function () {
  const storageKey = 'zzglab-language';
  const url = new URL(window.location.href);
  const selectedLanguage = url.searchParams.get('lang');
  const selectedLanguageIsValid = selectedLanguage === 'en' || selectedLanguage === 'zh';
  let preferredLanguage = 'en';

  function readCookie() {
    const entry = document.cookie.split('; ').find((item) => item.startsWith(`${storageKey}=`));
    return entry ? decodeURIComponent(entry.split('=').slice(1).join('=')) : '';
  }

  function storeLanguage(language) {
    try {
      window.localStorage.setItem(storageKey, language);
    } catch {}
    document.cookie = `${storageKey}=${encodeURIComponent(language)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  }

  if (selectedLanguageIsValid) {
    preferredLanguage = selectedLanguage;
    storeLanguage(preferredLanguage);
    url.searchParams.delete('lang');
  } else {
    let storedLanguage = '';
    try {
      storedLanguage = window.localStorage.getItem(storageKey) || '';
    } catch {}
    if (storedLanguage !== 'en' && storedLanguage !== 'zh') storedLanguage = readCookie();
    if (storedLanguage === 'en' || storedLanguage === 'zh') preferredLanguage = storedLanguage;
  }

  const path = url.pathname;
  const isChinesePage = /\/zh(?:\/|$)/.test(path);
  const languageMatchesPage = (preferredLanguage === 'zh') === isChinesePage;

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
  });

  if (languageMatchesPage) {
    if (selectedLanguageIsValid) window.history.replaceState(window.history.state, '', `${path}${url.search}${url.hash}`);
    return;
  }

  let targetPath;
  if (preferredLanguage === 'zh') {
    if (path.endsWith('/')) targetPath = `${path}zh/`;
    else {
      const lastSlash = path.lastIndexOf('/');
      targetPath = `${path.slice(0, lastSlash + 1)}zh/${path.slice(lastSlash + 1)}`;
    }
  } else {
    targetPath = path.replace(/\/zh(?=\/|$)/, '') || '/';
  }

  window.location.replace(`${targetPath}${url.search}${url.hash}`);
}());
