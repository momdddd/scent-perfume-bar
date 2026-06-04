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
function renderCartItems(cart) {
  const container = document.getElementById('cartItems');
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">

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
        <p class="cart-item__price">
          ${(item.price * item.qty).toLocaleString('ru')} ₸
        </p>
        <div class="cart-item__qty">
          <button class="qty-btn" data-action="minus" data-id="${item.id}" aria-label="Уменьшить">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="plus" data-id="${item.id}" aria-label="Увеличить">+</button>
        </div>
        <button class="cart-item__remove" data-id="${item.id}">Удалить</button>
      </div>

    </div>
  `).join('');

  // Bind qty buttons
  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = btn.dataset.id;
      const action = btn.dataset.action;
      changeQty(id, action);
    });
  });

  // Bind remove buttons
  container.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.id);
    });
  });
}

/* =============================================
   RENDER SUMMARY SIDEBAR
   ============================================= */
function renderCartSummary(cart) {
  const linesEl = document.getElementById('summaryLines');
  const totalEl = document.getElementById('summaryTotal');
  if (!linesEl || !totalEl) return;

  const total = calcTotal(cart);

  linesEl.innerHTML = cart.map(item => `
    <div class="summary-line">
      <span>${escapeHTML(item.brand)} ${escapeHTML(item.name)} × ${item.qty}</span>
      <span>${(item.price * item.qty).toLocaleString('ru')} ₸</span>
    </div>
  `).join('');

  totalEl.textContent = total.toLocaleString('ru') + ' ₸';
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
