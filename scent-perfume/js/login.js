/**
 * Scent Perfume Bar — login.js
 * Логика форм входа и регистрации
 */

'use strict';

// Если уже залогинен — редирект
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    window.location.href = 'account.html';
    return;
  }
  initLoginPage();
});

function initLoginPage() {
  // Tabs
  document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
  document.getElementById('tabRegister').addEventListener('click', () => switchTab('register'));

  // Toggle password visibility
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  // Login submit
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  // Register submit
  document.getElementById('registerBtn').addEventListener('click', handleRegister);
  document.getElementById('regPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleRegister();
  });
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('auth-tab--active', isLogin);
  document.getElementById('tabRegister').classList.toggle('auth-tab--active', !isLogin);
  document.getElementById('formLogin').style.display = isLogin ? 'block' : 'none';
  document.getElementById('formRegister').style.display = isLogin ? 'none' : 'block';
  document.getElementById('authSuccess').style.display = 'none';
  clearAllErrors();
}

function clearAllErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
}

function setError(fieldId, errId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add('error');
  if (err)   err.textContent = msg;
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading
    ? (btnId === 'loginBtn' ? 'Входим...' : 'Создаём аккаунт...')
    : (btnId === 'loginBtn' ? 'Войти' : 'Создать аккаунт');
}

// ─── LOGIN ────────────────────────────────────────────────────
async function handleLogin() {
  clearAllErrors();

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  let valid = true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('loginEmail', 'loginEmailErr', 'Введите корректный email');
    valid = false;
  }
  if (!password) {
    setError('loginPassword', 'loginPasswordErr', 'Введите пароль');
    valid = false;
  }
  if (!valid) return;

  setLoading('loginBtn', true);
  try {
    await signIn(email, password);
    // Редирект — если пришли с другой страницы, возвращаем туда
    const returnTo = new URLSearchParams(window.location.search).get('from') || 'account.html';
    window.location.href = returnTo;
  } catch (err) {
    const errEl = document.getElementById('loginError');
    if (errEl) {
      errEl.textContent = translateAuthError(err.message);
    }
  } finally {
    setLoading('loginBtn', false);
  }
}

// ─── REGISTER ─────────────────────────────────────────────────
async function handleRegister() {
  clearAllErrors();

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  let valid = true;
  if (!name || name.length < 2) {
    setError('regName', 'regNameErr', 'Введите ваше имя');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('regEmail', 'regEmailErr', 'Введите корректный email');
    valid = false;
  }
  if (!password || password.length < 6) {
    setError('regPassword', 'regPasswordErr', 'Минимум 6 символов');
    valid = false;
  }
  if (!valid) return;

  setLoading('registerBtn', true);
  try {
    const result = await signUp(email, password, name);

    // Скрываем форму, показываем успех
    document.getElementById('formRegister').style.display = 'none';
    document.getElementById('authSuccess').style.display = 'block';

    const successText = document.getElementById('authSuccessText');
    if (result.access_token) {
      // Сразу залогинен
      if (successText) successText.textContent = `${name}, добро пожаловать в Scent Perfume Bar!`;
    } else {
      // Нужно подтверждение email
      if (successText) successText.textContent = `${name}, мы отправили письмо на ${email}. Подтвердите email и войдите.`;
      document.querySelector('#authSuccess .btn').href = 'login.html';
      document.querySelector('#authSuccess .btn').textContent = 'Войти';
    }
  } catch (err) {
    const errEl = document.getElementById('regError');
    if (errEl) errEl.textContent = translateAuthError(err.message);
  } finally {
    setLoading('registerBtn', false);
  }
}

// ─── ERROR TRANSLATIONS ───────────────────────────────────────
function translateAuthError(msg) {
  if (!msg) return 'Произошла ошибка. Попробуйте ещё раз.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Неверный email или пароль';
  if (m.includes('email not confirmed'))
    return 'Подтвердите email — мы отправили письмо';
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Этот email уже зарегистрирован. Войдите.';
  if (m.includes('password should be'))
    return 'Пароль слишком короткий (минимум 6 символов)';
  if (m.includes('rate limit'))
    return 'Слишком много попыток. Подождите немного.';
  return 'Ошибка: ' + msg;
}
