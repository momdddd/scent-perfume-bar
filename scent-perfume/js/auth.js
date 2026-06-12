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

// Куда Supabase отправит человека после клика по кнопке в письме.
// confirm.html — мини-страница «Email подтверждён, можно закрыть окно».
// ВАЖНО: этот URL должен быть в allowlist:
// Supabase → Authentication → URL Configuration → Redirect URLs
function emailRedirectURL() {
  return new URL('confirm.html', window.location.href).href;
}

async function signUp(email, password, fullName, phone) {
  const data = await supabaseRequest(
    '/auth/v1/signup?redirect_to=' + encodeURIComponent(emailRedirectURL()), {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: {
        full_name: fullName.trim(),
        phone: (phone || '').trim()
      }
    })
  });
  // Если подтверждение почты выключено — сессия приходит сразу, сохраняем
  if (data.access_token) {
    saveSession(data);
  }
  return data;
}

// Повторная отправка письма подтверждения
async function resendSignupEmail(email) {
  return supabaseRequest(
    '/auth/v1/resend?redirect_to=' + encodeURIComponent(emailRedirectURL()), {
    method: 'POST',
    body: JSON.stringify({
      type: 'signup',
      email: email.trim().toLowerCase()
    })
  });
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

  // Иконка профиля в nav__actions (уже есть в HTML)
  const navProfile = document.getElementById('navProfile');
  if (navProfile) {
    navProfile.href = user ? 'account.html' : 'login.html';
    navProfile.title = user ? 'Личный кабинет' : 'Войти';
  }

  // Drawer ссылка
  const drawerProfile = document.getElementById('drawerProfile');
  if (drawerProfile) {
    drawerProfile.textContent = user ? 'Профиль' : 'Войти';
    drawerProfile.href = user ? 'account.html' : 'login.html';
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
