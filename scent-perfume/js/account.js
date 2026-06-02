/**
 * Scent Perfume Bar — account.js
 * Личный кабинет: заказы + профиль
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Не залогинен — редирект на логин
  if (!isLoggedIn()) {
    window.location.href = 'login.html?from=account.html';
    return;
  }
  initAccount();
});

async function initAccount() {
  const user = getCurrentUser();

  // Шапка кабинета
  const email = user.email || '';
  const name  = user.user_metadata?.full_name || email.split('@')[0];

  document.getElementById('accountTitle').textContent  = `Привет, ${name}`;
  document.getElementById('sidebarName').textContent   = name;
  document.getElementById('sidebarEmail').textContent  = email;

  // Навигация по секциям
  document.querySelectorAll('.account-nav__link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.account-nav__link').forEach(b => b.classList.remove('account-nav__link--active'));
      btn.classList.add('account-nav__link--active');
      const section = btn.dataset.section;
      document.getElementById('sectionOrders').style.display  = section === 'orders'  ? 'block' : 'none';
      document.getElementById('sectionProfile').style.display = section === 'profile' ? 'block' : 'none';
      if (section === 'profile') loadProfile();
    });
  });

  // Выход
  document.getElementById('logoutBtn').addEventListener('click', signOut);

  // Загрузить заказы
  await loadOrders();
}

/* =============================================
   ORDERS
   ============================================= */
async function loadOrders() {
  const container = document.getElementById('ordersList');
  if (!container) return;

  try {
    const token = getAccessToken();
    const url = `${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Ошибка загрузки');
    const orders = await res.json();

    if (!orders.length) {
      container.innerHTML = `
        <div class="orders-empty">
          <p class="orders-empty__icon">✦</p>
          <p class="orders-empty__text">Заказов пока нет</p>
          <a href="catalog.html" class="btn btn--gold" style="margin-top:20px">Перейти в каталог</a>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => renderOrder(order)).join('');

    // Аккордеон — раскрыть/скрыть позиции заказа
    container.querySelectorAll('.order-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const items = btn.closest('.order-card').querySelector('.order-items');
        const isOpen = items.style.display !== 'none';
        items.style.display = isOpen ? 'none' : 'block';
        btn.textContent = isOpen ? 'Показать состав ▾' : 'Скрыть состав ▴';
      });
    });

  } catch (err) {
    container.innerHTML = `<p style="color:var(--white-30);padding:40px 0;text-align:center">Не удалось загрузить заказы</p>`;
  }
}

function renderOrder(order) {
  const STATUS_LABELS = {
    new:       { label: 'Новый',       color: '#c9a84c' },
    confirmed: { label: 'Подтверждён', color: '#4caf8c' },
    shipped:   { label: 'Отправлен',   color: '#4c8caf' },
    delivered: { label: 'Доставлен',   color: '#4caf4c' },
    cancelled: { label: 'Отменён',     color: '#af4c4c' }
  };

  const st = STATUS_LABELS[order.status] || STATUS_LABELS.new;
  const date = new Date(order.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const deliveryText = order.delivery_type === 'pickup'
    ? `Самовывоз · ${order.pickup_store || ''}`
    : `Доставка · ${order.city || ''}${order.address ? ', ' + order.address : ''}`;

  const items = order.order_items || [];

  return `
    <div class="order-card">
      <div class="order-card__header">
        <div class="order-card__meta">
          <span class="order-card__id">Заказ #${order.id}</span>
          <span class="order-card__date">${date}</span>
        </div>
        <span class="order-card__status" style="color:${st.color}">${st.label}</span>
      </div>

      <div class="order-card__delivery">${escapeHTML(deliveryText)}</div>

      <div class="order-card__footer">
        <span class="order-card__total">${Number(order.total_price).toLocaleString('ru')} ₸</span>
        ${items.length
          ? `<button class="order-toggle btn btn--outline" style="padding:8px 16px;font-size:12px">Показать состав ▾</button>`
          : ''}
      </div>

      ${items.length ? `
        <div class="order-items" style="display:none">
          ${items.map(item => `
            <div class="order-item">
              <span class="order-item__name">${escapeHTML(item.brand)} — ${escapeHTML(item.name)}</span>
              <span class="order-item__vol">${escapeHTML(item.volume)} × ${item.qty}</span>
              <span class="order-item__price">${Number(item.price * item.qty).toLocaleString('ru')} ₸</span>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}

/* =============================================
   PROFILE
   ============================================= */
async function loadProfile() {
  const user = getCurrentUser();
  document.getElementById('profileEmail').value = user.email || '';
  document.getElementById('profileName').value  = user.user_metadata?.full_name || '';

  // Загружаем телефон из profiles
  try {
    const token = getAccessToken();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=phone`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data[0]?.phone) {
      document.getElementById('profilePhone').value = data[0].phone;
    }
  } catch { /* ignore */ }

  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
}

async function saveProfile() {
  const name  = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const token = getAccessToken();
  const user  = getCurrentUser();

  const errEl = document.getElementById('profileError');
  if (errEl) errEl.textContent = '';

  try {
    // Обновляем профиль в таблице profiles
    await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ full_name: name, phone })
      }
    );

    // Показываем подтверждение
    const savedEl = document.getElementById('profileSaved');
    if (savedEl) {
      savedEl.style.display = 'inline';
      setTimeout(() => savedEl.style.display = 'none', 2500);
    }

    // Обновляем имя в сайдбаре
    document.getElementById('sidebarName').textContent = name || user.email;

  } catch (err) {
    if (errEl) errEl.textContent = 'Не удалось сохранить. Попробуйте ещё раз.';
  }
}
