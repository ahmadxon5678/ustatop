// ── Phone formatting ──────────────────────────────────────────
var PREFIX = '+998';

function formatPhoneDisplay(phone) {
  if (!phone) return '';
  var digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return '+998 ' + digits.slice(3,5) + ' ' + digits.slice(5,8) + ' ' + digits.slice(8,10) + ' ' + digits.slice(10,12);
  }
  return phone;
}

function validatePhone(phone) {
  return /^\+998\d{9}$/.test(phone);
}

function applyPhoneFormatting(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('focus', function() {
    if (!this.value || this.value === '') this.value = PREFIX + ' ';
    setTimeout(function(el) { el.setSelectionRange(el.value.length, el.value.length); }, 0, this);
  });
  inputEl.addEventListener('input', function() {
    var raw = this.value.replace(/\D/g, '');
    if (raw.startsWith('998')) raw = raw.slice(3);
    if (raw.length > 9) raw = raw.slice(0, 9);
    if (raw.length === 0) { this.value = PREFIX + ' '; return; }
    var formatted = PREFIX + ' ';
    if (raw.length > 0) formatted += raw.slice(0, 2);
    if (raw.length > 2) formatted += ' ' + raw.slice(2, 5);
    if (raw.length > 5) formatted += ' ' + raw.slice(5, 7);
    if (raw.length > 7) formatted += ' ' + raw.slice(7, 9);
    this.value = formatted;
  });
  inputEl.addEventListener('keydown', function(e) {
    var val = this.value;
    if ((e.key === 'Backspace' || e.key === 'Delete') && val.replace(/\D/g,'').length <= 3) {
      e.preventDefault();
      this.value = PREFIX + ' ';
    }
  });
  inputEl.addEventListener('blur', function() {
    if (this.value === PREFIX + ' ' || this.value === PREFIX) this.value = '';
  });
}

function getPhoneRaw(inputEl) {
  if (!inputEl) return '';
  return inputEl.value.replace(/\s/g, '');
}

function setPhoneValue(inputEl, phone) {
  if (!inputEl || !phone) return;
  inputEl.value = formatPhoneDisplay(phone);
}

// ── UI helpers ────────────────────────────────────────────────
function showError(elementId, message) {
  var el = document.getElementById(elementId);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

function clearError(elementId) {
  var el = document.getElementById(elementId);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

function showSuccess(message, callback) {
  var toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('show');
  }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      if (callback) callback();
    }, 300);
  }, 2500);
}

function showToast(message, type) {
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'success');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 2500);
}

function showLoading(buttonEl) {
  if (!buttonEl) return;
  buttonEl._originalText = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.textContent = (typeof t === 'function') ? t('loading') : 'Yuklanmoqda...';
}

function hideLoading(buttonEl, originalText) {
  if (!buttonEl) return;
  buttonEl.disabled = false;
  buttonEl.textContent = originalText || buttonEl._originalText || '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var locale = localStorage.getItem('lang') === 'ru' ? 'ru-RU' : 'uz-UZ';
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function renderStars(rating) {
  var html = '';
  for (var i = 1; i <= 5; i++) {
    html += '<span class="star' + (i <= Math.round(rating) ? ' filled' : '') + '">★</span>';
  }
  return html;
}

// Auto-apply phone formatting to all inputs with data-phone
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-phone]').forEach(function(el) {
    applyPhoneFormatting(el);
  });
});
