/**
 * Scent Perfume Bar — catalog.js (обновлённый)
 * Теперь работает с данными из api.js (Supabase)
 * PRODUCTS_DATA заполняется асинхронно в api.js → initCatalog() вызывается оттуда
 */

'use strict';

/* =============================================
   PRICE HELPER
   ============================================= */
function getProductMinPrice(p) {
  if (p.pricePerMl) return p.pricePerMl * 5;
  if (p.fullBottle) return p.fullBottle.price;
  return 0;
}

/* =============================================
   STATE
   ============================================= */
const state = {
  products: [],
  filters: {
    search:    '',
    category:  'all',
    maxPrice:  200000,
    scentTypes: []
  },
  sort: 'default'
};

/* =============================================
   INIT — вызывается из api.js после загрузки
   ============================================= */
function initCatalog() {
  state.products = PRODUCTS_DATA;  // заполнено в api.js
  bindFilterEvents();
  renderCatalog();
}

/* =============================================
   FILTER + SORT LOGIC
   ============================================= */
function getFilteredProducts() {
  let result = [...state.products];

  if (state.filters.search) {
    const q = state.filters.search.toLowerCase().trim();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q)
    );
  }

  if (state.filters.category !== 'all') {
    result = result.filter(p => p.category === state.filters.category);
  }

  result = result.filter(p => getProductMinPrice(p) <= state.filters.maxPrice);

  if (state.filters.scentTypes.length > 0) {
    result = result.filter(p => state.filters.scentTypes.includes(p.scentType));
  }

  switch (state.sort) {
    case 'price-asc':  result.sort((a, b) => getProductMinPrice(a) - getProductMinPrice(b)); break;
    case 'price-desc': result.sort((a, b) => getProductMinPrice(b) - getProductMinPrice(a)); break;
    case 'name-asc':   result.sort((a, b) => a.name.localeCompare(b.name, 'ru')); break;
  }

  return result;
}

/* =============================================
   RENDER CATALOG
   ============================================= */
function renderCatalog() {
  const grid    = document.getElementById('catalogGrid');
  const emptyEl = document.getElementById('catalogEmpty');
  const countEl = document.getElementById('catalogCount');
  if (!grid) return;

  const products = getFilteredProducts();

  if (countEl) {
    countEl.innerHTML = `Найдено: <strong>${products.length}</strong> ${declProduct(products.length)}`;
  }

  if (products.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  grid.innerHTML = products.map(p => `
    <div class="product__card" data-id="${p.id}" tabindex="0" role="button" aria-label="Открыть ${escapeHTML(p.brand)} ${escapeHTML(p.name)}">
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

  // Event delegation — Android fix (onclick в innerHTML ненадёжен)
  grid.removeEventListener('click', catalogGridClick);
  grid.addEventListener('click', catalogGridClick);

  renderActiveTags();
}


/* ─── EVENT DELEGATION каталог (Android fix) ─────────────── */
function catalogGridClick(e) {
  // Кнопка "В корзину"
  const btn = e.target.closest('[data-action="volume"]');
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    openVolumeSelector(parseInt(btn.dataset.productId));
    return;
  }
  // Клик по карточке — открыть модал
  const card = e.target.closest('.product__card[data-id]');
  if (card && !e.target.closest('button') && !e.target.closest('a')) {
    openProductModal(parseInt(card.dataset.id));
  }
}
/* =============================================
   PRODUCT MODAL
   ============================================= */
function openProductModal(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  const existing = document.getElementById('productModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'productModal';
  overlay.className = 'product-modal-overlay';
  overlay.innerHTML = `
    <div class="product-modal">
      <button class="modal__close" id="modalClose" aria-label="Закрыть">×</button>
      ${p.image ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.brand)} ${escapeHTML(p.name)}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;margin-bottom:24px" loading="lazy">` : ''}
      <p class="modal__brand">${escapeHTML(p.brand)}</p>
      <h2 class="modal__name">${escapeHTML(p.name)}</h2>
      <p class="modal__notes">${escapeHTML(p.notes)}</p>
      <p class="modal__desc">${escapeHTML(p.description)}</p>
      <div class="modal__footer">
        <div class="modal__price">
          ${getDisplayPrice(p)}
        </div>
        <div class="modal__actions">
          <button class="btn btn--gold" data-action="modal-volume" data-product-id="${p.id}">
            В корзину
          </button>
          <button class="btn btn--outline" data-action="modal-wa" data-product-id="${p.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  bodyLock('modal');

  overlay.querySelector('#modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) { closeModal(); return; }
    // Delegation для кнопок модала (Android fix)
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.productId);
    if (btn.dataset.action === 'modal-volume') {
      closeModal();
      setTimeout(() => openVolumeSelector(id), 50);
    }
    if (btn.dataset.action === 'modal-wa') {
      handleOrder(id);
    }
  });
  const esc = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);

  function closeModal() {
    overlay.classList.remove('open');
    bodyUnlock('modal');
    if (window.releaseTaps) window.releaseTaps();
    setTimeout(() => overlay.remove(), 300);
  }
}

/* =============================================
   ACTIVE FILTER TAGS
   ============================================= */
function renderActiveTags() {
  const container = document.getElementById('activeFilters');
  if (!container) return;
  const tags = [];

  if (state.filters.search) {
    tags.push({ label: `«${escapeHTML(state.filters.search)}»`, key: 'search' });
  }
  if (state.filters.category !== 'all') {
    const labels = { women: 'Женские', men: 'Мужские', unisex: 'Унисекс' };
    tags.push({ label: labels[state.filters.category], key: 'category' });
  }
  if (state.filters.maxPrice < 200000) {
    tags.push({ label: `до ${state.filters.maxPrice.toLocaleString('ru')} ₸`, key: 'price' });
  }
  state.filters.scentTypes.forEach(type => {
    const labels = { oriental: 'Восточный', floral: 'Цветочный', woody: 'Древесный', fresh: 'Свежий', gourmand: 'Гурманский' };
    tags.push({ label: labels[type], key: `scent_${type}` });
  });

  container.innerHTML = tags.map(t => `
    <span class="filter-tag">
      ${t.label}
      <button onclick="removeTag('${t.key}')" aria-label="Убрать фильтр ${t.label}">×</button>
    </span>`).join('');
}

function removeTag(key) {
  if (key === 'search') {
    state.filters.search = '';
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
  } else if (key === 'category') {
    state.filters.category = 'all';
    document.querySelector('input[name="category"][value="all"]').checked = true;
  } else if (key === 'price') {
    state.filters.maxPrice = 200000;
    const range = document.getElementById('priceRange');
    if (range) { range.value = 200000; updatePriceDisplay(200000); }
  } else if (key.startsWith('scent_')) {
    const type = key.replace('scent_', '');
    state.filters.scentTypes = state.filters.scentTypes.filter(t => t !== type);
    const cb = document.querySelector(`input[name="scentType"][value="${type}"]`);
    if (cb) cb.checked = false;
  }
  renderCatalog();
}

function resetAllFilters() {
  state.filters = { search: '', category: 'all', maxPrice: 200000, scentTypes: [] };
  state.sort = 'default';

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  const allRadio = document.querySelector('input[name="category"][value="all"]');
  if (allRadio) allRadio.checked = true;

  const priceRange = document.getElementById('priceRange');
  if (priceRange) { priceRange.value = 200000; updatePriceDisplay(200000); }

  document.querySelectorAll('input[name="scentType"]').forEach(cb => cb.checked = false);

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'default';

  renderCatalog();
}

/* =============================================
   BIND FILTER EVENTS (once, after DOM ready)
   ============================================= */
function bindFilterEvents() {
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.filters.search = searchInput.value;
        renderCatalog();
      }, 250);
    });
  }

  // Category radio
  document.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.filters.category = radio.value;
      renderCatalog();
    });
  });

  // Price range
  const priceRange = document.getElementById('priceRange');
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      state.filters.maxPrice = parseInt(priceRange.value);
      updatePriceDisplay(state.filters.maxPrice);
      renderCatalog();
    });
  }

  // Scent type checkboxes
  document.querySelectorAll('input[name="scentType"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        if (!state.filters.scentTypes.includes(cb.value)) {
          state.filters.scentTypes.push(cb.value);
        }
      } else {
        state.filters.scentTypes = state.filters.scentTypes.filter(t => t !== cb.value);
      }
      renderCatalog();
    });
  });

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      renderCatalog();
    });
  }

  // Reset button
  const resetBtn = document.getElementById('filtersReset');
  if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);

  // Mobile filters toggle
  const filtersToggle = document.getElementById('filtersToggle');
  const filtersPanel  = document.getElementById('filters');
  if (filtersToggle && filtersPanel) {
    filtersToggle.addEventListener('click', () => {
      const isOpen = filtersPanel.classList.toggle('filters--open');
      filtersToggle.setAttribute('aria-expanded', isOpen);
      isOpen ? bodyLock('filters') : bodyUnlock('filters');
      if (!isOpen && window.releaseTaps) window.releaseTaps();
    });
  }
}

/* =============================================
   HELPERS
   ============================================= */
function updatePriceDisplay(val) {
  const display = document.getElementById('priceDisplay');
  if (display) {
    display.textContent = val >= 200000 ? 'до 200 000 ₸' : `до ${val.toLocaleString('ru')} ₸`;
  }
}

function declProduct(n) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs > 10 && abs < 20) return 'товаров';
  if (mod === 1) return 'товар';
  if (mod >= 2 && mod <= 4) return 'товара';
  return 'товаров';
}

function handleOrder(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  const msg = `Здравствуйте! Хочу заказать:\n\n*${product.brand} — ${product.name}*\n${product.notes}\n\nПодскажите наличие и условия доставки.`;
  window.open(`https://wa.me/77071210281?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}
