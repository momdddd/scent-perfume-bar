/* =============================================
   TAP-FIX — глобальная страховка от "мёртвых" тапов
   на Android/мобильных браузерах.

   Решает баг: кнопки начинают работать только после
   скролла до определённого места.

   Причина бага: невидимые декоративные слои (фон, градиент,
   частицы) и закрытые оверлеи иногда остаются поверх контента
   с активными pointer-events, перехватывая тапы. Браузер
   "освобождает" их только после перерасчёта layout (скролла).

   Решение: при загрузке принудительно убеждаемся, что все
   закрытые оверлеи не перехватывают события, и сбрасываем
   возможную блокировку body.
   ============================================= */
(function () {
  'use strict';

  function releaseTaps() {
    // 1. Сбросить блокировку скролла, если она "залипла"
    if (typeof window.bodyUnlockAll === 'function') {
      // Разблокируем только если нет открытых модалов
      const anyOpen = document.querySelector(
        '.nav__drawer.open, .vol-overlay.open, .wa-popup-overlay.open, .product-modal-overlay.open, .insta-float--open'
      );
      if (!anyOpen) window.bodyUnlockAll();
    }

    // 2. Закрытые оверлеи — гарантированно не перехватывают тапы
    document.querySelectorAll(
      '.nav__overlay:not(.open), .wa-popup-overlay:not(.open), .vol-overlay:not(.open), .product-modal-overlay:not(.open)'
    ).forEach(function (el) {
      el.style.pointerEvents = 'none';
    });

    // 3. Открытые — наоборот, ловят тапы
    document.querySelectorAll(
      '.nav__overlay.open, .wa-popup-overlay.open, .vol-overlay.open, .product-modal-overlay.open'
    ).forEach(function (el) {
      el.style.pointerEvents = 'auto';
    });
  }

  // Запускаем на всех ключевых стадиях загрузки
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', releaseTaps);
  } else {
    releaseTaps();
  }
  window.addEventListener('load', releaseTaps);
  window.addEventListener('pageshow', releaseTaps);

  // Лёгкий «пинок» layout сразу после загрузки — заставляет
  // Android пересчитать слои без участия пользователя,
  // чтобы тапы работали с первой секунды (без скролла).
  window.addEventListener('load', function () {
    requestAnimationFrame(function () {
      document.body.style.minHeight = '100.01%';
      requestAnimationFrame(function () {
        document.body.style.minHeight = '';
      });
    });
  });

  // Экспортируем на случай ручного вызова после закрытия модалов
  window.releaseTaps = releaseTaps;
})();
