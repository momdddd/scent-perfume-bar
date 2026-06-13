/**
 * Scent Perfume Bar — login.js
 * Вход, регистрация и ожидание подтверждения email.
 *
 * Как работает подтверждение:
 * 1. signUp → Supabase шлёт письмо, сессии ещё нет → показываем
 *    экран «Проверьте почту» (никаких редиректов).
 * 2. Эта вкладка каждые 4 секунды пробует войти с введёнными
 *    email+паролем. Пока почта не подтверждена, Supabase отвечает
 *    «Email not confirmed» — ждём дальше.
 * 3. Человек жмёт кнопку в письме (хоть с телефона) → попытка входа
 *    проходит → сохраняем сессию, дозаписываем профиль и идём в кабинет.
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

/* ─── Состояние ожидания подтверждения ────────────────────────── */
let pendingConfirm = null;        // { email, password, name, phone }
let confirmPollTimer = null;
let resendCooldownTimer = null;
let pollBusy = false;

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

  // Register submit (Enter из любого поля формы)
  document.getElementById('registerBtn').addEventListener('click', handleRegister);
  ['regName', 'regEmail', 'regPhone', 'regPassword'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleRegister();
    });
  });

  initRegPhoneMask();

  // Экран «Проверьте почту»
  document.getElementById('resendEmailBtn')?.addEventListener('click', handleResend);
  document.getElementById('changeEmailBtn')?.addEventListener('click', () => switchTab('register'));

  // Вернулись на вкладку — проверяем сразу, не дожидаясь таймера
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && pendingConfirm) pollConfirmOnce();
  });
}

function switchTab(tab) {
  stopWaitingForConfirm();
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('auth-tab--active', isLogin);
  document.getElementById('tabRegister').classList.toggle('auth-tab--active', !isLogin);
  document.getElementById('formLogin').style.display    = isLogin ? 'block' : 'none';
  document.getElementById('formRegister').style.display = isLogin ? 'none' : 'block';
  document.getElementById('authSuccess').style.display  = 'none';
  document.getElementById('checkEmailView').style.display = 'none';
  document.querySelector('.auth-tabs').style.display = 'flex';
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

/* Маска телефона — общий helper attachPhoneMask() из main.js */
function initRegPhoneMask() {
  attachPhoneMask(document.getElementById('regPhone'));
}

/* ─── LOGIN ────────────────────────────────────────────────────── */
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
    // Аккаунт есть, но почта не подтверждена — показываем экран ожидания,
    // поллинг сработает как только человек нажмёт кнопку в письме
    if ((err.message || '').toLowerCase().includes('not confirmed')) {
      showCheckEmail({ email, password });
    } else {
      const errEl = document.getElementById('loginError');
      if (errEl) errEl.textContent = translateAuthError(err.message);
    }
  } finally {
    setLoading('loginBtn', false);
  }
}

/* ─── REGISTER ─────────────────────────────────────────────────── */
async function handleRegister() {
  clearAllErrors();

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const phone    = (document.getElementById('regPhone')?.value || '').trim();
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
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 12) {
      setError('regPhone', 'regPhoneErr', 'Неверный номер — или оставьте поле пустым');
      valid = false;
    }
  }
  if (!password || password.length < 6) {
    setError('regPassword', 'regPasswordErr', 'Минимум 6 символов');
    valid = false;
  }
  if (!valid) return;

  setLoading('registerBtn', true);
  try {
    const result = await signUp(email, password, name, phone);

    // Подтверждение почты выключено — сессия пришла сразу
    if (result.access_token) {
      await upsertProfileQuiet(name, phone);
      window.location.href = 'account.html';
      return;
    }

    // При включённом подтверждении Supabase возвращает пользователя без
    // сессии. Пустой identities означает: такой email уже зарегистрирован
    // (Supabase маскирует это от перебора адресов).
    const u = result.user || result;
    if (Array.isArray(u?.identities) && u.identities.length === 0) {
      setError('regEmail', 'regEmailErr', 'Этот email уже зарегистрирован — попробуйте войти');
      return;
    }

    showCheckEmail({ email, password, name, phone });
  } catch (err) {
    const errEl = document.getElementById('regError');
    if (errEl) errEl.textContent = translateAuthError(err.message);
  } finally {
    setLoading('registerBtn', false);
  }
}

/* ─── ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ EMAIL ─────────────────────────────── */

function showCheckEmail(data) {
  pendingConfirm = data;
  document.getElementById('formLogin').style.display    = 'none';
  document.getElementById('formRegister').style.display = 'none';
  document.getElementById('authSuccess').style.display  = 'none';
  document.querySelector('.auth-tabs').style.display = 'none';

  document.getElementById('checkEmailAddr').textContent = data.email;
  document.getElementById('checkEmailWaiting').style.display   = 'flex';
  document.getElementById('checkEmailConfirmed').style.display = 'none';
  const errEl = document.getElementById('checkEmailError');
  if (errEl) errEl.textContent = '';
  document.getElementById('checkEmailView').style.display = 'block';

  startConfirmPolling();
}

function stopWaitingForConfirm() {
  pendingConfirm = null;
  if (confirmPollTimer) { clearInterval(confirmPollTimer); confirmPollTimer = null; }
}

function startConfirmPolling() {
  if (confirmPollTimer) clearInterval(confirmPollTimer);
  confirmPollTimer = setInterval(pollConfirmOnce, 4000);
}

async function pollConfirmOnce() {
  if (!pendingConfirm || pollBusy) return;
  pollBusy = true;
  try {
    await signIn(pendingConfirm.email, pendingConfirm.password);
    await onEmailConfirmed();
  } catch (e) {
    // «Email not confirmed» — ещё не подтвердили, ждём следующий тик
  } finally {
    pollBusy = false;
  }
}

async function onEmailConfirmed() {
  const data = pendingConfirm;
  stopWaitingForConfirm();

  document.getElementById('checkEmailWaiting').style.display   = 'none';
  document.getElementById('checkEmailConfirmed').style.display = 'block';

  await upsertProfileQuiet(data?.name, data?.phone);
  setTimeout(() => { window.location.href = 'account.html'; }, 1200);
}

/* Дозаписываем профиль (имя/телефон) после первого успешного входа.
   Телефон из формы регистрации иначе никуда бы не попал: триггер в БД
   копирует только full_name. */
async function upsertProfileQuiet(name, phone) {
  try {
    const user  = getCurrentUser();
    const token = getAccessToken();
    if (!user || !token) return;
    const meta = user.user_metadata || {};
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id:        user.id,
        full_name: name  || meta.full_name || '',
        phone:     phone || meta.phone     || ''
      })
    });
  } catch { /* не критично — данные можно ввести в кабинете */ }
}

/* ─── ПИСЬМО ЕЩЁ РАЗ ───────────────────────────────────────────── */
async function handleResend() {
  if (!pendingConfirm) return;
  const btn   = document.getElementById('resendEmailBtn');
  const errEl = document.getElementById('checkEmailError');
  if (errEl) errEl.textContent = '';
  btn.disabled = true;
  try {
    await resendSignupEmail(pendingConfirm.email);
    startResendCooldown(60);
  } catch (err) {
    btn.disabled = false;
    if (errEl) errEl.textContent = translateAuthError(err.message);
  }
}

function startResendCooldown(seconds) {
  const btn = document.getElementById('resendEmailBtn');
  let left = seconds;
  btn.disabled = true;
  btn.textContent = `отправлено (${left})`;
  if (resendCooldownTimer) clearInterval(resendCooldownTimer);
  resendCooldownTimer = setInterval(() => {
    left--;
    if (left <= 0) {
      clearInterval(resendCooldownTimer);
      btn.disabled = false;
      btn.textContent = 'отправить ещё раз';
    } else {
      btn.textContent = `отправлено (${left})`;
    }
  }, 1000);
}

/* ─── ERROR TRANSLATIONS ───────────────────────────────────────── */
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
  if (m.includes('security purposes'))
    return 'Слишком часто — подождите минуту и попробуйте снова';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Слишком много попыток. Подождите немного.';
  return 'Ошибка: ' + msg;
}
