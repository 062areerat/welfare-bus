// ทำสีกดอยู่ (active) ให้ปุ่ม Start/Stop เฉพาะหน้า Driver
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-tracking');
  const stopBtn  = document.getElementById('stop-tracking');
  const logout   = document.getElementById('logout');
  if (!startBtn || !stopBtn) return;

  function setActive(btn) {
    [startBtn, stopBtn].forEach(b => {
      const active = b === btn;
      b.classList.toggle('is-active', active);           // สีน้ำเงินตามธีม
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  startBtn.addEventListener('click', () => setActive(startBtn));
  stopBtn .addEventListener('click', () => setActive(stopBtn));
  logout  ?.addEventListener('click', () => setActive(null)); // ออกแล้วล้างสถานะ
});
