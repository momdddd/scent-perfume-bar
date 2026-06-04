/**
 * payment.js — Заглушки для онлайн-оплаты
 * Scent Perfume Bar
 *
 * Рекомендуемые провайдеры для РК:
 *   - Kaspi Pay    → https://pay.kaspi.kz/
 *   - Halyk Bank   → https://epay.homebank.kz/
 *   - Jusan Pay    → https://jysanbank.kz/
 *   - Cloudpayments KZ → https://cloudpayments.kz/
 *
 * Для подключения реального провайдера:
 *   1. Зарегистрируйтесь как мерчант
 *   2. Получите API ключи
 *   3. Замените заглушки ниже на реальные вызовы SDK
 */

/**
 * Инициализация платежа
 * @param {number|string} orderId  — ID заказа из Supabase
 * @param {number}        amount   — Сумма в тенге (целое число)
 * @param {string}        [provider='kaspi'] — 'kaspi' | 'halyk' | 'jusan' | 'cloud'
 */
async function initPayment(orderId, amount, provider = 'kaspi') {
  console.log(`[payment] initPayment called: orderId=${orderId}, amount=${amount}, provider=${provider}`);

  // TODO: заменить на реальный вызов SDK провайдера
  // Пример для Kaspi Pay:
  // const kaspiWidget = new KaspiWidget({ merchantId: 'YOUR_ID', orderId, amount });
  // kaspiWidget.open({ onSuccess: handlePaymentSuccess, onFail: handlePaymentFail });

  // Заглушка — имитирует успех через 1.5 сек
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[payment] STUB: payment successful');
      handlePaymentSuccess({ orderId, amount, transactionId: 'stub_' + Date.now() });
      resolve({ success: true });
    }, 1500);
  });
}

/**
 * Обработчик успешной оплаты
 * @param {{ orderId, amount, transactionId }} result
 */
async function handlePaymentSuccess(result) {
  console.log('[payment] Success:', result);

  // Обновляем статус заказа в Supabase
  try {
    const SUPABASE_URL = window.SUPABASE_URL || '';
    const SUPABASE_KEY = window.SUPABASE_KEY || '';

    if (SUPABASE_URL && result.orderId && result.orderId !== 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${result.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          payment_status: 'paid',
          payment_id: result.transactionId || null,
        }),
      });
      console.log('[payment] Order status updated to paid');
    }
  } catch (err) {
    console.error('[payment] Failed to update order status:', err);
  }

  // Показываем экран успеха (вызывается из checkout.js)
  if (typeof showCheckoutSuccess === 'function') {
    showCheckoutSuccess();
  }
}

/**
 * Обработчик ошибки / отмены оплаты
 * @param {{ orderId, reason }} error
 */
function handlePaymentFail(error) {
  console.warn('[payment] Failed or cancelled:', error);

  // Показываем сообщение пользователю
  const msg = 'Оплата не прошла. Попробуйте ещё раз или выберите другой способ оплаты.';
  if (typeof showPaymentError === 'function') {
    showPaymentError(msg);
  } else {
    alert(msg);
  }
}

// Экспортируем для checkout.js
window.initPayment       = initPayment;
window.handlePaymentSuccess = handlePaymentSuccess;
window.handlePaymentFail    = handlePaymentFail;
