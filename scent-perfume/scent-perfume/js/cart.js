/**
 * Scent Perfume Bar — Cart JS
 * Handles: render cart, qty change, remove, clear, WhatsApp order
 */

'use strict';

/* =============================================
   RENDER CART PAGE
   ============================================= */
function renderCartPage() {
  const cart = getCart();
  const cartEmpty   = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');
  if (!cartEmpty || !cartContent) return;

  if (cart.length === 0) {
    cartEmpty.style.display   = 'block';
    cartContent.style.display = 'none';
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
// Храним состояние чекбоксов
let checkedItems = new Set();

function renderCartItems(cart) {
  const container = document.getElementById('cartItems');
  if (!container) return;

  // При первом рендере — все выбраны
  if (checkedItems.size === 0) {
    cart.forEach(item => checkedItems.add(String(item.id)));
  }

  // "Выбрать все" заголовок
  const allChecked = cart.every(item => checkedItems.has(String(item.id)));
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
        <button class="cart-item__remove" data-id="${item.id}">✕</button>
      </div>

    </div>`;
  }).join('');

  // Чекбокс "выбрать все"
  const checkAll = container.querySelector('#checkAll');
  if (checkAll) {
    checkAll.addEventListener('change', () => {
      if (checkAll.checked) {
        cart.forEach(item => checkedItems.add(String(item.id)));
      } else {
        checkedItems.clear();
      }
      renderCartItems(cart);
      renderCartSummary(getCart());
    });
  }

  // Чекбоксы товаров
  container.querySelectorAll('.item-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) checkedItems.add(cb.dataset.id);
      else checkedItems.delete(cb.dataset.id);
      renderCartItems(getCart());
      renderCartSummary(getCart());
    });
  });

  // Удалить выбранные
  const delBtn = container.querySelector('#deleteSelected');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (!checkedItems.size) return;
      let cart = getCart().filter(i => !checkedItems.has(String(i.id)));
      checkedItems.clear();
      saveCart(cart);
      updateCartCount();
      renderCartPage();
    });
  }

  // Event delegation для qty и remove
  container.addEventListener('click', function cartClick(e) {
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

  // Только выбранные товары
  const selected = cart.filter(i => checkedItems.has(String(i.id)));
  const total = selected.reduce((s, i) => s + i.price * i.qty, 0);

  linesEl.innerHTML = selected.length
    ? selected.map(item => `
        <div class="summary-line">
          <span>${escapeHTML(item.brand)} ${escapeHTML(item.name)} × ${item.qty}</span>
          <span>${(item.price * item.qty).toLocaleString('ru')} ₸</span>
        </div>`).join('')
    : '<p style="color:var(--white-30);font-size:0.875rem">Выберите товары для заказа</p>';

  totalEl.textContent = total.toLocaleString('ru') + ' ₸';

  // Кнопка "Оформить" — только если есть выбранные
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.disabled = selected.length === 0;
    checkoutBtn.style.opacity = selected.length ? '1' : '0.5';
  }
}

/* =============================================
   BIND SUMMARY ACTION BUTTONS
   ============================================= */
function bindCartSummaryButtons(cart) {
  // WhatsApp order button
  const waBtn = document.getElementById('whatsappOrderBtn');
  if (waBtn) {
    waBtn.href = buildWhatsAppCartLink(cart);
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
  }

  // Clear cart
  const clearBtn = document.getElementById('clearCartBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Очистить всю корзину?')) {
        localStorage.removeItem('scent_cart');
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
    if (item.qty <= 0) {
      removeFromCart(id);
      return;
    }
  }

  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(i => String(i.id) !== String(id));
  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

/* =============================================
   TOTAL CALCULATION
   ============================================= */
function calcTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/* =============================================
   WHATSAPP MESSAGE BUILDER
   ============================================= */
function buildWhatsAppCartLink(cart) {
  const lines = cart.map(item =>
    `• ${item.brand} — ${item.name} (${item.volume}) × ${item.qty} = ${(item.price * item.qty).toLocaleString('ru')} ₸`
  ).join('\n');

  const total = calcTotal(cart);
  const msg =
    `Здравствуйте! Хочу оформить заказ:\n\n${lines}\n\n` +
    `Итого: ${total.toLocaleString('ru')} ₸\n\n` +
    `Прошу уточнить наличие и условия доставки.`;

  return `https://wa.me/77071210281?text=${encodeURIComponent(msg)}`;
}

/* =============================================
   INIT CART PAGE
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartItems')) {
    renderCartPage();
  }
});
