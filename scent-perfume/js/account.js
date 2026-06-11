/**
 * Scent Perfume Bar — account.js (исправленный)
 * Имя всегда читается из public.profiles, не из auth метаданных
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = 'login.html?from=account.html';
    return;
  }
  initAccount();
});

async function initAccount() {
  const user  = getCurrentUser();
  const token = getAccessToken();

  // Загружаем профиль из БД — это единственный источник правды
  const profile = await loadProfileData(user.id, token);

  const displayName = profile.full_name || user.email.split('@')[0];
  const email       = user.email || '';

  // Заполняем шапку кабинета
  document.getElementById('accountTitle').textContent = `Привет, ${displayName}`;
  document.getElementById('sidebarName').textContent  = displayName;
  document.getElementById('sidebarEmail').textContent = email;

  // Навигация по секциям
  document.querySelectorAll('.account-nav__link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.account-nav__link')
        .forEach(b => b.classList.remove('account-nav__link--active'));
      btn.classList.add('account-nav__link--active');

      const section = btn.dataset.section;
      document.getElementById('sectionOrders').style.display  = section === 'orders'  ? 'block' : 'none';
      document.getElementById('sectionProfile').style.display = section === 'profile' ? 'block' : 'none';

      if (section === 'profile') fillProfileForm(profile, email);
    });
  });

  // Выход
  document.getElementById('logoutBtn').addEventListener('click', signOut);

  // Загружаем заказы сразу
  await loadOrders(token);
}

/* =============================================
   ЗАГРУЗКА ПРОФИЛЯ ИЗ БД
   ============================================= */
async function loadProfileData(userId, token) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=full_name,phone`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await res.json();
    return data[0] || { full_name: '', phone: '' };
  } catch {
    return { full_name: '', phone: '' };
  }
}

/* =============================================
   ЗАПОЛНИТЬ ФОРМУ ПРОФИЛЯ
   ============================================= */
function fillProfileForm(profile, email) {
  const nameInput  = document.getElementById('profileName');
  const phoneInput = document.getElementById('profilePhone');
  const emailInput = document.getElementById('profileEmail');

  if (nameInput)  nameInput.value  = profile.full_name || '';
  if (phoneInput) phoneInput.value = profile.phone     || '';
  if (emailInput) emailInput.value = email;

  // Вешаем обработчик один раз
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    const newBtn = saveBtn.cloneNode(true); // убираем старые listeners
    saveBtn.parentNode.replaceChild(newBtn, saveBtn);
    newBtn.addEventListener('click', saveProfile);
  }
}

/* =============================================
   СОХРАНИТЬ ПРОФИЛЬ
   ============================================= */
async function saveProfile() {
  const user  = getCurrentUser();
  const token = getAccessToken();

  const name  = (document.getElementById('profileName')?.value  || '').trim();
  const phone = (document.getElementById('profilePhone')?.value || '').trim();

  const errEl   = document.getElementById('profileError');
  const savedEl = document.getElementById('profileSaved');
  if (errEl)   errEl.textContent   = '';
  if (savedEl) savedEl.style.display = 'none';

  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Сохраняем...'; }

  try {
    // UPSERT вместо PATCH: если строки профиля нет (таблицу пересоздавали
    // после регистрации) — она создастся, если есть — обновится.
    // PATCH по несуществующей строке возвращает 204 OK и молча не пишет ничего.
    const doSave = (tok) => fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${tok}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({ id: user.id, full_name: name, phone })
    });

    let res = await doSave(token);

    // Токен мог истечь — обновляем сессию и пробуем один раз ещё
    if (res.status === 401 && typeof refreshSession === 'function' && await refreshSession()) {
      res = await doSave(getAccessToken());
    }

    if (!res.ok) throw new Error('Ошибка сохранения');

    // return=representation вернёт сохранённую строку — проверяем по-настоящему
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error('Профиль не записался');

    // Обновляем имя в шапке кабинета сразу без перезагрузки
    const displayName = name || user.email.split('@')[0];
    document.getElementById('sidebarName').textContent  = displayName;
    document.getElementById('accountTitle').textContent = `Привет, ${displayName}`;

    if (savedEl) {
      savedEl.style.display = 'inline';
      setTimeout(() => savedEl.style.display = 'none', 2500);
    }

  } catch {
    if (errEl) errEl.textContent = 'Не удалось сохранить. Попробуйте ещё раз.';
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Сохранить'; }
  }
}

/* =============================================
   ЗАКАЗЫ
   ============================================= */
async function loadOrders(token) {
  const container = document.getElementById('ordersList');
  if (!container) return;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error('Ошибка загрузки');
    const orders = await res.json();

    if (!orders.length) {
      container.innerHTML = `
        <div class="orders-empty">
          <p class="orders-empty__icon">✦</p>
          <p class="orders-empty__text">Заказов пока нет</p>
          <a href="catalog.html" class="btn btn--gold" style="margin-top:20px">
            Перейти в каталог
          </a>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => renderOrder(order)).join('');

    // Аккордеон — состав заказа
    container.querySelectorAll('.order-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const items  = btn.closest('.order-card').querySelector('.order-items');
        const isOpen = items.style.display !== 'none';
        items.style.display = isOpen ? 'none' : 'block';
        btn.textContent     = isOpen ? 'Показать состав ▾' : 'Скрыть состав ▴';
      });
    });

  } catch {
    container.innerHTML = `
      <p style="color:var(--white-30);padding:40px 0;text-align:center">
        Не удалось загрузить заказы
      </p>`;
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

  const st   = STATUS_LABELS[order.status] || STATUS_LABELS.new;
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
        <span class="order-card__total">
          ${Number(order.total_price).toLocaleString('ru')} ₸
        </span>
        ${items.length
          ? `<button class="order-toggle btn btn--outline"
               style="padding:8px 16px;font-size:12px">
               Показать состав ▾
             </button>`
          : ''}
      </div>

      ${items.length ? `
        <div class="order-items" style="display:none">
          ${items.map(item => `
            <div class="order-item">
              <span class="order-item__name">
                ${escapeHTML(item.brand)} — ${escapeHTML(item.name)}
              </span>
              <span class="order-item__vol">
                ${escapeHTML(item.volume)}${item.label ? ' · ' + escapeHTML(item.label) : ''} × ${item.qty}
              </span>
              <span class="order-item__price">
                ${Number(item.price * item.qty).toLocaleString('ru')} ₸
              </span>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}