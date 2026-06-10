/**
 * Scent Perfume Bar — Cart JS
 * Fixed: checkbox "select all" bug + improved logic
 */

'use strict';

/* =============================================
   CHECKBOX STATE
   null  = not yet initialized (first load → select all)
   Set() = user has interacted (respect their choices)
   ============================================= */
let checkedItems = null;

/* =============================================
   RENDER CART PAGE
   ============================================= */
function renderCartPage() {
  const cart        = getCart();
  const cartEmpty   = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');
  if (!cartEmpty || !cartContent) return;

  if (cart.length === 0) {
    cartEmpty.style.display   = 'block';
    cartContent.style.display = 'none';
    checkedItems = null; // reset so next time all are pre-selected
    return;
  }

  cartEmpty.style.display   = 'none';
  cartContent.style.display = 'grid';

  renderCartItems(cart);
  renderCartSummary(cart);
  bindCartSummaryButtons(cart);
}

/* =============================================
   RENDER ITEMS LIST
   ============================================= */
function renderCartItems(cart) {
  const container = document.getElementById('cartItems');
  if (!container) return;

  // First load → select all
  if (checkedItems === null) {
    checkedItems = new Set(cart.map(item => String(item.id)));
  }

  // Remove stale ids (items that were deleted)
  const validIds = new Set(cart.map(item => String(item.id)));
  checkedItems.forEach(id => { if (!validIds.has(id)) checkedItems.delete(id); });

  const allChecked  = cart.length > 0 && cart.every(item => checkedItems.has(String(item.id)));
  const someChecked = cart.some(item => checkedItems.has(String(item.id)));

  const headerHTML = `
    <div class="cart-items__header">
      <label class="cart-checkbox">
        <input type="checkbox" id="checkAll" ${allChecked ? 'checked' : ''}>
        <span class="cart-checkbox__box"></span>
        <span class="cart-checkbox__label">Выбрать все</span>
      </label>
      <button class="cart-delete-selected" id="deleteSelected">Удалить выбранные</button>
    </div>`;

  container.innerHTML = headerHTML + cart.map(item => {
    const checked = checkedItems.has(String(item.id));
    return `
    <div class="cart-item ${checked ? 'cart-item--checked' : ''}" data-id="${item.id}">

      <label class="cart-checkbox">
        <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${checked ? 'checked' : ''}>
        <span class="cart-checkbox__box"></span>
      </label>

      <div class="cart-item__img">
        ${item.image
          ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" loading="lazy" />`
          : `<div class="cart-item__img-placeholder">✦</div>`
        }
      </div>

      <div class="cart-item__info">
        <p class="cart-item__brand">${escapeHTML(item.brand)}</p>
        <p class="cart-item__name">${escapeHTML(item.name)}</p>
        <p class="cart-item__volume">${escapeHTML(item.volume)}</p>
      </div>

      <div class="cart-item__controls">
        <p class="cart-item__price">${(item.price * item.qty).toLocaleString('ru')} ₸</p>
        <div class="cart-item__qty">
          <button class="qty-btn" data-action="minus" data-id="${item.id}" aria-label="Уменьшить">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="plus" data-id="${item.id}" aria-label="Увеличить">+</button>
        </div>
        <button class="cart-item__remove" data-id="${item.id}">Удалить</button>
      </div>

    </div>`;
  }).join('');

  // "Select all" checkbox
  const checkAll = container.querySelector('#checkAll');
  if (checkAll) {
    // Visual indeterminate state
    checkAll.indeterminate = someChecked && !allChecked;

    checkAll.addEventListener('change', () => {
      if (checkAll.checked) {
        // Select all
        cart.forEach(item => checkedItems.add(String(item.id)));
      } else {
        // Deselect all — clear but keep Set instance (not null!)
        checkedItems.clear();
      }
      renderCartItems(getCart());
      renderCartSummary(getCart());
    });
  }

  // Individual item checkboxes
  container.querySelectorAll('.item-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) checkedItems.add(cb.dataset.id);
      else checkedItems.delete(cb.dataset.id);
      renderCartItems(getCart());
      renderCartSummary(getCart());
    });
  });

  // Delete selected button
  const delBtn = container.querySelector('#deleteSelected');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (!checkedItems.size) return;
      const remaining = getCart().filter(i => !checkedItems.has(String(i.id)));
      checkedItems.clear();
      saveCart(remaining);
      updateCartCount();
      renderCartPage();
    });
  }

  // Event delegation for qty and remove buttons
  container.addEventListener('click', function(e) {
    const qtyBtn = e.target.closest('.qty-btn');
    if (qtyBtn) { changeQty(qtyBtn.dataset.id, qtyBtn.dataset.action); return; }
    const removeBtn = e.target.closest('.cart-item__remove');
    if (removeBtn) { removeFromCart(removeBtn.dataset.id); return; }
  });
}

/* =============================================
   RENDER SUMMARY SIDEBAR
   ============================================= */
function renderCartSummary(cart) {
  const linesEl = document.getElementById('summaryLines');
  const totalEl = document.getElementById('summaryTotal');
  if (!linesEl || !totalEl) return;

  const selected = checkedItems
    ? cart.filter(i => checkedItems.has(String(i.id)))
    : [];
  const total = selected.reduce((s, i) => s + i.price * i.qty, 0);

  linesEl.innerHTML = selected.length
    ? selected.map(item => `
        <div class="summary-line">
          <span>${escapeHTML(item.brand)} ${escapeHTML(item.name)} × ${item.qty}</span>
          <span>${(item.price * item.qty).toLocaleString('ru')} ₸</span>
        </div>`).join('')
    : '<p style="color:var(--white-30);font-size:0.83rem;line-height:1.5">Выберите товары для заказа</p>';

  totalEl.textContent = total.toLocaleString('ru') + ' ₸';

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.disabled = selected.length === 0;
    checkoutBtn.style.opacity = selected.length ? '1' : '0.5';
    checkoutBtn.style.pointerEvents = selected.length ? 'auto' : 'none';
  }
}

/* =============================================
   BIND SUMMARY ACTION BUTTONS
   ============================================= */
function bindCartSummaryButtons(cart) {
  const waBtn = document.getElementById('whatsappOrderBtn');
  if (waBtn) {
    waBtn.href   = buildWhatsAppCartLink(cart);
    waBtn.target = '_blank';
    waBtn.rel    = 'noopener noreferrer';
  }

  const clearBtn = document.getElementById('clearCartBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Очистить всю корзину?')) {
        localStorage.removeItem('scent_cart');
        checkedItems = null;
        updateCartCount();
        renderCartPage();
      }
    });
  }
}

/* =============================================
   CART OPERATIONS
   ============================================= */
function changeQty(id, action) {
  const cart = getCart();
  const item = cart.find(i => String(i.id) === String(id));
  if (!item) return;

  if (action === 'plus') {
    item.qty = Math.min(item.qty + 1, 99);
  } else {
    item.qty -= 1;
    if (item.qty <= 0) { removeFromCart(id); return; }
  }

  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

function removeFromCart(id) {
  let cart = getCart().filter(i => String(i.id) !== String(id));
  if (checkedItems) checkedItems.delete(String(id));
  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

function calcTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/* =============================================
   WHATSAPP MESSAGE BUILDER
   ============================================= */
function buildWhatsAppCartLink(cart) {
  const selected = checkedItems
    ? cart.filter(i => checkedItems.has(String(i.id)))
    : cart;

  const lines = selected.map(item =>
    `• ${item.brand} — ${item.name} (${item.volume}) × ${item.qty} = ${(item.price * item.qty).toLocaleString('ru')} ₸`
  ).join('\n');

  const total = selected.reduce((s, i) => s + i.price * i.qty, 0);
  const msg =
    `Здравствуйте! Хочу оформить заказ:\n\n${lines}\n\n` +
    `Итого: ${total.toLocaleString('ru')} ₸\n\n` +
    `Прошу уточнить наличие и условия доставки.`;

  return `https://wa.me/77071210281?text=${encodeURIComponent(msg)}`;
}

/* =============================================
   CHECKED CART HELPERS (used by checkout.js)
   ============================================= */

/**
 * Возвращает только выбранные (отмеченные) товары из корзины.
 * Если checkedItems не инициализирован — возвращает всю корзину.
 */
function getCheckedCart() {
  const cart = getCart();
  if (!checkedItems) return cart;
  return cart.filter(i => checkedItems.has(String(i.id)));
}

/**
 * Удаляет из корзины только те товары, которые были выбраны (отмечены).
 * Остальные товары остаются в корзине.
 */
function removeCheckedFromCart() {
  if (!checkedItems || checkedItems.size === 0) return;
  const remaining = getCart().filter(i => !checkedItems.has(String(i.id)));
  checkedItems.clear();
  checkedItems = null; // сбросим, чтобы при следующем открытии корзины всё выбралось
  saveCart(remaining);
}

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartItems')) {
    renderCartPage();
  }
});
