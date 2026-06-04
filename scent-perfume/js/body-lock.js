/* =============================================
   BODY SCROLL LOCK MANAGER
   Решает баг Android: несколько модалов/попапов
   конкурируют за overflow:hidden
   ============================================= */
(function() {
  const locks = new Set();
  let scrollY = 0;

  window.bodyLock = function(id) {
    if (locks.size === 0) {
      scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    }
    locks.add(id);
  };

  window.bodyUnlock = function(id) {
    locks.delete(id);
    if (locks.size === 0) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    }
  };

  window.bodyUnlockAll = function() {
    locks.clear();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
  };
})();
