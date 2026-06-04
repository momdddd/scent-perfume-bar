/**
 * volume-selector.js
 * Модальное окно выбора: мл или флакон
 * + анимация полёта в корзину
 */

'use strict';

/* =============================================
   BOTTLE OPTIONS — варианты флаконов
   Цена флакона добавляется к стоимости мл
   ============================================= */
const BOTTLE_OPTIONS = [
  {
    id: 'basic',
    icon: '◈',
    name: 'Базовый атомайзер',
    desc: 'Пластиковый спрей, удобен для сумки',
    price: 800
  },
  {
    id: 'glass',
    icon: '◆',
    name: 'Стеклянный атомайзер',
    desc: 'Матовое стекло, металлический спрей',
    price: 2500
  },
  {
    id: 'luxury',
    icon: '✦',
    name: 'Люкс флакон',
    desc: 'Тёмное стекло с золотым распылителем',
    price: 5500
  }
];

/* =============================================
   STATE
   ============================================= */
let volState = {
  product: null,
  mode: 'ml',       // 'ml' | 'bottle'
  ml: 10,
  bottleId: 'none'
};

/* =============================================
   OPEN MODAL
   ============================================= */
function openVolumeSelector(productId) {
  // Find product — works from both catalog state and PRODUCTS_DATA
  const source = (typeof state !== 'undefined' && state.products?.length)
    ? state.products
    : (typeof allProducts !== 'undefined' && allProducts?.length)
      ? allProducts
      : (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);

  const product = source.find(p => p.id === productId);
  if (!product) return;

  volState.product  = product;
  volState.mode     = 'ml';
  volState.ml       = 10;
  volState.bottleId = 'basic';

  renderVolModal(product);

  const overlay = document.getElementById('volOverlay');
  if (overlay) {
    overlay.classList.add('open');
document.documentElement.style.overflow = 'hidden';
document.body.style.overflow = 'hidden';
    
    // focus trap
    setTimeout(() => overlay.querySelector('.vol-modal__close')?.focus(), 100);
  }
}

function closeVolumeSelector() {
  const overlay = document.getElementById('volOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.documentElement.style.overflow = '';
document.body.style.overflow = '';
  }
}

/* =============================================
   RENDER MODAL CONTENT
   ============================================= */
function renderVolModal(product) {
  const existing = document.getElementById('volOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'volOverlay';
  overlay.className = 'vol-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Выбор объёма — ${product.name}`);

  overlay.innerHTML = `
    <div class="vol-modal" id="volModal">
      <div class="vol-modal__handle"></div>
      <button class="vol-modal__close" id="volClose" aria-label="Закрыть">×</button>

      <p class="vol-modal__brand">${escapeHTML(product.brand)}</p>
      <h2 class="vol-modal__name">${escapeHTML(product.name)}</h2>
      <p class="vol-modal__notes">${escapeHTML(product.notes)}</p>

      <!-- TABS -->
      <div class="vol-tabs">
        <button class="vol-tab active" data-tab="ml">По миллилитрам</button>
        <button class="vol-tab" data-tab="bottle">Флакон целиком</button>
      </div>

      <!-- ML PANEL -->
      <div class="vol-panel active" id="panelMl">
        <div class="ml-presets" id="mlPresets">
          ${[5,10,15,20,25].map(v => `
            <button class="ml-preset ${v === 10 ? 'selected' : ''}" data-ml="${v}">${v} мл</button>
          `).join('')}
          <button class="ml-preset" data-ml="custom">Другой</button>
        </div>

        <div class="ml-custom-wrap" id="mlCustomWrap" style="display:none">
          <span class="ml-custom-label">Объём</span>
          <input
            type="range"
            class="ml-slider"
            id="mlSlider"
            min="5"
            max="50"
            step="1"
            value="10"
          />
          <span class="ml-value-display" id="mlDisplay">10 мл</span>
        </div>

        <h3 style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;font-weight:400">Флакон (опционально)</h3>
        <div class="bottle-options" id="bottleOptsMl">
          ${BOTTLE_OPTIONS.map(b => `
            <button class="bottle-opt ${b.id === 'basic' ? 'selected' : ''}" data-bottle="${b.id}">
              <span class="bottle-opt__icon">${b.icon}</span>
              <span class="bottle-opt__info">
                <span class="bottle-opt__name">${escapeHTML(b.name)}</span>
                <span class="bottle-opt__desc">${escapeHTML(b.desc)}</span>
              </span>
              <span class="bottle-opt__price">${b.price > 0 ? '+' + b.price.toLocaleString('ru') + ' ₸' : 'Бесплатно'}</span>
            </button>
          `).join('')}
        </div>
      </div>



      <!-- BOTTLE PANEL -->
      <div class="vol-panel" id="panelBottle">
        ${product.fullBottle ? `
          <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:20px;margin-bottom:20px">
            <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:8px">Оригинальный флакон</p>
            <p style="font-family:var(--font-display);font-size:1.6rem;font-weight:300;color:var(--white)">
              ${product.fullBottle.volume} мл
            </p>
            <p style="font-size:.8rem;color:var(--white-30);margin-top:4px">Оригинальная упаковка бренда</p>
          </div>
        ` : '<p style="color:var(--white-30);font-size:.9rem;margin-bottom:20px">Флакон целиком недоступен для этой позиции</p>'}
      </div>
      <div class="vol-price-summary">
        <div>
          <p class="vol-price-label">Итого</p>
          <p class="vol-price-sub" id="volPriceSub">10 мл · без флакона</p>
        </div>
        <div class="vol-price-value" id="volPriceValue">—</div>
      </div>

      <!-- ADD BUTTON -->
      <button class="btn btn--gold vol-add-btn" id="volAddBtn">
        Добавить в корзину
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  updateVolPrice();
  bindVolEvents(product);

  // Open with animation
  requestAnimationFrame(() => overlay.classList.add('open'));
}

/* =============================================
   BIND EVENTS INSIDE MODAL
   ============================================= */
function bindVolEvents(product) {
  // Close
  document.getElementById('volClose').addEventListener('click', closeVolumeSelector);
  document.getElementById('volOverlay').addEventListener('click', e => {
    if (e.target.id === 'volOverlay') closeVolumeSelector();
  });

  // Escape key
  const escHandler = e => { if (e.key === 'Escape') { closeVolumeSelector(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);

  // Tabs
  document.querySelectorAll('.vol-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.vol-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      volState.mode = tab.dataset.tab;

      document.getElementById('panelMl').classList.toggle('active', volState.mode === 'ml');
      document.getElementById('panelBottle').classList.toggle('active', volState.mode === 'bottle');
      updateVolPrice();
    });
  });

  // ML presets
  document.querySelectorAll('.ml-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ml-preset').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      const customWrap = document.getElementById('mlCustomWrap');
      if (btn.dataset.ml === 'custom') {
        customWrap.style.display = 'flex';
      } else {
        customWrap.style.display = 'none';
        volState.ml = parseInt(btn.dataset.ml);
        updateVolPrice();
      }
    });
  });

  // ML slider
  const slider = document.getElementById('mlSlider');
  if (slider) {
    slider.addEventListener('input', () => {
      const v = parseInt(slider.value);
      volState.ml = v;
      document.getElementById('mlDisplay').textContent = v + ' мл';
      // Update slider fill
      const pct = ((v - 5) / (50 - 5)) * 100;
      slider.style.background = `linear-gradient(to right, var(--gold) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
      updateVolPrice();
    });
  }

  // Bottle options
  document.querySelectorAll('.bottle-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bottle-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      volState.bottleId = btn.dataset.bottle;
      updateVolPrice();
    });
  });

  // Add to cart
  document.getElementById('volAddBtn').addEventListener('click', () => {
    addVolToCart(product);
  });

  // Swipe down to close (mobile)
  let startY = 0;
  const modal = document.getElementById('volModal');
  modal.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  modal.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - startY > 80) closeVolumeSelector();
  }, { passive: true });
}

/* =============================================
   PRICE CALCULATION
   ============================================= */
function calcVolPrice() {
  const p = volState.product;
  if (!p) return 0;

  if (volState.mode === 'bottle') {
    return p.fullBottle ? p.fullBottle.price : 0;
  }

  // ml mode
  const mlPrice     = (p.pricePerMl || 0) * volState.ml;
  const bottlePrice = BOTTLE_OPTIONS.find(b => b.id === volState.bottleId)?.price || 0;
  return mlPrice + bottlePrice;
}

function updateVolPrice() {
  const total    = calcVolPrice();
  const priceEl  = document.getElementById('volPriceValue');
  const subEl    = document.getElementById('volPriceSub');
  const addBtn   = document.getElementById('volAddBtn');
  if (!priceEl) return;

  priceEl.textContent = total > 0 ? total.toLocaleString('ru') + ' ₸' : '—';

  if (subEl) {
    if (volState.mode === 'ml') {
      const bottleName = BOTTLE_OPTIONS.find(b => b.id === volState.bottleId)?.name || '';
      subEl.textContent = `${volState.ml} мл · ${bottleName}`;
    } else {
      const p = volState.product;
      subEl.textContent = p?.fullBottle ? `${p.fullBottle.volume} мл · оригинальный флакон` : '—';
    }
  }

  if (addBtn) {
    addBtn.disabled = total === 0;
    addBtn.style.opacity = total === 0 ? '0.4' : '1';
  }
}

/* =============================================
   ADD CONFIGURED ITEM TO CART
   ============================================= */
function addVolToCart(product) {
  const price = calcVolPrice();
  if (price === 0) return;

  const bottle = BOTTLE_OPTIONS.find(b => b.id === volState.bottleId);

  let volume, label;
  if (volState.mode === 'bottle') {
    volume = `${product.fullBottle.volume}ml (флакон)`;
    label  = 'Флакон целиком';
  } else {
    volume = `${volState.ml}ml`;
    label  = volState.bottleId !== 'none' ? `+ ${bottle.name}` : 'Без флакона';
  }

  // Unique cart key: productId + volume config
  const cartKey = `${product.id}_${volState.mode}_${volState.ml}_${volState.bottleId}`;

  const cartItem = {
    id:       cartKey,
    productId: product.id,
    brand:    product.brand,
    name:     product.name,
    notes:    product.notes,
    image:    product.image,
    volume,
    label,
    price,
    qty: 1
  };

  // Add to cart (merge if same config)
  const cart = getCart();
  const existing = cart.find(i => i.id === cartKey);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push(cartItem);
  }
  saveCart(cart);
  updateCartCount();

  // Animate
  flyToCart();
  showCartToast(`${product.name} · ${volume}`);

  // Close modal after short delay
  setTimeout(closeVolumeSelector, 600);
}

/* =============================================
   FLY TO CART ANIMATION
   ============================================= */
function flyToCart() {
  const cartIcon = document.querySelector('.nav__cart');
  if (!cartIcon) return;

  const cartRect = cartIcon.getBoundingClientRect();

  const addBtn = document.getElementById('volAddBtn');
  let startX = window.innerWidth / 2;
  let startY = window.innerHeight * 0.75;
  if (addBtn) {
    const r = addBtn.getBoundingClientRect();
    startX = r.left + r.width / 2;
    startY = r.top + r.height / 2;
  }

  const endX = cartRect.left + cartRect.width / 2;
  const endY = cartRect.top  + cartRect.height / 2;

  // Spawn multiple trail dots for a beautiful arc
  const trailCount = 6;
  for (let i = 0; i < trailCount; i++) {
    const delay = i * 60;
    const dot = document.createElement('div');
    dot.className = 'cart-fly-dot';
    const scale = 1 - i * 0.12;
    dot.style.cssText = `
      left: ${startX - 7}px;
      top: ${startY - 7}px;
      transform: scale(${scale});
      opacity: ${1 - i * 0.1};
      width: ${14 - i * 1.5}px;
      height: ${14 - i * 1.5}px;
    `;
    document.body.appendChild(dot);

    // Control point for bezier curve — arc upward
    const cpX = startX + (endX - startX) * 0.3 - 80;
    const cpY = Math.min(startY, endY) - 120;

    setTimeout(() => {
      dot.animate([
        {
          left: startX - 7 + 'px',
          top: startY - 7 + 'px',
          transform: `scale(${scale})`,
          opacity: String(1 - i * 0.1),
          offset: 0
        },
        {
          left: cpX - 7 + 'px',
          top: cpY + 'px',
          transform: `scale(${scale * 0.85})`,
          opacity: String(0.8 - i * 0.08),
          offset: 0.45
        },
        {
          left: endX - 7 + 'px',
          top: endY - 7 + 'px',
          transform: 'scale(0.05)',
          opacity: '0',
          offset: 1
        }
      ], {
        duration: 900,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      }).onfinish = () => {
        dot.remove();
        if (i === 0) {
          cartIcon.classList.add('shake');
          setTimeout(() => cartIcon.classList.remove('shake'), 600);
          const countEl = document.getElementById('cartCount');
          if (countEl) {
            countEl.classList.add('bump');
            setTimeout(() => countEl.classList.remove('bump'), 400);
          }
        }
      };
    }, delay);
  }
}

/* =============================================
   TOAST NOTIFICATION
   ============================================= */
let toastTimer;
function showCartToast(text) {
  let toast = document.getElementById('cartToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cartToast';
    toast.className = 'cart-toast';
    toast.innerHTML = '<span class="cart-toast__dot"></span><span id="cartToastText"></span>';
    document.body.appendChild(toast);
  }

  document.getElementById('cartToastText').textContent = `✓ Добавлено: ${text}`;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* =============================================
   EXPOSE GLOBAL — called from product card buttons
   ============================================= */
window.openVolumeSelector = openVolumeSelector;
