/* =============================================
   BODY SCROLL LOCK
   Простой вариант без position:fixed на body —
   position:fixed ломает click-события на iOS
   ============================================= */
(function() {
  const locks = new Set();
  let scrollY = 0;

  window.bodyLock = function(id) {
    if (locks.size === 0) {
      scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
    }
    locks.add(id);
  };

  window.bodyUnlock = function(id) {
    locks.delete(id);
    if (locks.size === 0) {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
  };

  window.bodyUnlockAll = function() {
    locks.clear();
    document.body.style.overflow = '';
    document.body.style.height = '';
  };
})();
