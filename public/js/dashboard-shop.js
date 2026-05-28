var _session = null;
var _notifOpen = false;
var _editProductId = null;

fetch('/api/auth/status').then(function(r) { return r.json(); }).then(function(d) {
  if (!d.loggedIn) { window.location.href = '/'; return; }
  _session = d;
  document.getElementById('welcomeSub').textContent = d.userName || '';
  if (d.shopApproved) {
    document.getElementById('approvedCards').style.display = '';
    document.getElementById('pendingBanner').style.display = 'none';
    document.getElementById('rejectedBanner').style.display = 'none';
  } else if (d.shopRejected) {
    document.getElementById('pendingCards').style.display = '';
    document.getElementById('pendingBanner').style.display = 'none';
    document.getElementById('rejectedBanner').style.display = '';
  } else {
    document.getElementById('pendingCards').style.display = '';
    document.getElementById('pendingBanner').style.display = '';
    document.getElementById('rejectedBanner').style.display = 'none';
  }
  loadNotifBadge();
  loadShopStats();
  setInterval(pollApproval, 30000);
}).catch(function() { window.location.href = '/'; });

function loadShopStats() {
  fetch('/api/job-requests?mine=1').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (!d) return;
    var el = document.getElementById('stat-requests');
    if (el) el.textContent = (d.requests || []).length;
  }).catch(function() {});
  fetch('/api/auth/me').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (!d || !d.user) return;
    var el = document.getElementById('stat-views');
    if (el) el.textContent = d.user.weekly_views || 0;
  }).catch(function() {});
  fetch('/api/products/my').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (!d) return;
    var el = document.getElementById('stat-products');
    if (el) el.textContent = (d.products || []).length;
  }).catch(function() {});
}

function pollApproval() {
  if (_session && _session.shopApproved) return;
  fetch('/api/auth/status').then(function(r) { return r.json(); }).then(function(d) {
    if (d.shopApproved && !(_session && _session.shopApproved)) {
      _session = d;
      showToast(t('approvalNotification'), 'success');
      document.getElementById('pendingBanner').style.display = 'none';
      document.getElementById('pendingCards').style.display = 'none';
      document.getElementById('approvedCards').style.display = '';
    }
  }).catch(function() {});
}

function loadNotifBadge() {
  fetch('/api/notifications').then(function(r) { return r.json(); }).then(function(d) {
    var btn = document.getElementById('notifBtn');
    var bellSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    btn.innerHTML = bellSvg + (d.unread > 0 ? '<span class="notif-badge">' + d.unread + '</span>' : '');
  }).catch(function() {});
}

function toggleNotif() {
  var panel = document.getElementById('notifPanel');
  if (_notifOpen) { panel.style.display = 'none'; _notifOpen = false; return; }
  _notifOpen = true; panel.style.display = 'block';
  fetch('/api/notifications').then(function(r) { return r.json(); }).then(function(d) {
    var lang = localStorage.getItem('lang') || 'uz';
    panel.innerHTML = (d.notifications || []).map(function(n) {
      return '<div style="padding:12px 16px;border-bottom:1px solid #eee;font-size:0.85rem;' + (n.is_read ? '' : 'background:#fffbeb;font-weight:500') + '">' +
        (lang === 'ru' ? (n.message_ru || n.message) : (n.message_uz || n.message)) +
        '<div style="font-size:0.75rem;color:#999;margin-top:3px">' + formatDate(n.created_at) + '</div></div>';
    }).join('') || '<div style="padding:16px;text-align:center;color:#999">' + t('noNotifications') + '</div>';
    fetch('/api/notifications/read-all', { method: 'POST' });
    loadNotifBadge();
  });
}

document.addEventListener('click', function(e) {
  if (_notifOpen && !e.target.closest('#notifPanel') && !e.target.closest('#notifBtn')) {
    document.getElementById('notifPanel').style.display = 'none'; _notifOpen = false;
  }
});

function showSection(name) {
  var area = document.getElementById('contentArea');
  area.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  if (name === 'myProducts') loadMyProducts();
  else if (name === 'shopProfile') loadShopProfile();
  else if (name === 'profile') loadUserProfile();
  else if (name === 'myRequests') loadMyRequests();
  else if (name === 'bookmarks') loadBookmarks();
}

// ── MY REQUESTS (customer feature for pending shops) ──
function loadMyRequests() {
  fetch('/api/job-requests?mine=1').then(function(r) { return r.json(); }).then(function(d) {
    var area = document.getElementById('contentArea');
    var reqs = d.requests || [];
    if (reqs.length === 0) {
      area.innerHTML = '<div class="section-title">' + t('myRequests') + '</div>' +
        '<div class="empty-state"><div class="empty-icon">📋</div><p>' + t('noRequests') + '</p></div>';
      return;
    }
    area.innerHTML = '<div class="section-title">' + t('myRequests') + ' (' + reqs.length + ')</div>' +
      reqs.map(function(jr) {
        var urgentBadge = jr.is_urgent
          ? '<div style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:12px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:8px;animation:urgentPulse 2s infinite">🔴 SHOSHILINCH</div>'
          : '';
        var budgetHtml = (jr.is_urgent && (jr.budget_from || jr.budget_to))
          ? '<div style="font-size:13px;color:#F07020;font-weight:600;margin-bottom:6px">💰 Byudjet: ' + (jr.budget_from ? formatBudget(jr.budget_from) : '?') + ' — ' + (jr.budget_to ? formatBudget(jr.budget_to) : '?') + " so'm</div>"
          : '';
        var borderLeft = jr.is_urgent ? 'border-left:4px solid #e74c3c;' : '';
        return '<div class="job-card" style="' + borderLeft + '">' +
          urgentBadge + budgetHtml +
          '<div class="job-card-header"><div class="job-title">' + escHtml(jr.title) + '</div>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteMyRequest(' + jr.id + ')">🗑</button></div>' +
          '<div class="job-meta">' +
            (jr.profession_needed ? '<span>🔧 ' + escHtml(jr.profession_needed) + '</span>' : '') +
            (jr.region ? '<span>📍 ' + escHtml(jr.region) + '</span>' : '') +
            '<span>📅 ' + formatDate(jr.created_at) + '</span>' +
          '</div>' +
          (jr.description ? '<div class="job-desc">' + escHtml(jr.description) + '</div>' : '') +
        '</div>';
      }).join('');
  });
}

function deleteMyRequest(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/job-requests/' + id, { method: 'DELETE' }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { showToast(t('deleteSuccess'), 'success'); loadMyRequests(); }
  });
}

// ── BOOKMARKS (customer feature for pending shops) ──
function loadBookmarks() {
  fetch('/api/bookmarks').then(function(r) { return r.json(); }).then(function(d) {
    var area = document.getElementById('contentArea');
    var bms = d.bookmarks || [];
    if (bms.length === 0) {
      area.innerHTML = '<div class="section-title">' + t('savedWorkers') + '</div>' +
        '<div class="empty-state"><div class="empty-icon">❤️</div><p>' + t('noBookmarks') + '</p></div>';
      return;
    }
    area.innerHTML = '<div class="section-title">' + t('savedWorkers') + '</div>' +
      '<div class="cards-grid" style="padding:0">' +
      bms.map(function(b) {
        var initials = (b.name||'?').split(' ').map(function(x){return x[0];}).join('').toUpperCase().slice(0,2);
        return '<div class="worker-card"><div class="worker-card-header"><div class="worker-avatar">' + initials + '</div>' +
          '<div class="worker-info"><div class="worker-name">' + escHtml(b.name) + '</div>' +
          '<div class="worker-profession">' + escHtml(b.profession) + '</div></div></div>' +
          '<div class="worker-card-actions"><button class="btn btn-primary btn-sm" style="flex:1" onclick="window.location.href=\'/workers/' + b.worker_id + '\'">' + t('view') + '</button></div></div>';
      }).join('') + '</div>';
  });
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── MY PRODUCTS ──
function loadMyProducts() {
  fetch('/api/products/my').then(function(r) { return r.json(); }).then(function(d) {
    var area = document.getElementById('contentArea');
    var prods = d.products || [];
    if (prods.length === 0) {
      area.innerHTML = '<div class="section-title">' + t('myProducts') + '</div><div class="empty-state"><div class="empty-icon">📦</div><p>' + t('noProducts') + '</p></div>';
      return;
    }
    area.innerHTML = '<div class="section-title">' + t('myProducts') + ' (' + prods.length + ')</div>' +
      prods.map(function(p) {
        var price = parseFloat(p.price);
        var priceStr = !isNaN(price) ? price.toLocaleString('uz-UZ') + " so'm" : escHtml(p.price);
        var imgs = p.images || [];
        return '<div class="card" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
          (imgs.length
            ? '<img src="' + escHtml(imgs[0].image_url) + '" alt="' + escHtml(p.product_name) + '" style="width:68px;height:68px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid #eee">'
            : '') +
          '<div style="flex:1">' +
            '<div style="font-weight:700;margin-bottom:4px">' + escHtml(p.product_name) + '</div>' +
            '<div style="color:#F07020;font-weight:700;font-size:1rem">' + priceStr + '</div>' +
            (p.product_type ? '<span class="product-type-badge">' + escHtml(p.product_type) + '</span>' : '') +
            (p.description ? '<div style="font-size:0.82rem;color:#777;margin-top:4px">' + escHtml(p.description) + '</div>' : '') +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-shrink:0">' +
            '<button class="btn btn-sm btn-secondary" onclick="editProduct(' + JSON.stringify(p).replace(/"/g,'&quot;') + ')">✏️</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteProduct(' + p.id + ')">🗑</button>' +
          '</div>' +
        '</div>';
      }).join('');
  });
}

function deleteProduct(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/products/' + id, { method: 'DELETE' }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { showToast(t('deleteSuccess'), 'success'); loadMyProducts(); }
  });
}

// ── ADD/EDIT PRODUCT ──
function openAddProduct() {
  _editProductId = null;
  document.getElementById('productModalTitle').textContent = t('addProduct');
  document.getElementById('editProductId').value = '';
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pType').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('pImages').value = '';
  document.getElementById('productImagePreview').innerHTML = '';
  document.getElementById('productError').textContent = '';
  document.getElementById('productModal').classList.add('open');
}

function editProduct(p) {
  _editProductId = p.id;
  document.getElementById('productModalTitle').textContent = t('edit');
  document.getElementById('editProductId').value = p.id;
  document.getElementById('pName').value = p.product_name || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pType').value = p.product_type || '';
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pImages').value = '';
  renderExistingProductImages(p.images || []);
  document.getElementById('productError').textContent = '';
  document.getElementById('productModal').classList.add('open');
}

function renderExistingProductImages(images) {
  var preview = document.getElementById('productImagePreview');
  preview.innerHTML = (images || []).map(function(img) {
    return '<img src="' + escHtml(img.image_url) + '" alt="' + t('productImages') + '">';
  }).join('');
}

function previewProductImages() {
  var input = document.getElementById('pImages');
  var errEl = document.getElementById('productError');
  var preview = document.getElementById('productImagePreview');
  var files = Array.prototype.slice.call(input.files || []);
  errEl.textContent = '';
  if (files.length > 3) {
    input.value = '';
    preview.innerHTML = '';
    errEl.textContent = t('tooManyProductImages');
    return;
  }
  preview.innerHTML = files.map(function(file) {
    return '<img src="' + URL.createObjectURL(file) + '" alt="' + escHtml(file.name) + '">';
  }).join('');
}

function saveProduct() {
  var name = document.getElementById('pName').value.trim();
  var price = document.getElementById('pPrice').value.trim();
  var errEl = document.getElementById('productError');
  if (!name || !price) { errEl.textContent = t('nameAndPriceRequired'); return; }
  var files = Array.prototype.slice.call(document.getElementById('pImages').files || []);
  if (files.length > 3) { errEl.textContent = t('tooManyProductImages'); return; }
  var data = new FormData();
  data.append('product_name', name);
  data.append('price', price);
  data.append('product_type', document.getElementById('pType').value);
  data.append('description', document.getElementById('pDesc').value.trim());
  files.forEach(function(file) { data.append('images', file); });
  var url = _editProductId ? '/api/products/' + _editProductId : '/api/products';
  var method = _editProductId ? 'PUT' : 'POST';
  fetch(url, { method: method, body: data })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        closeModal('productModal');
        showToast(_editProductId ? t('productUpdated') : t('productAdded'), 'success');
        showSection('myProducts');
      } else { errEl.textContent = t(d.error) || d.error; }
    }).catch(function() { errEl.textContent = t('networkError'); });
}

// ── SHOP PROFILE ──
function loadShopProfile() {
  fetch('/api/products/shop/info').then(function(r) { return r.json(); }).then(function(d) {
    var s = d.shop;
    var area = document.getElementById('contentArea');
    area.innerHTML = '<div class="section-title">' + t('myShop') + '</div>' +
      '<div class="card">' +
        '<div class="form-group"><label class="form-label">' + t('shopName') + ' *</label><input class="form-input" type="text" id="sShopName" value="' + escHtml(s.shop_name||'') + '"></div>' +
        '<div class="form-group"><label class="form-label">' + t('ownerName') + '</label><input class="form-input" type="text" id="sOwnerName" value="' + escHtml(s.owner_name||'') + '"></div>' +
        '<div class="form-group"><label class="form-label">' + t('phone') + '</label><input class="form-input" type="tel" id="sPhone" data-phone placeholder="+998 90 000 00 00"></div>' +
        '<div class="form-grid-2">' +
          '<div class="form-group"><label class="form-label">' + t('region') + '</label>' +
            '<select class="form-select" id="sRegion">' +
              ['Toshkent','Andijon',"Farg'ona",'Namangan','Samarqand','Buxoro','Xorazm','Qashqadaryo','Surxondaryo','Jizzax','Sirdaryo','Navoiy',"Qoraqalpog'iston"].map(function(r) {
                return '<option' + (r===s.region?' selected':'') + '>' + r + '</option>';
              }).join('') + '</select></div>' +
          '<div class="form-group"><label class="form-label">' + t('city') + '</label><input class="form-input" type="text" id="sCity" value="' + escHtml(s.city||'') + '"></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Telegram</label><input class="form-input" type="text" id="sTelegram" value="' + escHtml(s.telegram||'') + '"></div>' +
        '<div class="form-group"><label class="form-label">Instagram</label><input class="form-input" type="text" id="sInstagram" placeholder="@instagram_username" value="' + escHtml(s.instagram||'') + '"></div>' +
        '<div class="form-group"><label class="form-label">' + t('description') + '</label><textarea class="form-input" id="sDesc" rows="3">' + escHtml(s.description||'') + '</textarea></div>' +
        '<div class="auth-error" id="shopProfileError"></div>' +
        '<button class="btn btn-primary" onclick="saveShopProfile()">' + t('save') + '</button>' +
      '</div>';
    if (s.phone) setPhoneValue(document.getElementById('sPhone'), s.phone);
  });
}

function saveShopProfile() {
  fetch('/api/products/shop/info', { method: 'PUT', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      shop_name: document.getElementById('sShopName').value.trim(),
      owner_name: document.getElementById('sOwnerName').value.trim(),
      phone: getPhoneRaw(document.getElementById('sPhone')),
      region: document.getElementById('sRegion').value,
      city: document.getElementById('sCity').value.trim(),
      telegram: document.getElementById('sTelegram').value.trim(),
      instagram: document.getElementById('sInstagram').value.trim(),
      description: document.getElementById('sDesc').value.trim()
    })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) showToast(t('profileUpdated'), 'success');
    else document.getElementById('shopProfileError').textContent = t('errorGeneric');
  });
}

// ── USER PROFILE ──
function loadUserProfile() {
  fetch('/api/users/profile').then(function(r) { return r.json(); }).then(function(d) {
    var u = d.user;
    var area = document.getElementById('contentArea');
    area.innerHTML = '<div class="section-title">' + t('myProfile') + '</div>' +
      '<div class="card">' +
        '<div class="form-group"><label class="form-label">' + t('fullName') + '</label><input class="form-input" type="text" id="uName" value="' + escHtml(u.name||'') + '"></div>' +
        '<div class="form-group"><label class="form-label">' + t('phone') + '</label><input class="form-input" value="' + formatPhoneDisplay(u.phone) + '" readonly style="background:#f8f9fa;color:#999"></div>' +
        '<div class="form-grid-2">' +
          '<div class="form-group"><label class="form-label">' + t('region') + '</label>' +
            '<select class="form-select" id="uRegion">' +
              ['Toshkent','Andijon',"Farg'ona",'Namangan','Samarqand','Buxoro','Xorazm','Qashqadaryo','Surxondaryo','Jizzax','Sirdaryo','Navoiy',"Qoraqalpog'iston"].map(function(r) {
                return '<option' + (r===u.region?' selected':'') + '>' + r + '</option>';
              }).join('') + '</select></div>' +
          '<div class="form-group"><label class="form-label">' + t('city') + '</label><input class="form-input" type="text" id="uCity" value="' + escHtml(u.city||'') + '"></div>' +
        '</div>' +
        '<div class="auth-error" id="uProfileError"></div>' +
        '<button class="btn btn-primary" onclick="saveUserProfile()">' + t('save') + '</button>' +
      '</div>';
  });
}

function saveUserProfile() {
  fetch('/api/users/profile', { method: 'PUT', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name: document.getElementById('uName').value.trim(),
      region: document.getElementById('uRegion').value,
      city: document.getElementById('uCity').value.trim()
    })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) showToast(t('profileUpdated'), 'success');
    else document.getElementById('uProfileError').textContent = t('errorGeneric');
  });
}

// ── JOB REQUEST MODAL ──
function openJobModal() {
  document.getElementById('jrTitle').value = '';
  document.getElementById('jrDesc').value = '';
  document.getElementById('jrError').textContent = '';
  var urgentCb = document.getElementById('jrUrgent');
  if (urgentCb) { urgentCb.checked = false; document.getElementById('jrBudgetSection').style.display = 'none'; }
  document.getElementById('jobModal').classList.add('open');
}

document.addEventListener('DOMContentLoaded', function() {
  var urgentCb = document.getElementById('jrUrgent');
  if (urgentCb) urgentCb.addEventListener('change', function() {
    document.getElementById('jrBudgetSection').style.display = this.checked ? 'block' : 'none';
  });
});

function formatBudget(num) { return Number(num).toLocaleString('uz-UZ'); }

function submitJobRequest() {
  var title = document.getElementById('jrTitle').value.trim();
  var phoneEl = document.getElementById('jrPhone');
  var phone = getPhoneRaw(phoneEl);
  var errEl = document.getElementById('jrError');
  errEl.textContent = '';
  if (!title) { errEl.textContent = t('titleRequired'); return; }
  fetch('/api/job-requests', { method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      title: title,
      description: document.getElementById('jrDesc').value.trim(),
      profession_needed: document.getElementById('jrProfession').value,
      region: document.getElementById('jrRegion').value,
      phone: phone,
      is_urgent: document.getElementById('jrUrgent').checked ? 1 : 0,
      budget_from: document.getElementById('jrBudgetFrom').value || null,
      budget_to: document.getElementById('jrBudgetTo').value || null
    })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { closeModal('jobModal'); showToast(t('requestPosted'), 'success'); }
    else { errEl.textContent = t(d.error) || d.error; }
  }).catch(function() { errEl.textContent = t('networkError'); });
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function doLogout() {
  fetch('/api/auth/logout', { method: 'POST' }).then(function() { window.location.href = '/'; });
}
