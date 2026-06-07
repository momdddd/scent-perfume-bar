/**
 * Scent Perfume Bar — main.js (обновлённый)
 * loadProducts() теперь вызывается из api.js после загрузки данных
 * PRODUCTS_DATA — глобальный массив, заполняется в api.js
 */

'use strict';

/* ─── XSS Protection ─────────────────────────────────────────── */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/* ─── CART UTILS ─────────────────────────────────────────────── */
function getCart() {
  try { return JSON.parse(localStorage.getItem('scent_cart')) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('scent_cart', JSON.stringify(cart));
}
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) { existing.qty += 1; }
  else { cart.push({ ...product, qty: 1 }); }
  saveCart(cart);
  updateCartCount();
  showAddedFeedback(product.id);
}
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = total;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 300);
  });
}
function showAddedFeedback(productId) {
  const btn = document.querySelector(`[data-product-id="${productId}"]`);
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = '✓ Добавлено';
  btn.style.background = 'var(--gold)';
  btn.style.color = 'var(--black)';
  setTimeout(() => { btn.textContent = original; btn.style.background = ''; btn.style.color = ''; }, 1500);
}

/* ─── WHATSAPP ───────────────────────────────────────────────── */
function orderViaWhatsApp(product) {
  const msg = `Здравствуйте! Хочу заказать:\n\n*${product.brand} — ${product.name}*\n${product.volume} | ${product.price.toLocaleString('ru')} ₸\n\nПодскажите наличие и условия доставки.`;
  window.open(`https://wa.me/77071210281?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

/* ─── PARTICLES ──────────────────────────────────────────────── */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = window.innerWidth < 600 ? 12 : 24;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;top:${40+Math.random()*60}%;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;animation-duration:${4+Math.random()*6}s;animation-delay:${Math.random()*5}s;`;
    container.appendChild(p);
  }
}

/* ─── SCROLL ANIMATIONS ──────────────────────────────────────── */
function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
        entry.target.style.transitionDelay = `${siblings.indexOf(entry.target) * 80}ms`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(el => observer.observe(el));
}

/* ─── HEADER ─────────────────────────────────────────────────── */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  // FIX #2: На внутренних страницах класс scrolled стоит статично в HTML.
  // Если его динамически убирать/добавлять при скролле — backdrop-filter
  // на хедере мигает и ломает position:fixed у Drawer (backdrop-filter
  // создаёт новый stacking context, и fixed-потомки прибиваются к хедеру).
  // Решение: на таких страницах не трогаем класс вообще.
  if (header.classList.contains('scrolled')) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─── MOBILE DRAWER (снизу) ──────────────────────────────────── */
function initMobileMenu() {
  const burger  = document.getElementById('navBurger');
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('navOverlay');
  if (!burger || !drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    burger.classList.add('active');
    burger.setAttribute('aria-label', 'Закрыть меню');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    burger.classList.remove('active');
    burger.setAttribute('aria-label', 'Открыть меню');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);

  // Swipe-to-close только на ручке (не на всём drawer — иначе ест тапы по ссылкам)
  const handle = drawer.querySelector('.nav__drawer-handle');
  if (handle) {
    let startY = 0;
    handle.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
    handle.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - startY > 40) closeDrawer();
    }, { passive: true });
  }

  // Ссылки — только click, без touchend (touchend + click = двойной вызов)
  drawer.querySelectorAll('.nav__drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ─── HOMEPAGE PRODUCTS ──────────────────────────────────────── */
let allProducts = [];
let activeTab   = 'all';

/**
 * Вызывается из api.js после загрузки PRODUCTS_DATA
 */
function loadProducts() {
  allProducts = PRODUCTS_DATA;
  renderProducts(allProducts);
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `<p style="color:var(--white-30);text-align:center;grid-column:1/-1;padding:40px 0">Нет товаров в этой категории</p>`;
    return;
  }

  const displayProducts = products.slice(0, 8);

  grid.innerHTML = displayProducts.map(p => `
    <div class="product__card reveal" data-id="${p.id}">
      <div class="product__image-wrap">
        ${p.image
          ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.brand)} ${escapeHTML(p.name)}" loading="lazy" />`
          : `<div class="product__placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <span>PHOTO</span>
            </div>`
        }
        ${p.badge ? `<span class="product__badge">${escapeHTML(p.badge)}</span>` : ''}
      </div>
      <div class="product__info">
        <p class="product__brand">${escapeHTML(p.brand)}</p>
        <h3 class="product__name">${escapeHTML(p.name)}</h3>
        <p class="product__notes">${escapeHTML(p.notes)}</p>
        <div class="product__footer">
          <div class="product__price">${getDisplayPrice(p)}</div>
          <div class="product__buy-row">
            <button
              class="product__order-btn"
              data-action="volume"
              data-product-id="${p.id}"
              aria-label="Выбрать объём"
            >В корзину</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  initReveal();

  // Event delegation — работает на Android без onclick
  grid.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action="volume"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      openVolumeSelector(parseInt(btn.dataset.productId));
    }
  });
}

function handleOrder(productId) {
  const product = allProducts.find(p => p.id === productId) ||
                  (typeof state !== 'undefined' && state.products?.find(p => p.id === productId));
  if (!product) return;
  orderViaWhatsApp(product);
}

/* ─── TABS (homepage) ────────────────────────────────────────── */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('tab-btn--active'));
      tab.classList.add('tab-btn--active');
      activeTab = tab.dataset.tab;
      const filtered = activeTab === 'all'
        ? allProducts
        : allProducts.filter(p => p.category === activeTab);
      renderProducts(filtered);
    });
  });
}

/* ─── SMOOTH SCROLL ──────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });
}

/* ─── PRICE DISPLAY HELPER ───────────────────────────────────── */
function getDisplayPrice(p) {
  if (p.pricePerMl) {
    return `<span style="font-size:.75rem;color:var(--white-30)">от</span> ${(p.pricePerMl * 5).toLocaleString('ru')} <span>₸ / 5мл</span>`;
  }
  if (p.fullBottle) {
    return `${p.fullBottle.price.toLocaleString('ru')} <span>₸ / ${p.fullBottle.volume}мл</span>`;
  }
  return '';
}

/* ─── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initReveal();
  initHeader();
  initMobileMenu();
  initTabs();
  initSmoothScroll();
  updateCartCount();
  // loadProducts() и initCatalog() вызываются из api.js — НЕ здесь
});

