(() => {
  'use strict';
  const form = document.getElementById('ms-form');
  const status = document.getElementById('ms-status');
  const copy = JSON.parse(document.getElementById('ms-copy').textContent);
  const consent = document.getElementById('ms-consent');
  const settings = document.getElementById('ms-cookie-settings');
  const key = 'ecomile-optional-consent-v1', cookie = 'ecomile_optional_consent';
  const valid = value => value === 'accept' || value === 'reject';
  let choice = null;
  const savedCookie = document.cookie.split('; ').find(value => value.startsWith(cookie + '='))?.split('=')[1];
  if (valid(savedCookie)) choice = savedCookie;
  else { try { const saved = localStorage.getItem(key); if (valid(saved)) choice = saved; } catch (_) {} }
  let loaded = false, busy = false, formStarted = false, opener = null;
  window.ecomileTrackingAllowed = () => choice === 'accept';
  window.dataLayer = window.dataLayer || [];
  function command() { window.dataLayer.push(arguments); }
  const state = value => ({ad_storage:value, analytics_storage:value, ad_user_data:value, ad_personalization:value});
  command('consent', 'default', state('denied'));
  function track(type) {
    if (choice === 'accept' && typeof window.trackMySiteEvent === 'function') window.trackMySiteEvent(type);
  }
  function loadTracking() {
    if (loaded || choice !== 'accept') return;
    loaded = true;
    command('consent', 'update', state('granted'));
    window.dataLayer.push({'gtm.start':Date.now(), event:'gtm.js'});
    for (const src of ['https://www.googletagmanager.com/gtm.js?id=GTM-TQC9C37V', '/assets/js/pixel.js']) {
      const script = document.createElement('script'); script.async = true; script.src = src; document.head.appendChild(script);
    }
  }
  function save(value) {
    choice = value;
    try { localStorage.setItem(key, value); } catch (_) {}
    document.cookie = `${cookie}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }
  function revoke() {
    command('consent', 'update', state('denied'));
    if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
    for (const item of document.cookie.split(';')) {
      const name = item.trim().split('=')[0];
      if (!/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(name)) continue;
      for (const domain of ['', location.hostname, '.'+location.hostname, '.ecomile.pro']) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? '; Domain='+domain : ''}`;
    }
    // Reload removes already installed third-party timers/listeners; rejection is persisted first.
    if (loaded) location.reload();
  }
  settings.addEventListener('click', () => { opener = document.activeElement; consent.hidden = false; consent.querySelector('button').focus(); });
  consent.addEventListener('keydown', event => { if (event.key === 'Escape') { consent.hidden = true; opener?.focus(); } });
  consent.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
    if (busy) return;
    save(button.dataset.consent); consent.hidden = true; opener?.focus();
    if (choice === 'accept') loadTracking(); else revoke();
  }));
  window.addEventListener('storage', event => {
    if (event.key !== key || !valid(event.newValue)) return;
    save(event.newValue); if (choice === 'reject') revoke(); else loadTracking();
  });
  if (choice === 'accept') loadTracking();
  if (!valid(choice)) consent.hidden = false;
  document.querySelectorAll('[data-demo]').forEach(link => link.addEventListener('click', () => track('demo')));
  form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    if (!formStarted && choice === 'accept' && typeof window.trackMySiteEvent === 'function') { track('formStart'); formStarted = true; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    for (const name of ['name', 'contact']) {
      const input = form.elements.namedItem(name); input.value = input.value.trim(); input.setCustomValidity(input.value ? '' : copy.invalid);
    }
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type=submit]'), label = button.textContent;
    busy = true; button.disabled = true; button.textContent = copy.busy; settings.disabled = true;
    consent.querySelectorAll('button').forEach(item => { item.disabled = true; }); status.textContent = '';
    const values = new FormData(form);
    const body = {project:'mysite', name:values.get('name').trim(), contact:values.get('contact').trim(), company:String(values.get('who')||'').trim(), website:'', message:String(values.get('what')||'').trim()};
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch('/.netlify/functions/contact', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), signal:controller.signal});
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json(); if (data.success !== true) throw new Error('Request rejected');
      status.textContent = copy.success; form.reset(); track('lead');
    } catch (_) { status.textContent = copy.failure; }
    finally {
      clearTimeout(timeout); busy = false; button.disabled = false; button.textContent = label; settings.disabled = false;
      consent.querySelectorAll('button').forEach(item => { item.disabled = false; });
    }
  });
  const social = document.getElementById('ms-social');
  for (const [name, hosts] of [['facebook',['facebook.com','www.facebook.com']], ['instagram',['instagram.com','www.instagram.com']]]) {
    try {
      const url = new URL(window.MY_SITE_CONFIG?.[name]);
      if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password) continue;
      const link = document.createElement('a'); link.href = url.href; link.textContent = name === 'facebook' ? 'Facebook' : 'Instagram'; link.target = '_blank'; link.rel = 'noopener noreferrer'; social.appendChild(link); social.hidden = false;
    } catch (_) {}
  }
})();
