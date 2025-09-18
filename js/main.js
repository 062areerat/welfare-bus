// Dropdown บทบาทบนหน้า Landing
(function(){
  const btn  = document.getElementById('openRoleMenu');
  const menu = document.getElementById('roleMenu');
  if(!btn || !menu) return;

  function openMenu(){
    menu.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    const first = menu.querySelector('.role-item');
    first && first.focus();
  }
  function closeMenu(){
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  }
  function toggleMenu(){
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }

  btn.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(); });

  // ปิดเมื่อคลิกนอกเมนู
  document.addEventListener('click', (e) => {
    if(!menu.classList.contains('open')) return;
    if(!menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
  });

})();

// === ทำให้ Leaflet ปรับขนาดเมื่อจอเปลี่ยน / หมุนจอ ===
(function(){
  const debounce = (fn, wait=150) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };
  const refreshMapSize = () => {
    if (window.studentMap && typeof window.studentMap.invalidateSize === 'function') {
      window.studentMap.invalidateSize();
    }
    if (window.driverMap && typeof window.driverMap.invalidateSize === 'function') {
      window.driverMap.invalidateSize();
    }
  };
  window.addEventListener('resize', debounce(refreshMapSize, 180));
  window.addEventListener('orientationchange', () => setTimeout(refreshMapSize, 300));
})();

