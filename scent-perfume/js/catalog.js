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
          ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.brand)} ${escapeHTML(p.name)}" loading="lazy" class="product__img" data-action="gallery" data-product-id="${p.id}" />`
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

  // Event delegation
  grid.addEventListener('click', function gridClick(e) {
    // Кнопка В корзину
    const volumeBtn = e.target.closest('[data-action="volume"]');
    if (volumeBtn) {
      e.preventDefault();
      e.stopPropagation();
      openVolumeSelector(parseInt(volumeBtn.dataset.productId));
      return;
    }
    // Клик по фото — открыть галерею
    const imgEl = e.target.closest('[data-action="gallery"]');
    if (imgEl) {
      e.preventDefault();
      e.stopPropagation();
      openGallery(parseInt(imgEl.dataset.productId));
      return;
    }
    // Клик по карточке (не по кнопке и не по фото) — открыть модал
    const card = e.target.closest('.product__card[data-id]');
    if (card && !e.target.closest('button') && !e.target.closest('[data-action]')) {
      openProductModal(parseInt(card.dataset.id));
    }
  });

  renderActiveTags();
}

/* =============================================
   PRODUCT MODAL
   ============================================= */

/* =============================================
   GALLERY — просмотр фото товара
   ============================================= */
function openGallery(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  // Собираем все фото: images[] + image_url как fallback
  const photos = [];
  if (p.images && p.images.length > 0) {
    p.images.forEach(img => { if (img) photos.push(img); });
  }
  if (photos.length === 0 && p.image) photos.push(p.image);
  if (photos.length === 0) { openProductModal(id); return; }

  let current = 0;

  const overlay = document.createElement('div');
  overlay.id = 'galleryOverlay';
  overlay.className = 'gallery-overlay';
  overlay.innerHTML = `
    <div class="gallery-modal">
      <button class="gallery-close" id="galleryClose" aria-label="Закрыть">×</button>

      <div class="gallery-img-wrap">
        <img src="${escapeHTML(photos[0])}" alt="${escapeHTML(p.brand)} ${escapeHTML(p.name)}" class="gallery-img" id="galleryImg" />
        ${photos.length > 1 ? `
          <button class="gallery-nav gallery-nav--prev" id="galleryPrev" aria-label="Назад">‹</button>
          <button class="gallery-nav gallery-nav--next" id="galleryNext" aria-label="Вперёд">›</button>
        ` : ''}
      </div>

      ${photos.length > 1 ? `
        <div class="gallery-dots" id="galleryDots" style="position:relative;z-index:2">
          ${photos.map((_, i) => `<span class="gallery-dot${i === 0 ? ' gallery-dot--active' : ''}" data-idx="${i}"></span>`).join('')}
        </div>
      ` : ''}

      <div class="gallery-info">
        <div>
          <p class="gallery-brand">${escapeHTML(p.brand)}</p>
          <p class="gallery-name">${escapeHTML(p.name)}</p>
          <p class="gallery-price">${getDisplayPrice(p)}</p>
        </div>
        <button class="btn btn--gold gallery-add" data-action="gallery-volume" data-product-id="${p.id}">
          В корзину
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  bodyLock('gallery');

  function goTo(idx) {
    current = (idx + photos.length) % photos.length;
    const img = overlay.querySelector('#galleryImg');
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = photos[current];
      img.style.opacity = '1';
    }, 150);
    overlay.querySelectorAll('.gallery-dot').forEach((d, i) => {
      d.classList.toggle('gallery-dot--active', i === current);
    });
  }

  function closeGallery() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 300);
    bodyUnlock('gallery');
  }

  overlay.querySelector('#galleryClose').addEventListener('click', closeGallery);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGallery(); });

  const prevBtn = overlay.querySelector('#galleryPrev');
  const nextBtn = overlay.querySelector('#galleryNext');
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  // Dots
  overlay.querySelectorAll('.gallery-dot').forEach(dot => {
    dot.addEventListener('click', () => goTo(parseInt(dot.dataset.idx)));
  });

  // Кнопка В корзину
  overlay.querySelector('.gallery-add').addEventListener('click', () => {
    closeGallery();
    setTimeout(() => openVolumeSelector(id), 50);
  });

  // Свайп на мобиле
  let touchX = 0;
  overlay.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });

  // Клавиатура
  const onKey = e => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'Escape')     { closeGallery(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

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
      ${p.image ? `<div class="modal__img-wrap modal__img-wrap--clickable" data-action="modal-volume" data-product-id="${p.id}" title="Нажмите чтобы выбрать объём"><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.brand)} ${escapeHTML(p.name)}" loading="lazy"><div class="modal__img-hint">Нажмите для заказа</div></div>` : ''}
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

        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  overlay.querySelector('#modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) { closeModal(); return; }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'modal-volume') {
      const pid = parseInt(btn.dataset.productId);
      closeModal();
      setTimeout(() => openVolumeSelector(pid), 50);
    }
    if (btn.dataset.action === 'modal-wa') {
      handleOrder(parseInt(btn.dataset.productId));
    }
  });
  const esc = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);

  function closeModal() {
    overlay.classList.remove('open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
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
      document.body.style.overflow = isOpen ? 'hidden' : '';
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
