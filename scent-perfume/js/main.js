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
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─── MOBILE MENU ────────────────────────────────────────────── */
function initMobileMenu() {
  const burger = document.getElementById('navBurger');
  const links  = document.getElementById('navLinks');
  if (!burger || !links) return;
  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    burger.classList.toggle('active', isOpen);
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      burger.classList.remove('active');
      document.body.style.overflow = '';
    });
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
              data-product-id="${p.id}"
              onclick="event.stopPropagation();openVolumeSelector(${p.id})"
              aria-label="Выбрать объём"
            >В корзину</button>
            <button
              class="product__order-btn product__btn--wa"
              onclick="event.stopPropagation();handleOrder(${p.id})"
              aria-label="WhatsApp"
              title="Заказать через WhatsApp"
            ><svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  initReveal();
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
