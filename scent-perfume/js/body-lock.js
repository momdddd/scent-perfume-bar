/**
 * body-lock.js
 * Утилита для блокировки/разблокировки скролла страницы.
 * Компенсирует ширину скроллбара, чтобы контент не «прыгал».
 *
 * API:
 *   bodyLock()    — заблокировать скролл
 *   bodyUnlock()  — разблокировать скролл
 *   bodyLockToggle(force?) — переключить (или задать явно: true/false)
 */

(function () {
  'use strict';

  let lockCount = 0; // поддержка вложенных вызовов

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function bodyLock() {
    if (lockCount === 0) {
      const scrollbarWidth = getScrollbarWidth();

      // Компенсируем ширину скроллбара, чтобы контент не прыгал
      if (scrollbarWidth > 0) {
        document.documentElement.style.setProperty(
          '--scrollbar-width',
          scrollbarWidth + 'px'
        );
        document.body.style.paddingRight = scrollbarWidth + 'px';
      }

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('body--locked');
    }
    lockCount++;
  }

  function bodyUnlock() {
    if (lockCount > 0) lockCount--;

    if (lockCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.removeProperty('--scrollbar-width');
      document.body.classList.remove('body--locked');
    }
  }

  function bodyLockToggle(force) {
    if (typeof force === 'boolean') {
      force ? bodyLock() : bodyUnlock();
    } else {
      document.body.classList.contains('body--locked') ? bodyUnlock() : bodyLock();
    }
  }

  // Экспортируем в глобальный скоуп
  window.bodyLock = bodyLock;
  window.bodyUnlock = bodyUnlock;
  window.bodyLockToggle = bodyLockToggle;
})();
