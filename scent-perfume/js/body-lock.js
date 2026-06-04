/* =============================================
   BODY SCROLL LOCK — надёжная версия
   Не использует position:fixed и height на body
   (они ломают тап-события на Android/iOS).
   Блокируем скролл только через overflow на documentElement.
   ============================================= */
(function () {
  const locks = new Set();

  window.bodyLock = function (id) {
    locks.add(id);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  };

  window.bodyUnlock = function (id) {
    locks.delete(id);
    if (locks.size === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  };

  window.bodyUnlockAll = function () {
    locks.clear();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  };
})();
