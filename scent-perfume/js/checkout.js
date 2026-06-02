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
  if (delivery !== 'delivery') return true;
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
    const show = val === 'delivery';
    document.getElementById('addressGroup') ?.style  && (document.getElementById('addressGroup').style.display  = show ? 'block' : 'none');
    document.getElementById('addressGroup2')?.style  && (document.getElementById('addressGroup2').style.display = show ? 'block' : 'none');
    document.getElementById('pickupGroup')  ?.style  && (document.getElementById('pickupGroup').style.display   = show ? 'none'  : 'block');
  }
  radios.forEach(r => r.addEventListener('change', update));
  update();
}

/* ─── CHECKOUT SUMMARY ───────────────────────────────────────── */
function renderCheckoutSummary() {
  const cart    = getCart();
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

/* ─── SAVE ORDER TO SUPABASE ─────────────────────────────────── */
async function saveOrderToDB(orderData) {
  if (!isLoggedIn()) return null; // гостевой заказ — не сохраняем

  try {
    const token  = getAccessToken();
    const user   = getCurrentUser();
    const cart   = getCart();
    const storeNames = {
      karaganda: 'Scent Perfume Bar (Караганда)',
      atbasar:   'Дом Парфюма (Атбасар)'
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
        user_id:        user.id,
        customer_name:  sanitize(getVal('inputName')),
        customer_phone: sanitize(getVal('inputPhone')),
        delivery_type:  orderData.delivery,
        city:           sanitize(getVal('inputCity')) || null,
        address:        sanitize(getVal('inputAddress')) || null,
        pickup_store:   storeNames[store] || null,
        comment:        sanitize(getVal('inputComment')) || null,
        total_price:    cart.reduce((s, i) => s + i.price * i.qty, 0),
        status:         'new'
      })
    });

    const [order] = await orderRes.json();
    if (!order?.id) return null;

    // 2. Сохраняем позиции
    const items = cart.map(item => ({
      order_id:   order.id,
      product_id: item.id || null,
      brand:      item.brand,
      name:       item.name,
      volume:     item.volume,
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
  const cart = getCart();
  const name     = sanitize(getVal('inputName'));
  const phone    = sanitize(getVal('inputPhone'));
  const delivery = document.querySelector('input[name="delivery"]:checked')?.value;
  const city     = sanitize(getVal('inputCity'));
  const address  = sanitize(getVal('inputAddress'));
  const comment  = sanitize(getVal('inputComment'));
  const store    = document.querySelector('input[name="pickupStore"]:checked')?.value;
  const storeNames = {
    karaganda: 'Scent Perfume Bar (Караганда, ТД Арбат)',
    atbasar:   'Дом Парфюма (Атбасар, ТД Керуен)'
  };
  const lines = cart.map(i =>
    `• ${i.brand} — ${i.name} (${i.volume}) × ${i.qty} = ${(i.price*i.qty).toLocaleString('ru')} ₸`
  ).join('\n');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryInfo = delivery === 'delivery'
    ? `\n📦 Доставка: ${city}${address ? ', ' + address : ''}`
    : `\n🏪 Самовывоз: ${storeNames[store] || ''}`;
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
  const textEl = document.getElementById('successText');
  const waBtn  = document.getElementById('successWhatsapp');

  let text = `${orderData.name}, ваш заказ на ${orderData.total.toLocaleString('ru')} ₸ принят.`;
  if (dbOrderId) {
    text += ` Номер заказа: #${dbOrderId}.`;
  }
  text += ` Нажмите кнопку ниже — менеджер свяжется с вами для подтверждения.`;

  if (textEl) textEl.textContent = text;
  if (waBtn)  waBtn.href = `https://wa.me/77071210281?text=${encodeURIComponent(orderData.msg)}`;

  localStorage.removeItem('scent_cart');
  updateCartCount();
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
