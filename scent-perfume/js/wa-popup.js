/* =============================================
   WhatsApp Popup — два магазина
   ============================================= */
(function () {

  const WA_KRG = 'https://api.whatsapp.com/send/?phone=77071210281&text&type=phone_number&app_absent=0';
  const WA_ATB = 'https://api.whatsapp.com/send/?phone=77017792729&text&type=phone_number&app_absent=0';

  const WA_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

  // Inject popup HTML
  document.body.insertAdjacentHTML('beforeend', `
    <div class="wa-popup-overlay" id="waPopupOverlay">
      <div class="wa-popup" id="waPopup">

        <div class="wa-popup__header">
          <div class="wa-popup__title-wrap">
            <div class="wa-popup__icon">${WA_SVG}</div>
            <div>
              <div class="wa-popup__title">Написать в WhatsApp</div>
              <div class="wa-popup__subtitle">Выберите магазин</div>
            </div>
          </div>
          <button class="wa-popup__close" id="waPopupClose" aria-label="Закрыть">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="wa-popup__stores">

          <a href="${WA_KRG}" target="_blank" rel="noopener noreferrer" class="wa-store" id="waKrg">
            <div class="wa-store__avatar">
              <img src="assets/logo-krg.jpg" alt="Scent Perfume Bar Караганда" />
            </div>
            <div class="wa-store__info">
              <div class="wa-store__name">Scent Perfume Bar</div>
              <div class="wa-store__city">Караганда</div>
              <div class="wa-store__address">Бухар-Жырау 55/7, ТД Арбат, 2 этаж</div>
            </div>
            <div class="wa-store__btn">${WA_SVG}</div>
          </a>

          <div class="wa-popup__divider"></div>

          <a href="${WA_ATB}" target="_blank" rel="noopener noreferrer" class="wa-store" id="waAtb">
            <div class="wa-store__avatar">
              <img src="assets/logo-atb.jpg" alt="Дом Парфюма Атбасар" />
            </div>
            <div class="wa-store__info">
              <div class="wa-store__name">Дом Парфюма</div>
              <div class="wa-store__city">Атбасар</div>
              <div class="wa-store__address">Л. Белаш 39/1, ТД Керуен, 2 этаж</div>
            </div>
            <div class="wa-store__btn">${WA_SVG}</div>
          </a>

        </div>
      </div>
    </div>
  `);

  const overlay = document.getElementById('waPopupOverlay');
  const closeBtn = document.getElementById('waPopupClose');

  function openWaPopup() {
    overlay.classList.add('open');
    bodyLock('wa-popup');
  }
  function closeWaPopup() {
    overlay.classList.remove('open');
    bodyUnlock('wa-popup');
  }

  // Close on button or overlay click
  closeBtn.addEventListener('click', closeWaPopup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeWaPopup();
  });

  // Close on store click (after small delay so link opens)
  overlay.querySelectorAll('.wa-store').forEach(el => {
    el.addEventListener('click', () => setTimeout(closeWaPopup, 200));
  });

  // Intercept ALL WhatsApp links on the page
  function interceptWaLinks() {
    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com/send"]').forEach(link => {
      // Skip links inside the popup itself
      if (link.closest('#waPopupOverlay')) return;
      // Skip direct links (store cards, contacts — already specific)
      if (link.classList.contains('wa-direct')) return;
      // Skip cart WhatsApp order button (has its own logic)
      if (link.id === 'whatsappOrderBtn') return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        openWaPopup();
      });
    });
  }

  // Run after DOM is ready + after dynamic content loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptWaLinks);
  } else {
    interceptWaLinks();
  }
  // Also expose globally for dynamic buttons
  window.openWaPopup = openWaPopup;

})();
