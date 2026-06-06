/**
 * payment.js — Интеграция онлайн-оплаты
 * Scent Perfume Bar
 *
 * ─── Поддерживаемые провайдеры ───────────────────────────────
 *  'kaspi'  — Kaspi Pay (виджет)
 *  'halyk'  — Halyk Bank eCommerce (форма + redirect)
 *  'mock'   — тестовый режим (показывает попап выбора)
 *
 * ─── Подключение реального провайдера ────────────────────────
 *  1. Получите договор и API-ключи у провайдера
 *  2. Замените PAYMENT_CONFIG ниже
 *  3. Раскомментируйте нужный блок в initPayment()
 */

'use strict';

/* ─── КОНФИГУРАЦИЯ ───────────────────────────────────────────── */
const PAYMENT_CONFIG = {
  provider:    'mock',            // 'kaspi' | 'halyk' | 'mock'
  merchantId:  'YOUR_MERCHANT_ID', // заменить после подписания договора
  terminalId:  'YOUR_TERMINAL_ID', // для Halyk
  successUrl:  window.location.origin + '/payment-success.html',
  failUrl:     window.location.origin + '/payment-fail.html',
  currency:    'KZT',
};

/* ─── ОСНОВНАЯ ФУНКЦИЯ ───────────────────────────────────────── */
/**
 * Инициализирует платёж
 * @param {number} orderId   — ID заказа из Supabase
 * @param {number} amount    — сумма в тенге
 * @param {object} customer  — { name, phone }
 */
async function initPayment(orderId, amount, customer = {}) {
  console.log(`[payment] init: orderId=${orderId}, amount=${amount}, provider=${PAYMENT_CONFIG.provider}`);

  // Обновляем статус заказа на 'pending' в БД
  await updatePaymentStatus(orderId, 'pending', null);

  switch (PAYMENT_CONFIG.provider) {
    case 'kaspi':
      return initKaspiPay(orderId, amount, customer);
    case 'halyk':
      return initHalykPay(orderId, amount, customer);
    case 'mock':
    default:
      return initMockPayment(orderId, amount, customer);
  }
}

/* ─── KASPI PAY ──────────────────────────────────────────────── */
/**
 * Kaspi Pay — самый популярный в РК.
 * Документация: https://kaspi.kz/merchantapi/
 *
 * Способ интеграции: виджет (JS-библиотека Kaspi) или QR-код.
 */
function initKaspiPay(orderId, amount, customer) {
  // TODO: подключить SDK после получения merchantId
  // <script src="https://kaspi.kz/pay/checkout.js"></script>
  //
  // KaspiCheckout.open({
  //   merchantId: PAYMENT_CONFIG.merchantId,
  //   orderId:    String(orderId),
  //   amount:     amount,
  //   name:       customer.name || 'Покупатель',
  //   phone:      customer.phone || '',
  //   returnUrl:  PAYMENT_CONFIG.successUrl + '?order_id=' + orderId + '&amount=' + amount,
  //   failUrl:    PAYMENT_CONFIG.failUrl + '?order_id=' + orderId,
  // });

  console.warn('[payment] Kaspi Pay: merchantId не настроен. Используйте mock для тестирования.');
  showPaymentError('Kaspi Pay в данный момент настраивается. Пожалуйста, оплатите через WhatsApp.');
}

/* ─── HALYK BANK ─────────────────────────────────────────────── */
/**
 * Halyk Bank eCommerce — Visa/Mastercard, 3DS.
 * Документация: https://epay.homebank.kz/
 *
 * Способ интеграции: redirect на страницу оплаты Halyk.
 */
function initHalykPay(orderId, amount, customer) {
  // TODO: получить token от бэкенда (Edge Function) и сделать redirect
  //
  // const token = await getHalykToken(orderId, amount); // Edge Function
  // window.location.href = `https://epay.homebank.kz/payment?token=${token}`;

  console.warn('[payment] Halyk Pay: не настроен. Нужен бэкенд для получения токена.');
  showPaymentError('Онлайн-оплата картой временно недоступна. Пожалуйста, оплатите через Kaspi.');
}

/* ─── MOCK (тестовый режим) ──────────────────────────────────── */
/**
 * Тестовый режим — показывает попап с кнопками "Успех" и "Ошибка".
 * Используется пока провайдер не подключён.
 */
function initMockPayment(orderId, amount, customer) {
  // Создаём тестовый попап
  const overlay = document.createElement('div');
  overlay.id = 'mockPaymentOverlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999;
    display:flex; align-items:center; justify-content:center; padding:20px;
  `;
  overlay.innerHTML = `
    <div style="
      background:#1a1a1a; border:1px solid rgba(201,168,76,0.3);
      border-radius:20px; padding:40px; max-width:400px; width:100%;
      text-align:center; font-family:'Jost',sans-serif;
    ">
      <div style="font-size:2rem; margin-bottom:16px;">💳</div>
      <h2 style="font-family:'Cormorant Garamond',serif; font-weight:300; color:#fff; font-size:1.8rem; margin:0 0 8px;">
        Тестовая оплата
      </h2>
      <p style="color:rgba(255,255,255,0.5); font-size:0.9rem; margin:0 0 8px;">
        Заказ #${orderId}
      </p>
      <p style="color:#c9a84c; font-size:1.3rem; font-family:'Cormorant Garamond',serif; font-weight:300; margin:0 0 32px;">
        ${amount.toLocaleString('ru')} ₸
      </p>
      <p style="color:rgba(255,255,255,0.3); font-size:0.8rem; margin:0 0 24px; line-height:1.5;">
        Это тестовый режим. Реальная оплата будет подключена после договора с Kaspi Pay или Halyk Bank.
      </p>
      <div style="display:flex; gap:12px; flex-direction:column;">
        <button id="mockSuccess" style="
          padding:14px; background:#c9a84c; color:#0a0a0a; border:none;
          border-radius:8px; font-family:'Jost',sans-serif; font-size:12px;
          letter-spacing:0.15em; text-transform:uppercase; cursor:pointer;
          font-weight:500;
        ">✓ Симулировать успешную оплату</button>
        <button id="mockFail" style="
          padding:14px; background:transparent; color:rgba(255,255,255,0.4);
          border:1px solid rgba(255,255,255,0.1); border-radius:8px;
          font-family:'Jost',sans-serif; font-size:12px; letter-spacing:0.15em;
          text-transform:uppercase; cursor:pointer;
        ">✗ Симулировать ошибку</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('mockSuccess').addEventListener('click', async () => {
    overlay.remove();
    await handlePaymentSuccess(orderId, amount, 'mock_' + Date.now());
  });

  document.getElementById('mockFail').addEventListener('click', async () => {
    overlay.remove();
    await handlePaymentFail(orderId, 'Симуляция ошибки');
  });
}

/* ─── ОБРАБОТЧИКИ РЕЗУЛЬТАТА ─────────────────────────────────── */
async function handlePaymentSuccess(orderId, amount, transactionId) {
  console.log(`[payment] SUCCESS: orderId=${orderId}, txId=${transactionId}`);

  await updatePaymentStatus(orderId, 'paid', transactionId);

  // Очищаем корзину
  localStorage.removeItem('scent_cart');
  if (typeof updateCartCount === 'function') updateCartCount();

  // Редирект на страницу успеха
  window.location.href = `payment-success.html?order_id=${orderId}&amount=${amount}`;
}

async function handlePaymentFail(orderId, reason) {
  console.warn(`[payment] FAIL: orderId=${orderId}, reason=${reason}`);

  await updatePaymentStatus(orderId, 'failed', null);

  // Редирект на страницу ошибки
  window.location.href = `payment-fail.html?order_id=${orderId}`;
}

/* ─── ОБНОВЛЕНИЕ СТАТУСА В SUPABASE ─────────────────────────── */
async function updatePaymentStatus(orderId, status, transactionId) {
  if (!orderId || !window.SUPABASE_URL || !window.SUPABASE_KEY) return;

  try {
    const body = { payment_status: status };
    if (transactionId) {
      body.payment_id = transactionId;
      body.payment_provider = PAYMENT_CONFIG.provider;
    }
    if (status === 'paid') body.status = 'confirmed';

    const token = (typeof getAccessToken === 'function') ? getAccessToken() : SUPABASE_KEY;

    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[payment] Статус заказа #${orderId} обновлён: ${status}`);
  } catch (err) {
    console.error('[payment] Не удалось обновить статус:', err);
  }
}

/* ─── ВСПОМОГАТЕЛЬНЫЕ ────────────────────────────────────────── */
function showPaymentError(message) {
  alert(message); // заменить на красивый попап если нужно
}

/* ─── ЭКСПОРТ ────────────────────────────────────────────────── */
window.initPayment          = initPayment;
window.handlePaymentSuccess = handlePaymentSuccess;
window.handlePaymentFail    = handlePaymentFail;
window.updatePaymentStatus  = updatePaymentStatus;
