'use strict';

function appendBannerImage(documentRef, wrapper, url, className) {
  if (!url) return;

  const img = documentRef.createElement('img');
  img.className = className;
  img.src = url;
  img.alt = '';
  img.loading = 'lazy';
  wrapper.appendChild(img);
}

export function createBundleBannerElement(config = {}, documentRef = document) {
  const desktopBannerUrl = config.desktopBannerUrl;
  const mobileBannerUrl = config.mobileBannerUrl;
  if (!desktopBannerUrl && !mobileBannerUrl) return null;

  const wrapper = documentRef.createElement('div');
  wrapper.className = 'bundle-banners';
  if (desktopBannerUrl) wrapper.classList.add('bundle-banners--has-desktop');
  if (mobileBannerUrl) wrapper.classList.add('bundle-banners--has-mobile');

  appendBannerImage(documentRef, wrapper, desktopBannerUrl, 'bundle-banner-image bundle-banner-image--desktop');
  appendBannerImage(documentRef, wrapper, mobileBannerUrl, 'bundle-banner-image bundle-banner-image--mobile');

  return wrapper;
}

export function createStepBannerImageElement(step = {}, escapeHtml = value => value, documentRef = document) {
  if (!step.bannerImageUrl) return null;

  const wrapper = documentRef.createElement('div');
  wrapper.className = 'step-banner-image';

  const img = documentRef.createElement('img');
  img.src = step.bannerImageUrl;
  img.alt = escapeHtml(step.name || '');
  wrapper.appendChild(img);

  return wrapper;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBundleBannerElement,
    createStepBannerImageElement,
  };
}
