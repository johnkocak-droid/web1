'use strict';

const PHOTO_BASE = 'https://empirecastinghouse.com/wp-content/uploads/2025/03/';
const fallbackImage = 'assets/hoop-illustration.svg';
const productDetails = {
  '20': { name: 'The Petite Hoop', description: 'A refined, understated hoop designed for just a hint of sparkle.' },
  '24': { name: 'The Classic Hoop', description: 'That effortless everyday statement: polished, versatile, and just the right presence.' },
  '28': { name: 'The Signature Hoop', description: 'Beautifully balanced with a little more personality. A true modern classic.' },
  '35': { name: 'The Statement Hoop', description: 'A bolder silhouette for the moments you want to make your own.' }
};
const sizes = Object.keys(productDetails);
const storageKey = 'twistlock_inquiry_bag_v1';
let currentSize = '24';
let bag = [];
let lastFocusedElement = null;
let toastTimeout;

function loadBag() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) {
      bag = saved.filter(item => item && sizes.includes(String(item.size)) && Number.isInteger(item.quantity) && item.quantity > 0)
        .map(item => ({ size: String(item.size), quantity: Math.min(item.quantity, 99) }));
    }
  } catch (error) { bag = []; }
}
function saveBag() { try { localStorage.setItem(storageKey, JSON.stringify(bag)); } catch (error) { /* Storage can be unavailable for local files. */ } }
function bagCount() { return bag.reduce((total, item) => total + item.quantity, 0); }
function announce(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3300);
}
function openBag() {
  lastFocusedElement = document.activeElement;
  document.getElementById('bag-overlay').hidden = false;
  const drawer = document.getElementById('bag-drawer');
  drawer.inert = false;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('close-bag').focus();
}
function closeBag() {
  const drawer = document.getElementById('bag-drawer');
  drawer.classList.remove('is-open');
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');
  document.getElementById('bag-overlay').hidden = true;
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
}
function renderBag() {
  const count = bagCount();
  document.getElementById('bag-count').textContent = String(count);
  document.getElementById('bag-title-count').textContent = `(${count})`;
  document.getElementById('bag-submit').disabled = count === 0;
  const content = document.getElementById('bag-items');
  if (!count) {
    content.innerHTML = `<div class="bag-empty"><span class="empty-orbit">◯</span><h3>A beautiful beginning.</h3><p>Your inquiry bag is empty. Find a hoop to make your own.</p><button class="button button-dark" id="empty-shop">Explore the collection <span aria-hidden="true">↗</span></button></div>`;
    document.getElementById('empty-shop').addEventListener('click', () => { closeBag(); document.getElementById('collection').scrollIntoView({behavior:'smooth'}); });
    return;
  }
  content.innerHTML = bag.map(item => `
    <div class="bag-item">
      <img src="${PHOTO_BASE}${item.size}mm.jpg" alt="${item.size} mm EAR200 hoop" onerror="this.onerror=null;this.src='${fallbackImage}'">
      <div><p>EAR200 / ${item.size} MM</p><h3>${productDetails[item.size].name}</h3><div class="bag-item-actions"><div class="quantity" aria-label="Quantity for ${item.size} mm hoop"><button data-change-size="${item.size}" data-delta="-1" aria-label="Reduce quantity">−</button><span>${item.quantity}</span><button data-change-size="${item.size}" data-delta="1" aria-label="Increase quantity">+</button></div><button class="remove-item" data-remove-size="${item.size}" aria-label="Remove ${item.size} mm hoop">Remove</button></div></div>
    </div>`).join('');
  content.querySelectorAll('[data-change-size]').forEach(button => button.addEventListener('click', () => changeQuantity(button.dataset.changeSize, Number(button.dataset.delta))));
  content.querySelectorAll('[data-remove-size]').forEach(button => button.addEventListener('click', () => removeItem(button.dataset.removeSize)));
}
function addToBag(size) {
  if (!sizes.includes(String(size))) return;
  const item = bag.find(item => item.size === String(size));
  if (item) item.quantity = Math.min(item.quantity + 1, 99);
  else bag.push({size: String(size), quantity: 1});
  saveBag(); renderBag(); announce(`${size} mm hoop added to your inquiry bag`); openBag();
}
function changeQuantity(size, delta) {
  const item = bag.find(item => item.size === size);
  if (!item) return;
  item.quantity = Math.max(0, Math.min(99, item.quantity + delta));
  if (item.quantity === 0) bag = bag.filter(item => item.size !== size);
  saveBag(); renderBag();
}
function removeItem(size) { bag = bag.filter(item => item.size !== size); saveBag(); renderBag(); }
function makeEmail(subject, lines) {
  return `mailto:info@empirecastinghouse.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
function sendBagInquiry() {
  if (!bag.length) return;
  const lines = ['Hello Empire Casting House,', '', 'I would like to inquire about these TwistLock™ EAR200 hoop earrings:', '',
    ...bag.map(item => `• ${item.size} mm — ${productDetails[item.size].name} — Quantity: ${item.quantity}`),
    '', 'Please confirm available metals/finishes, pricing, and lead times.', '', 'Name:', 'Company (if applicable):', 'Phone:', '', 'Thank you!'];
  announce('Opening your email app with your inquiry ready to send');
  window.location.href = makeEmail('TwistLock™ EAR200 Collection Inquiry', lines);
}
function showSize(size) {
  if (!sizes.includes(String(size))) return;
  currentSize = String(size);
  const info = productDetails[currentSize];
  document.getElementById('size-display').innerHTML = `${size}<span>mm</span>`;
  document.getElementById('size-name').textContent = info.name;
  document.getElementById('size-description').textContent = info.description;
  document.getElementById('size-measure-label').textContent = `${size} MM`;
  const image = document.getElementById('size-image');
  image.style.opacity = '0.3';
  image.onerror = function () { this.onerror = null; this.src = fallbackImage; };
  image.onload = function () { this.style.opacity = '1'; };
  image.src = `${PHOTO_BASE}${size}mm.jpg`;
  image.alt = `${size} mm TwistLock hoop earring`;
  document.querySelectorAll('[data-preview-size]').forEach(btn => {
    const active = btn.dataset.previewSize === size;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}
function setupMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle.addEventListener('click', () => {
    const isOpening = menu.hidden;
    menu.hidden = !isOpening;
    toggle.setAttribute('aria-expanded', String(isOpening));
    toggle.setAttribute('aria-label', isOpening ? 'Close menu' : 'Open menu');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.hidden = true; toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Open menu');
  }));
}
function init() {
  document.getElementById('year').textContent = String(new Date().getFullYear());
  loadBag(); renderBag(); setupMenu();
  document.getElementById('open-bag').addEventListener('click', openBag);
  document.getElementById('close-bag').addEventListener('click', closeBag);
  document.getElementById('bag-overlay').addEventListener('click', closeBag);
  document.getElementById('bag-submit').addEventListener('click', sendBagInquiry);
  document.getElementById('size-add').addEventListener('click', () => addToBag(currentSize));
  document.querySelectorAll('[data-size]').forEach(btn => btn.addEventListener('click', () => addToBag(btn.dataset.size)));
  document.querySelectorAll('[data-preview-size]').forEach(btn => btn.addEventListener('click', () => showSize(btn.dataset.previewSize)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('bag-drawer').classList.contains('is-open')) closeBag();
    if (event.key === 'Tab' && document.getElementById('bag-drawer').classList.contains('is-open')) {
      const elements = [...document.querySelectorAll('#bag-drawer button:not([disabled]),#bag-drawer a[href]')];
      if (elements.length) {
        const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
  });
  document.getElementById('contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get('name')||'').trim();
    const email = String(fields.get('email')||'').trim();
    const topic = String(fields.get('topic')||'Collection inquiry');
    const message = String(fields.get('message')||'').trim();
    if (!name || !email || !message) return;
    const lines = ['Hello Empire Casting House,', '',message,'',`Name: ${name}`,`Email: ${email}`,`Inquiry type: ${topic}`,'', 'Sent from the TwistLock™ website.'];
    announce('Opening your email app with your message ready to send');
    window.location.href = makeEmail(`TwistLock™ — ${topic}`, lines);
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
