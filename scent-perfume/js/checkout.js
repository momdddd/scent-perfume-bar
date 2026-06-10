/**
 * Scent Perfume Bar — checkout.js (обновлённый)
 * Сохраняет заказ в Supabase если пользователь залогинен
 */

'use strict';

/* ─── VALIDATORS ─────────────────────────────────────────────── */
const VALIDATORS = {
  name(val) {
    val = val.trim();
    if (!val) return 'Введите ваше имя';
    if (val.length < 2) return 'Имя слишком короткое';
    if (!/^[а-яёА-ЯЁa-zA-Z\s\-]+$/.test(val)) return 'Только буквы и пробелы';
    return null;
  },
  phone(val) {
    const digits = val.replace(/\D/g, '');
    if (!val.trim()) return 'Введите номер телефона';
    if (digits.length < 10 || digits.length > 12) return 'Неверный формат номера';
    return null;
  },
  city(val) {
    val = val.trim();
    if (!val) return 'Введите ваш город';
    if (val.length < 2) return 'Слишком короткое название';
    return null;
  }
};

function sanitize(str) {
  return String(str).replace(/[<>&"'`]/g, '').trim().slice(0, 200);
}

/* ─── FORM HELPERS ───────────────────────────────────────────── */
function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) error.textContent = message;
}
function clearError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (error) error.textContent = '';
}
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/* ─── PHONE MASK ─────────────────────────────────────────────── */
function initPhoneMask() {
  const input = document.getElementById('inputPhone');
  if (!input) return;
  input.addEventListener('input', () => {
    let val = input.value.replace(/\D/g, '');
    if (val.startsWith('8')) val = '7' + val.slice(1);
    if (val.startsWith('7') && val.length > 1) {
      val = '+7 (' + val.slice(1,4) + ') ' + val.slice(4,7) + '-' + val.slice(7,9) + '-' + val.slice(9,11);
    } else if (val) { val = '+' + val; }
    input.value = val.slice(0, 18);
  });
}

/* ─── STEP MANAGEMENT ────────────────────────────────────────── */
let currentStep = 1;

function goToStep(step) {
  [1,2,3].forEach(n => {
    const el = document.getElementById(`step${n}`);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(`step${step}`);
  if (target) { target.style.display = 'block'; target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  document.querySelectorAll('.checkout-step').forEach(el => {
    const n = parseInt(el.dataset.step);
    el.classList.remove('checkout-step--active', 'checkout-step--done');
    if (n === step) el.classList.add('checkout-step--active');
    if (n < step)  el.classList.add('checkout-step--done');
  });
  currentStep = step;
}

/* ─── VALIDATION ─────────────────────────────────────────────── */
function validateStep1() {
  let valid = true;
  clearError('inputName',  'errorName');
  clearError('inputPhone', 'errorPhone');
  const nameErr  = VALIDATORS.name(getVal('inputName'));
  const phoneErr = VALIDATORS.phone(getVal('inputPhone'));
  if (nameErr)  { showError('inputName',  'errorName',  nameErr);  valid = false; }
  if (phoneErr) { showError('inputPhone', 'errorPhone', phoneErr); valid = false; }
  return valid;
}

function validateStep2() {
  const delivery = document.querySelector('input[name="delivery"]:checked')?.value;
  if (delivery !== 'cdek' && delivery !== 'kazpost') return true;
  clearError('inputCity', 'errorCity');
  const cityErr = VALIDATORS.city(getVal('inputCity'));
  if (cityErr) { showError('inputCity', 'errorCity', cityErr); return false; }
  return true;
}

/* ─── DELIVERY TOGGLE ────────────────────────────────────────── */
function initDeliveryToggle() {
  const radios = document.querySelectorAll('input[name="delivery"]');
  if (!radios.length) return;

  function update() {
    const val = document.querySelector('input[name="delivery"]:checked')?.value;
    const showAddress = val === 'cdek' || val === 'kazpost';
    const showPickup  = val === 'pickup';
    const showOther   = val === 'other';

    const ag  = document.getElementById('addressGroup');
    const ag2 = document.getElementById('addressGroup2');
    const pg  = document.getElementById('pickupGroup');
    const og  = document.getElementById('otherGroup');

    if (ag)  ag.style.display  = showAddress ? 'block' : 'none';
    if (ag2) ag2.style.display = showAddress ? 'block' : 'none';
    if (pg)  pg.style.display  = showPickup  ? 'block' : 'none';
    if (og)  og.style.display  = showOther   ? 'block' : 'none';

    // Город обязателен только для СДЭК/Казпочта
    const cityInput = document.getElementById('inputCity');
    if (cityInput) {
      cityInput.required = showAddress;
    }
  }

  radios.forEach(r => r.addEventListener('change', update));
  update();
}

/* ─── CHECKOUT SUMMARY ───────────────────────────────────────── */
function renderCheckoutSummary() {
  const cart = (typeof getCheckedCart === 'function' && getCheckedCart().length > 0)
    ? getCheckedCart()
    : getCart();
  const itemsEl = document.getElementById('checkoutItems');
  const totalEl = document.getElementById('checkoutTotal');
  if (!itemsEl || !totalEl) return;
  if (!cart.length) {
    itemsEl.innerHTML = '<p style="color:var(--white-30);font-size:.875rem">Корзина пуста</p>';
    totalEl.textContent = '0 ₸';
    return;
  }
  itemsEl.innerHTML = cart.map(item => `
    <div class="checkout-summary-item">
      <div class="checkout-summary-item__name">
        ${escapeHTML(item.brand)} — ${escapeHTML(item.name)}
        <small>${escapeHTML(item.volume)} × ${item.qty}</small>
      </div>
      <div class="checkout-summary-item__price">${(item.price * item.qty).toLocaleString('ru')} ₸</div>
    </div>`).join('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  totalEl.textContent = total.toLocaleString('ru') + ' ₸';
}

/* ─── PRE-FILL FROM PROFILE ──────────────────────────────────── */
// Если залогинен — подставляем имя и телефон из профиля
async function prefillFromProfile() {
  if (!isLoggedIn()) return;
  const user = getCurrentUser();
  const nameInput = document.getElementById('inputName');
  if (nameInput && user.user_metadata?.full_name) {
    nameInput.value = user.user_metadata.full_name;
  }
  // Телефон из profiles
  try {
    const token = getAccessToken();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=phone,full_name`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data[0]) {
      if (data[0].phone && document.getElementById('inputPhone')) {
        document.getElementById('inputPhone').value = data[0].phone;
      }
      if (data[0].full_name && nameInput) {
        nameInput.value = data[0].full_name;
      }
    }
  } catch { /* ignore */ }
}


/* ─── MAP DELIVERY TYPE ──────────────────────────────────────── */
// БД принимает только 'delivery' или 'pickup'
function mapDeliveryType(val) {
  if (val === 'pickup') return 'pickup';
  return 'delivery'; // cdek, kazpost, other → delivery
}

/* ─── SAVE ORDER TO SUPABASE ─────────────────────────────────── */
async function saveOrderToDB(orderData) {
  try {
    const loggedIn = isLoggedIn();
    const token    = loggedIn ? getAccessToken() : SUPABASE_KEY;
    const user     = loggedIn ? getCurrentUser() : null;
    // Только выбранные товары
    const cart = (typeof getCheckedCart === 'function' && getCheckedCart().length > 0)
      ? getCheckedCart()
      : getCart();
    const storeNames = {
      karaganda: 'Scent Perfume Bar (Караганда)',
      atbasar:   'Scent Perfume Bar (Атбасар)'
    };
    const store = document.querySelector('input[name="pickupStore"]:checked')?.value;

    // 1. Создаём заказ
    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id:         user?.id || null,
        customer_name:  sanitize(getVal('inputName')),
        customer_phone: sanitize(getVal('inputPhone')),
        delivery_type:   mapDeliveryType(orderData.delivery),
        city:           sanitize(getVal('inputCity')) || null,
        address:        sanitize(getVal('inputAddress')) || null,
        pickup_store:   storeNames[store] || null,
        comment:        sanitize(getVal('inputComment')) || null,
        total_price:    cart.reduce((s, i) => s + i.price * i.qty, 0),
        status:         'new',
        payment_status:  'pending'
      })
    });

    const [order] = await orderRes.json();
    if (!order?.id) return null;

    // 2. Сохраняем позиции
    const items = cart.map(item => ({
      order_id:   order.id,
      product_id: item.productId || null,
      brand:      item.brand,
      name:       item.name,
      volume:     item.volume,
      label:      item.label || null,
      price:      item.price,
      qty:        item.qty
    }));

    await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(items)
    });

    return order.id;

  } catch (err) {
    console.error('[checkout] Не удалось сохранить заказ:', err);
    return null;
  }
}

/* ─── BUILD WHATSAPP MESSAGE ─────────────────────────────────── */
function buildOrderMessage() {
  const cart = (typeof getCheckedCart === 'function' && getCheckedCart().length > 0)
    ? getCheckedCart()
    : getCart();
  const name     = sanitize(getVal('inputName'));
  const phone    = sanitize(getVal('inputPhone'));
  const delivery = document.querySelector('input[name="delivery"]:checked')?.value;
  const city     = sanitize(getVal('inputCity'));
  const address  = sanitize(getVal('inputAddress'));
  const comment  = sanitize(getVal('inputComment'));
  const store    = document.querySelector('input[name="pickupStore"]:checked')?.value;
  const storeNames = {
    karaganda: 'Scent Perfume Bar (Караганда, ТД Арбат)',
    atbasar:   'Scent Perfume Bar (Атбасар, ТД Керуен)'
  };
  const lines = cart.map(i =>
    `• ${i.brand} — ${i.name} (${i.volume}) × ${i.qty} = ${(i.price*i.qty).toLocaleString('ru')} ₸`
  ).join('\n');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryLabels = {
    cdek:    'СДЭК',
    kazpost: 'Казпочта',
    other:   'Другое (уточнить)',
    pickup:  'Самовывоз'
  };
  let deliveryInfo;
  if (delivery === 'cdek' || delivery === 'kazpost') {
    deliveryInfo = `\n📦 Доставка (${deliveryLabels[delivery]}): ${city}${address ? ', ' + address : ''}`;
  } else if (delivery === 'pickup') {
    deliveryInfo = `\n🏪 Самовывоз: ${storeNames[store] || ''}`;
  } else {
    deliveryInfo = `\n❓ Способ доставки: уточнить с менеджером`;
  }
  const msg =
    `Здравствуйте! Новый заказ с сайта:\n\n` +
    `👤 ${name}\n📞 ${phone}${deliveryInfo}\n\n` +
    `🛍 Состав заказа:\n${lines}\n\n` +
    `💰 Итого: ${total.toLocaleString('ru')} ₸` +
    (comment ? `\n\n💬 Комментарий: ${comment}` : '');
  return { msg, name, phone, total, delivery, city };
}

/* ─── SHOW SUCCESS ───────────────────────────────────────────── */
function showSuccess(orderData, dbOrderId) {
  goToStep(3);
  const textEl      = document.getElementById('successText');
  const paymentWrap = document.getElementById('paymentOptions');

  let text = `${orderData.name}, ваш заказ на ${orderData.total.toLocaleString('ru')} ₸ оформлен.`;
  if (dbOrderId) text += ` Номер заказа: #${dbOrderId}.`;
  if (textEl) textEl.textContent = text;

  if (paymentWrap) {
    paymentWrap.style.display = 'flex';

    // Показываем сумму на кнопке
    const amountLabel = document.getElementById('payAmountLabel');
    if (amountLabel) amountLabel.textContent = orderData.total.toLocaleString('ru') + ' ₸';

    // Инициализируем табы
    initPayTabs();

    // Маски полей карты
    initCardForm();

    // Кнопка оплаты картой
    const payBtn = document.getElementById('payOnlineBtn');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        if (!validateCardForm()) return;
        payBtn.disabled = true;
        payBtn.textContent = 'Обработка...';
        // Запускаем оплату даже если заказ не сохранился в БД (гость без аккаунта)
        if (typeof initPayment === 'function') {
          initPayment(dbOrderId || 0, orderData.total, { name: orderData.name, phone: orderData.phone });
        } else {
          // Fallback если payment.js не загружен
          payBtn.disabled = false;
          payBtn.textContent = 'Оплатить';
          alert('Ошибка загрузки платёжного модуля. Попробуйте перезагрузить страницу.');
        }
      });
    }

    // Kaspi
    const kaspiBtn = document.getElementById('payKaspiBtn');
    if (kaspiBtn) {
      kaspiBtn.addEventListener('click', () => {
        kaspiBtn.disabled = true;
        kaspiBtn.textContent = 'Переходим в Kaspi...';
        if (dbOrderId && typeof initPayment === 'function') {
          initPayment(dbOrderId, orderData.total, { name: orderData.name, phone: orderData.phone });
        }
      });
    }

    // WhatsApp
    const waBtn = document.getElementById('payWhatsappBtn');
    if (waBtn) waBtn.href = `https://wa.me/77071210281?text=${encodeURIComponent(orderData.msg)}`;
  }

  // Удаляем только купленные товары, остальные остаются в корзине
  if (typeof removeCheckedFromCart === 'function') {
    removeCheckedFromCart();
  } else {
    localStorage.removeItem('scent_cart');
  }
  updateCartCount();
}

/* ─── PAYMENT TABS ───────────────────────────────────────────── */
function initPayTabs() {
  const tabs = document.querySelectorAll('.pay-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('pay-tab--active'));
      tab.classList.add('pay-tab--active');
      document.querySelectorAll('.pay-panel').forEach(p => p.style.display = 'none');
      const panel = document.getElementById('payPanel-' + tab.dataset.tab);
      if (panel) panel.style.display = 'block';
    });
  });
}

/* ─── CARD FORM ──────────────────────────────────────────────── */
function initCardForm() {
  const numInput    = document.getElementById('cardNumber');
  const holderInput = document.getElementById('cardHolder');
  const expiryInput = document.getElementById('cardExpiry');

  const numDisplay    = document.getElementById('cardNumberDisplay');
  const holderDisplay = document.getElementById('cardHolderDisplay');
  const expiryDisplay = document.getElementById('cardExpiryDisplay');
  const brandDisplay  = document.getElementById('cardBrandIcon');

  if (numInput) {
    numInput.addEventListener('input', () => {
      let v = numInput.value.replace(/\D/g, '').slice(0, 16);
      numInput.value = v.replace(/(\d{4})/g, '$1 ').trim();
      if (numDisplay) {
        const raw = numInput.value.replace(/\s/g, '');
        const padded = raw.padEnd(16, '•');
        numDisplay.textContent = padded.match(/.{1,4}/g).join(' ');
      }
      // Определяем систему
      if (brandDisplay) {
        const first = v[0];
        if (first === '4') brandDisplay.textContent = 'VISA';
        else if (first === '5') brandDisplay.textContent = 'MASTERCARD';
        else if (v.startsWith('9870')) brandDisplay.textContent = 'KASPI';
        else brandDisplay.textContent = '';
      }
    });
  }

  if (holderInput) {
    holderInput.addEventListener('input', () => {
      holderInput.value = holderInput.value.toUpperCase().replace(/[^A-Z\s]/g, '');
      if (holderDisplay) holderDisplay.textContent = holderInput.value || 'ИМЯ ФАМИЛИЯ';
    });
  }

  if (expiryInput) {
    expiryInput.addEventListener('input', () => {
      let v = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2);
      expiryInput.value = v;
      if (expiryDisplay) expiryDisplay.textContent = expiryInput.value || 'MM/YY';
    });
  }
}

function validateCardForm() {
  const num    = (document.getElementById('cardNumber')?.value || '').replace(/\s/g, '');
  const holder = document.getElementById('cardHolder')?.value?.trim() || '';
  const expiry = document.getElementById('cardExpiry')?.value || '';
  const cvv    = document.getElementById('cardCvv')?.value || '';

  if (num.length < 16) { alert('Введите полный номер карты'); return false; }
  if (holder.length < 2) { alert('Введите имя держателя карты'); return false; }
  if (!/^\d{2}\/\d{2}$/.test(expiry)) { alert('Введите срок действия в формате MM/YY'); return false; }
  if (cvv.length < 3) { alert('Введите CVV код'); return false; }
  return true;
}

/* ─── INIT ───────────────────────────────────────────────────── */
function initCheckout() {
  renderCheckoutSummary();
  initPhoneMask();
  initDeliveryToggle();
  prefillFromProfile();

  // Step 1 → 2
  document.getElementById('nextStep1')?.addEventListener('click', () => {
    if (validateStep1()) goToStep(2);
  });

  // Real-time validation clear
  ['inputName', 'inputPhone'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      document.getElementById(id)?.classList.remove('error');
      const errId = 'error' + id.replace('input', '');
      const errEl = document.getElementById(errId);
      if (errEl) errEl.textContent = '';
    });
  });

  // Step 2 → back
  document.getElementById('backStep1')?.addEventListener('click', () => goToStep(1));

  // Step 2 → confirm
  document.getElementById('nextStep2')?.addEventListener('click', async () => {
    if (!validateStep2()) return;
    const cart = getCart();
    if (!cart.length) { alert('Ваша корзина пуста.'); return; }

    const btn = document.getElementById('nextStep2');
    if (btn) { btn.disabled = true; btn.textContent = 'Оформляем...'; }

    const orderData = buildOrderMessage();
    const dbOrderId = await saveOrderToDB(orderData);
    showSuccess(orderData, dbOrderId);

    if (btn) { btn.disabled = false; btn.textContent = 'Подтвердить заказ'; }
  });

  // Enter key
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (currentStep === 1 && validateStep1()) goToStep(2);
      else if (currentStep === 2 && validateStep2()) document.getElementById('nextStep2')?.click();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('step1')) initCheckout();
});