// Shared validation for the MY SITE browser form and Netlify Function.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MySiteContact = factory();
})(typeof window === 'object' ? window : this, function () {
  'use strict';
  const trim = value => typeof value === 'string' ? value.trim() : '';
  function email(value) {
    if (value.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+$/.test(value)) return false;
    const [local, domain] = value.split('@');
    return local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') && domain.includes('.') && domain.split('.').every(label => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) && /^[A-Za-z]{2,63}$/.test(domain.split('.').pop());
  }
  function messenger(value) {
    if (value.length > 200) return false;
    if (/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value)) return true;
    if (/^(?:https:\/\/)?t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}\/?$/.test(value)) return true;
    if (/^(?:https:\/\/)?wa\.me\/[1-9][0-9]{6,14}\/?$/.test(value)) return true;
    return /^\+[1-9][0-9 ()-]+$/.test(value) && /^[1-9][0-9]{6,14}$/.test(value.replace(/[+ ()-]/g, '')) && (value.match(/\(/g)||[]).length === (value.match(/\)/g)||[]).length;
  }
  function validate(emailValue, messengerValue) {
    const e = trim(emailValue), m = trim(messengerValue);
    if (!e && !m) return 'required';
    if (e && !email(e)) return 'email';
    if (m && !messenger(m)) return 'messenger';
    return null;
  }
  function combine(emailValue, messengerValue) {
    return [trim(emailValue), trim(messengerValue)].filter(Boolean).join(' · ');
  }
  return {email, messenger, validate, combine};
});
