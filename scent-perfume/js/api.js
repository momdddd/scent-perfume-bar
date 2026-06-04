/**
 * Scent Perfume Bar — api.js
 * Заменяет products-data.js
 * Загружает товары из Supabase (бесплатный PostgreSQL)
 *
 * КАК ПОДКЛЮЧИТЬ:
 * 1. Зарегистрируйся на supabase.com
 * 2. Создай проект → Settings → API
 * 3. Скопируй Project URL и anon public key в переменные ниже
 */

'use strict';

// ─── КОНФИГ ──────────────────────────────────────────────────────────────────
// Замени эти две строки на свои значения из Supabase → Settings → API
const SUPABASE_URL = 'https://uukoiucdejqagoaklxqd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a29pdWNkZWpxYWdvYWtseHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjA4MzUsImV4cCI6MjA5NTg5NjgzNX0.qZVUtKGxEpEmRfZEp8sXvj-67f5g1O-BR60n0EL9d-A'; // anon / public key — безопасен для фронта
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Загружает все товары из таблицы products.
 * Supabase возвращает их как массив JSON через REST API.
 * Колонки БД (snake_case) преобразуются в формат, который ожидает сайт.
 *
 * @returns {Promise<Array>} массив товаров
 */
async function fetchProducts() {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?select=*` +
    `&in_stock=eq.true` +        // только товары в наличии
    `&order=sort_order.asc`;     // сортировка по sort_order

  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
  }

  const rows = await response.json();

  // Приводим формат БД → формат, который ожидают catalog.js / volume-selector.js
  return rows.map(row => ({
    id:          row.id,
    brand:       row.brand,
    name:        row.name,
    notes:       row.notes,
    category:    row.category,
    scentType:   row.scent_type,
    pricePerMl:  row.price_per_ml ? Number(row.price_per_ml) : null,
    fullBottle:  row.full_bottle_volume && row.full_bottle_price
                   ? { volume: row.full_bottle_volume, price: Number(row.full_bottle_price) }
                   : null,
    badge:       row.badge || null,
    description: row.description,
    image:       row.image_url || null,
    inStock:     row.in_stock
  }));
}

/**
 * Глобальный кэш — загружается один раз при старте страницы.
 * catalog.js и main.js обращаются к PRODUCTS_DATA так же, как раньше.
 */
let PRODUCTS_DATA = [];

/**
 * Инициализация: загрузить товары, потом запустить страницу.
 * Вызывается в конце этого файла через DOMContentLoaded.
 */
async function initProductsFromDB() {
  try {
    showLoadingState(true);
    PRODUCTS_DATA = await fetchProducts();
    showLoadingState(false);

    // Запускаем нужную логику в зависимости от страницы
    if (typeof initCatalog === 'function')  initCatalog();   // catalog.js
    if (typeof loadProducts === 'function') loadProducts();  // main.js (homepage)

  } catch (err) {
    console.error('[api.js] Не удалось загрузить товары:', err);
    showLoadingState(false);
    showLoadError();
  }
}

function showLoadingState(active) {
  // Каталог: спиннер уже в HTML, просто оставим — он исчезнет при рендере
  // Главная: ничего дополнительного не нужно
  const spinner = document.querySelector('.catalog-loading');
  if (spinner) spinner.style.display = active ? 'flex' : 'none';
}

function showLoadError() {
  const grid = document.getElementById('catalogGrid') || document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--white-30)">
      <p style="font-size:2rem;margin-bottom:16px;color:var(--gold)">✦</p>
      <p style="font-size:1.1rem;color:var(--white-60);margin-bottom:8px">Не удалось загрузить каталог</p>
      <p style="font-size:.85rem">Проверьте настройки Supabase в файле api.js</p>
    </div>`;
}

// Запускаем как только DOM готов
document.addEventListener('DOMContentLoaded', initProductsFromDB);
