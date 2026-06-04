/**
 * Scent Perfume Bar — auth.js
 * Управление сессией, вход/регистрация/выход
 * Подключается на ВСЕХ страницах вместе с api.js
 */

'use strict';

// ─── Supabase Auth API helpers ────────────────────────────────
// Используем те же SUPABASE_URL и SUPABASE_KEY что в api.js

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.message || data.msg || 'Ошибка запроса');
  return data;
}

// ─── SESSION STORAGE ──────────────────────────────────────────
const SESSION_KEY = 'scent_session';

function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function getAccessToken() {
  return getSession()?.access_token || null;
}

function getCurrentUser() {
  return getSession()?.user || null;
}

function isLoggedIn() {
  const session = getSession();
  if (!session) return false;
  // Проверяем срок действия токена
  const expiresAt = session.expires_at;
  if (expiresAt && Date.now() / 1000 > expiresAt) {
    saveSession(null);
    return false;
  }
  return true;
}

// ─── AUTH OPERATIONS ─────────────────────────────────────────

async function signUp(email, password, fullName) {
  const data = await supabaseRequest('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: { full_name: fullName.trim() }
    })
  });
  // Supabase может потребовать подтверждение email
  // Если сессия есть — сохраняем
  if (data.access_token) {
    saveSession(data);
  }
  return data;
}

async function signIn(email, password) {
  const data = await supabaseRequest(
    '/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password
    })
  });
  saveSession(data);
  return data;
}

async function signOut() {
  const token = getAccessToken();
  if (token) {
    try {
      await supabaseRequest('/auth/v1/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch { /* ignore */ }
  }
  saveSession(null);
  updateAuthNav();
  window.location.href = 'index.html';
}

async function refreshSession() {
  const session = getSession();
  if (!session?.refresh_token) return false;
  try {
    const data = await supabaseRequest(
      '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    saveSession(data);
    return true;
  } catch {
    saveSession(null);
    return false;
  }
}

// ─── NAV UPDATE ───────────────────────────────────────────────
// Обновляет шапку: показывает "Войти" или иконку профиля

function updateAuthNav() {
  const user = getCurrentUser();
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  // Удаляем старые auth-элементы если есть
  navLinks.querySelectorAll('.nav__auth-item').forEach(el => el.remove());

  const li = document.createElement('li');
  li.className = 'nav__auth-item';

  if (user) {
    li.innerHTML = `
      <a href="account.html" class="nav__link nav__account-btn" title="Личный кабинет">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </a>`;
  } else {
    li.innerHTML = `
      <a href="login.html" class="nav__link nav__login-btn">Войти</a>`;
  }

  // Вставляем перед иконкой корзины
  const cartLi = navLinks.querySelector('li:last-child');
  navLinks.insertBefore(li, cartLi);

  // Update drawer profile link
  const drawerProfile = document.getElementById('drawerProfile');
  if (drawerProfile) {
    const session = supabase.auth.session ? supabase.auth.session() : null;
    if (session) {
      drawerProfile.textContent = 'Профиль';
      drawerProfile.href = 'account.html';
    } else {
      drawerProfile.textContent = 'Войти';
      drawerProfile.href = 'login.html';
    }
  }
}

// ─── AUTO-REFRESH ─────────────────────────────────────────────
// Обновляет токен за 5 минут до истечения

function scheduleTokenRefresh() {
  const session = getSession();
  if (!session?.expires_at) return;

  const msUntilExpiry = (session.expires_at * 1000) - Date.now();
  const refreshIn = msUntilExpiry - 5 * 60 * 1000; // за 5 минут

  if (refreshIn > 0) {
    setTimeout(async () => {
      await refreshSession();
      scheduleTokenRefresh();
    }, refreshIn);
  } else if (msUntilExpiry > 0) {
    refreshSession().then(scheduleTokenRefresh);
  }
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем токен при каждой загрузке страницы
  if (isLoggedIn()) {
    scheduleTokenRefresh();
  }
  updateAuthNav();
});
