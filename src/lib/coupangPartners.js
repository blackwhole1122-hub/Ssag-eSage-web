'use client';

let loadPromise = null;
let sanitizerInstalled = false;

function isCoupangFrame(node) {
  return (
    node &&
    node.nodeType === 1 &&
    node.tagName === 'IFRAME' &&
    typeof node.src === 'string' &&
    node.src.includes('ads-partners.coupang.com')
  );
}

function cleanupRogueCoupangFrames() {
  if (typeof document === 'undefined') return;

  const allFrames = document.querySelectorAll('iframe');
  allFrames.forEach((frame) => {
    if (!isCoupangFrame(frame)) return;
    const slot = frame.closest('[data-coupang-slot="true"]');
    if (!slot) {
      frame.remove();
      return;
    }

    const slotFrames = slot.querySelectorAll('iframe');
    slotFrames.forEach((sf, idx) => {
      if (idx > 0 && isCoupangFrame(sf)) sf.remove();
    });
  });
}

function installCoupangSanitizer() {
  if (typeof window === 'undefined' || sanitizerInstalled) return;
  sanitizerInstalled = true;
  cleanupRogueCoupangFrames();

  const observer = new MutationObserver(() => {
    cleanupRogueCoupangFrames();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function loadCoupangPartners() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  installCoupangSanitizer();
  if (window.PartnersCoupang?.G) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-coupang-partners="true"]');

    if (existing) {
      existing.addEventListener('load', () => resolve(!!window.PartnersCoupang?.G), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://ads-partners.coupang.com/g.js';
    script.async = true;
    script.dataset.coupangPartners = 'true';
    script.onload = () => resolve(!!window.PartnersCoupang?.G);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return loadPromise;
}

function getSlotSet() {
  if (typeof window === 'undefined') return null;
  if (!window.__coupangSlotLocks) window.__coupangSlotLocks = new Set();
  return window.__coupangSlotLocks;
}

export function acquireCoupangSlot(slotKey) {
  const slots = getSlotSet();
  if (!slots) return false;
  if (slots.has(slotKey)) return false;
  slots.add(slotKey);
  return true;
}

export function releaseCoupangSlot(slotKey) {
  const slots = getSlotSet();
  if (!slots) return;
  slots.delete(slotKey);
}
