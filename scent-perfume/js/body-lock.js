/* =============================================
   BODY SCROLL LOCK
   Применяем overflow:hidden на <html>, а не на body —
   body-overflow ломает touch-события внутри fixed-элементов на iOS Safari
   ============================================= */
(function() {
  const locks = new Set();

  window.bodyLock = function(id) {
    if (locks.size === 0) {
      document.documentElement.style.overflow = 'hidden';
    }
    locks.add(id);
  };

  window.bodyUnlock = function(id) {
    locks.delete(id);
    if (locks.size === 0) {
      document.documentElement.style.overflow = '';
    }
  };

  window.bodyUnlockAll = function() {
    locks.clear();
    document.documentElement.style.overflow = '';
  };
})();
