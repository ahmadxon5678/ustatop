// Add missing lang keys
if (typeof LANG !== 'undefined') {
  LANG.uz.customerDesc = "Usta yollash, xizmatlarga buyurtma berish va materiallar ko'rish";
  LANG.uz.workerDesc = "O'z xizmatlaringizni taklif qiling va yangi mijozlar toping";
  LANG.uz.shopDesc2 = "Qurilish materiallari do'koningizni platformaga qo'shing";
  LANG.ru.customerDesc = "Нанять мастера, заказать услуги и просматривать материалы";
  LANG.ru.workerDesc = "Предлагайте свои услуги и находите новых клиентов";
  LANG.ru.shopDesc2 = "Добавьте свой магазин стройматериалов на платформу";
}

var _userType = 'customer';
var _dashUrl = '/dashboard/customer';

// Check if already logged in
fetch('/api/auth/status')
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.loggedIn) { window.location.href = getDashUrl(d.userType); }
  })
  .catch(function() {});

function getDashUrl(type) {
  if (type === 'worker') return '/dashboard/worker';
  if (type === 'shop')   return '/dashboard/shop';
  if (type === 'admin')  return '/admin-qurilishuz-secure-2024';
  return '/dashboard/customer';
}

function openCard(type) {
  _userType = type;
  document.getElementById('loginError').textContent = '';
  document.getElementById('regError').textContent = '';
  document.getElementById('successScreen').style.display = 'none';
  document.getElementById('authTabs').style.display = '';

  if (type === 'worker' || type === 'shop') {
    switchTab('register');
  } else {
    switchTab('login');
  }
  updateRegBadge();
  document.getElementById('authOverlay').classList.add('open');
}

function closeAuth() {
  document.getElementById('authOverlay').classList.remove('open');
  document.getElementById('successScreen').style.display = 'none';
  document.getElementById('authTabs').style.display = '';
}

function overlayClick(e) {
  if (e.target === document.getElementById('authOverlay')) closeAuth();
}

function switchTab(tab) {
  var isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('formLogin').style.display = isLogin ? '' : 'none';
  document.getElementById('formRegister').style.display = isLogin ? 'none' : '';
  if (!isLogin) updateRegBadge();
}

function updateRegBadge() {
  var badge = document.getElementById('regTypeBadge');
  var btn = document.getElementById('regBtn');
  var wf = document.getElementById('workerFields');
  var sf = document.getElementById('shopFields');
  var csf = document.getElementById('customerSocialFields');
  wf.style.display = _userType === 'worker' ? '' : 'none';
  sf.style.display = _userType === 'shop' ? '' : 'none';
  if (csf) csf.style.display = _userType === 'customer' ? '' : 'none';
  if (_userType === 'worker') {
    badge.textContent = '🔨 ' + t('workerRegTitle');
    badge.className = 'type-badge type-badge-worker';
    btn.textContent = t('sendRequest');
  } else if (_userType === 'shop') {
    badge.textContent = '🏪 ' + t('shopRegTitle');
    badge.className = 'type-badge type-badge-shop';
    btn.textContent = t('sendRequest');
  } else {
    badge.textContent = '👤 ' + t('customerRegTitle');
    badge.className = 'type-badge type-badge-customer';
    btn.textContent = t('register');
  }
}

function showSuccessScreen(userType, isRegister) {
  _dashUrl = getDashUrl(userType);
  document.getElementById('formLogin').style.display = 'none';
  document.getElementById('formRegister').style.display = 'none';
  document.getElementById('authTabs').style.display = 'none';
  var sc = document.getElementById('successScreen');
  sc.style.display = '';
  var title = document.getElementById('successTitle');
  var msg = document.getElementById('successMsg');
  if (isRegister) {
    title.textContent = t('successRegistered');
    if (userType === 'worker') {
      msg.textContent = t('pendingBannerWorker');
    } else if (userType === 'shop') {
      msg.textContent = t('pendingBannerShop');
    } else {
      msg.textContent = t('accountCreated');
    }
  } else {
    title.textContent = t('successLogin');
    msg.textContent = '';
  }
}

function proceedToDashboard() {
  window.location.href = _dashUrl;
}

function submitLogin() {
  var phoneEl = document.getElementById('loginPhone');
  var phone = getPhoneRaw(phoneEl);
  var password = document.getElementById('loginPassword').value;
  var errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!phone || phone === '+998') { errEl.textContent = t('phoneError'); return; }
  if (!validatePhone(phone)) { errEl.textContent = t('phoneError'); return; }
  if (!password) { errEl.textContent = t('passwordRequired'); return; }
  var btn = document.getElementById('loginBtn');
  showLoading(btn);
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone, password: password })
  }).then(function(r) { return r.json(); }).then(function(d) {
    hideLoading(btn, t('login'));
    if (d.success) {
      showSuccessScreen(d.userType, false);
    } else {
      errEl.textContent = t(d.error) || d.error;
    }
  }).catch(function() {
    hideLoading(btn, t('login'));
    errEl.textContent = t('networkError');
  });
}

function submitRegister() {
  var errEl = document.getElementById('regError');
  errEl.textContent = '';
  var name = document.getElementById('regName').value.trim();
  var phoneEl = document.getElementById('regPhone');
  var phone = getPhoneRaw(phoneEl);
  var region = document.getElementById('regRegion').value;
  var city = document.getElementById('regCity').value.trim();
  var info = document.getElementById('regInfo').value.trim();
  var password = document.getElementById('regPassword').value;
  var passwordConfirm = document.getElementById('regPasswordConfirm').value;

  if (!name || !region || !city) { errEl.textContent = t('requiredFields'); return; }
  if (!phone || phone === '+998') { errEl.textContent = t('phoneError'); return; }
  if (!validatePhone(phone)) { errEl.textContent = t('phoneError'); return; }
  if (!password || !/^[a-zA-Z0-9]{6,}$/.test(password)) { errEl.textContent = t('passwordInvalid'); return; }
  if (password !== passwordConfirm) { errEl.textContent = t('passwordMismatch'); return; }

  var body = { name: name, phone: phone, region: region, city: city, additional_info: info, user_type: _userType, password: password };

  if (_userType === 'customer') {
    body.instagram_username = document.getElementById('regCustomerInstagram').value.trim() || null;
    body.telegram_username = document.getElementById('regCustomerTelegram').value.trim() || null;
  }

  if (_userType === 'worker') {
    var prof = document.getElementById('regProfession').value;
    var exp = document.getElementById('regExperience').value;
    var desc = document.getElementById('regDescription').value.trim();
    if (!prof) { errEl.textContent = t('professionRequired'); return; }
    if (!exp) { errEl.textContent = t('experienceRequired'); return; }
    if (!desc) { errEl.textContent = t('descriptionRequired'); return; }
    body.profession = prof; body.experience = exp; body.description = desc;
    body.telegram = document.getElementById('regTelegram').value.trim();
    body.instagram = document.getElementById('regInstagram').value.trim();
  }

  if (_userType === 'shop') {
    var shopName = document.getElementById('regShopName').value.trim();
    var ownerName = document.getElementById('regOwnerName').value.trim();
    if (!shopName) { errEl.textContent = t('shopNameRequired'); return; }
    if (!ownerName) { errEl.textContent = t('ownerNameRequired'); return; }
    body.shop_name = shopName;
    body.owner_name = ownerName;
    body.product_types = Array.from(document.querySelectorAll('#productTypesGrid input:checked')).map(function(c) { return c.value; });
    body.description = document.getElementById('regShopDesc').value.trim();
    body.telegram = document.getElementById('regShopTelegram').value.trim();
    body.instagram = document.getElementById('regShopInstagram').value.trim();
  }

  var btn = document.getElementById('regBtn');
  showLoading(btn);
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function(r) { return r.json(); }).then(function(d) {
    hideLoading(btn, _userType === 'customer' ? t('register') : t('sendRequest'));
    if (d.success) {
      showSuccessScreen(d.userType, true);
    } else {
      errEl.textContent = t(d.error) || d.error;
    }
  }).catch(function() {
    hideLoading(btn, _userType === 'customer' ? t('register') : t('sendRequest'));
    errEl.textContent = t('networkError');
  });
}

// Admin trigger (5 logo clicks within 3s)
var _clickCount = 0, _clickTimer = null;
document.getElementById('logo-trigger').addEventListener('click', function() {
  _clickCount++;
  if (_clickTimer) clearTimeout(_clickTimer);
  _clickTimer = setTimeout(function() { _clickCount = 0; }, 3000);
  if (_clickCount >= 5) {
    _clickCount = 0;
    clearTimeout(_clickTimer);
    document.getElementById('adminPwd').value = '';
    document.getElementById('adminError').textContent = '';
    document.getElementById('adminOverlay').classList.add('open');
    setTimeout(function() { document.getElementById('adminPwd').focus(); }, 100);
  }
});

function closeAdmin() {
  document.getElementById('adminOverlay').classList.remove('open');
}
function adminOverlayClick(e) {
  if (e.target === document.getElementById('adminOverlay')) closeAdmin();
}

function submitAdmin() {
  var pwd = document.getElementById('adminPwd').value;
  var errEl = document.getElementById('adminError');
  errEl.textContent = '';
  if (!pwd) { errEl.textContent = t('adminPasswordRequired'); return; }
  fetch('/api/auth/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { window.location.href = '/admin-qurilishuz-secure-2024'; }
    else { errEl.textContent = t(d.error) || d.error; }
  }).catch(function() { errEl.textContent = t('networkError'); });
}

// Checkbox highlight
document.addEventListener('change', function(e) {
  if (e.target.type === 'checkbox' && e.target.closest('.checkbox-item')) {
    e.target.closest('.checkbox-item').classList.toggle('checked', e.target.checked);
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeAuth(); closeAdmin(); }
  if (e.key === 'Enter') {
    if (document.getElementById('adminOverlay').classList.contains('open')) { submitAdmin(); return; }
    if (document.getElementById('authOverlay').classList.contains('open')) {
      if (document.getElementById('formLogin').style.display !== 'none') submitLogin();
      else if (document.getElementById('formRegister').style.display !== 'none') submitRegister();
    }
  }
});
