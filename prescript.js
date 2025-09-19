// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
  const isModule2 = window.location.pathname.startsWith('/2-модуль');
  if (isModule2 && localStorage.getItem('module2Access') !== 'true') {
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = '#fff';
    popup.style.padding = '24px';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    popup.style.zIndex = '9999';
    popup.innerHTML = `
      <h2>Введіть пароль для доступу</h2>
      <input type="password" id="module2-password" style="width:100%;margin-bottom:12px;padding:8px;" placeholder="Пароль" />
      <button id="module2-submit" style="width:100%;padding:8px;">Увійти</button>
      <button id="module2-cancel" style="width:100%;padding:8px;margin-top:8px;">Скасувати</button>
      <div id="module2-error" style="color:red;margin-top:8px;display:none;">Невірний пароль!</div>
    `;
    document.body.appendChild(popup);
    document.body.style.overflow = 'hidden';
    document.getElementById('module2-password').focus();
    document.getElementById('module2-submit').onclick = function() {
      const password = document.getElementById('module2-password').value;
      if (password === '12345') {
        localStorage.setItem('module2Access', 'true');
        document.body.removeChild(popup);
        document.body.style.overflow = '';
      } else {
        document.getElementById('module2-error').style.display = 'block';
      }
    };
    document.getElementById('module2-cancel').onclick = function() {
      document.body.removeChild(popup);
      document.body.style.overflow = '';
      window.location.href = '/';
    };
  }
});