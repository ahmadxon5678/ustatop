var _session = null;
var _selectedStars = 0;
var _rateWorkerId = null;
var _rateResponseId = null;
var _currentSection = null;
var _notifOpen = false;

fetch('/api/auth/status').then(function(r) { return r.json(); }).then(function(d) {
  if (!d.loggedIn) { window.location.href = '/'; return; }
  _session = d;
  document.getElementById('welcomeSub').textContent = d.userName || '';
  loadNotifBadge();
  loadDashboardStats();
}).catch(function() { window.location.href = '/'; });

function loadDashboardStats() {
  fetch('/api/job-requests?mine=1').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (!d) return;
    var reqs = d.requests || [];
    var active = reqs.filter(function(r) { return r.status === 'active'; }).length;
    var el = document.getElementById('stat-requests');
    if (el) el.textContent = active;
  }).catch(function() {});
  fetch('/api/bookmarks').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (!d) return;
    var el = document.getElementById('stat-bookmarks');
    if (el) el.textContent = (d.bookmarks || []).length;
  }).catch(function() {});
  fetch('/api/notifications').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (!d) return;
    var unread = (d.notifications || []).filter(function(n) { return !n.is_read; }).length;
    var el = document.getElementById('stat-notifications');
    if (el) el.textContent = unread;
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
  _notifOpen = true;
  panel.style.display = 'block';
  panel.innerHTML = '<div style="padding:12px;color:#999;font-size:0.85rem">' + t('loading') + '</div>';
  fetch('/api/notifications').then(function(r) { return r.json(); }).then(function(d) {
    var lang = localStorage.getItem('lang') || 'uz';
    var items = (d.notifications || []).map(function(n) {
      return '<div style="padding:12px 16px;border-bottom:1px solid #eee;font-size:0.85rem;' + (n.is_read ? '' : 'background:#fffbeb;font-weight:500') + '">' +
        (lang === 'ru' ? (n.message_ru || n.message) : (n.message_uz || n.message)) +
        '<div style="font-size:0.75rem;color:#999;margin-top:3px">' + formatDate(n.created_at) + '</div></div>';
    }).join('') || '<div style="padding:16px;text-align:center;color:#999">' + t('noNotifications') + '</div>';
    panel.innerHTML = items;
    fetch('/api/notifications/read-all', { method: 'POST' });
    loadNotifBadge();
  });
}

document.addEventListener('click', function(e) {
  if (_notifOpen && !e.target.closest('#notifPanel') && !e.target.closest('#notifBtn')) {
    document.getElementById('notifPanel').style.display = 'none';
    _notifOpen = false;
  }
});

function showSection(name) {
  _currentSection = name;
  var area = document.getElementById('contentArea');
  area.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  if (name === 'myRequests') loadMyRequests();
  else if (name === 'bookmarks') loadBookmarks();
  else if (name === 'profile') loadProfile();
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatBudget(num) {
  return Number(num).toLocaleString('uz-UZ');
}

// ── MY REQUESTS ──
function getRequestStatusBadge(jr) {
  if (jr.status === 'completed') {
    return '<span class="req-status completed">✅ Bajarildi</span>';
  }
  if (jr.status === 'expired') {
    return '<span class="req-status expired">⏰ Muddati tugagan</span>';
  }
  if (jr.response_count > 0) {
    return '<span class="req-status responded">🟢 ' + jr.response_count + ' ta javob keldi</span>';
  }
  return '<span class="req-status waiting">🟡 Kutilmoqda</span>';
}

function loadMyRequests() {
  fetch('/api/job-requests?mine=1').then(function(r) { return r.json(); }).then(function(d) {
    var area = document.getElementById('contentArea');
    var reqs = d.requests || [];
    if (reqs.length === 0) {
      area.innerHTML = '<div class="section-title">' + t('myRequests') + '</div><div class="empty-state"><div class="empty-icon">📄</div><p>' + t('noRequests') + '</p></div>';
      return;
    }
    area.innerHTML = '<div class="section-title">' + t('myRequests') + '</div>' +
      reqs.map(function(jr) {
        var isCompleted = jr.status === 'completed';
        var responsesHtml = '';
        if (jr.responses && jr.responses.length > 0 && !isCompleted) {
          responsesHtml = '<div class="job-responses"><div style="font-size:0.8rem;font-weight:700;color:#666;margin-bottom:8px">' + t('jobResponsesLabel') + ' (' + jr.responses.length + '):</div>' +
            jr.responses.map(function(r) {
              var rateBtn = !r.hasRated
                ? '<button class="btn btn-sm btn-outline" style="margin-top:6px" onclick="openRateModal(' + r.worker_id + ',' + r.id + ')">★ ' + t('rate') + '</button>'
                : '<span style="font-size:0.75rem;color:#27ae60">' + t('rated') + '</span>';
              var priceHtml = '';
              if (r.price_from || r.price_to) {
                var priceParts = [];
                if (r.price_from) priceParts.push('dan ' + Number(r.price_from).toLocaleString('uz-UZ') + " so'm");
                if (r.price_to) priceParts.push('gacha ' + Number(r.price_to).toLocaleString('uz-UZ') + " so'm");
                priceHtml = '<div style="font-size:0.82rem;color:#F07020;font-weight:600;margin:2px 0">💰 ' + priceParts.join(' — ') + '</div>';
              }
              return '<div class="job-response-item">' +
                '<div style="font-weight:600;font-size:0.9rem">' + escHtml(r.worker_name) + ' · ' + escHtml(r.profession) + '</div>' +
                '<div style="font-size:0.85rem;color:#555;margin:4px 0">' + escHtml(r.message) + '</div>' +
                priceHtml +
                '<div style="font-size:0.8rem;color:#999">' + formatDate(r.created_at) + '</div>' +
                rateBtn +
              '</div>';
            }).join('') + '</div>';
        }
        var statusBadge = getRequestStatusBadge(jr);
        var completeBtn = (!isCompleted && jr.status === 'active')
          ? '<button class="btn btn-sm btn-success" style="margin-left:8px" onclick="markCompleted(' + jr.id + ')">✅ Bajarildi</button>'
          : '';
        var deleteBtn = !isCompleted
          ? '<button class="btn btn-sm btn-danger" onclick="deleteRequest(' + jr.id + ')">🗑</button>'
          : '';
        var urgentBadge = jr.is_urgent
          ? '<div style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:12px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:8px;animation:urgentPulse 2s infinite">🔴 SHOSHILINCH</div>'
          : '';
        var budgetHtml = (jr.is_urgent && (jr.budget_from || jr.budget_to))
          ? '<div style="font-size:13px;color:#F07020;font-weight:600;margin-bottom:6px">💰 Byudjet: ' + (jr.budget_from ? formatBudget(jr.budget_from) : '?') + ' — ' + (jr.budget_to ? formatBudget(jr.budget_to) : '?') + " so'm</div>"
          : '';
        var cardBorderLeft = jr.is_urgent ? 'border-left:4px solid #e74c3c;' : '';
        return '<div class="job-card" style="' + cardBorderLeft + '">' +
          urgentBadge + budgetHtml +
          '<div class="job-card-header">' +
            '<div>' +
              '<div class="job-title">' + escHtml(jr.title) + '</div>' +
              '<div style="margin-top:6px">' + statusBadge + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;align-items:center">' + completeBtn + deleteBtn + '</div>' +
          '</div>' +
          '<div class="job-meta">' +
            (jr.profession_needed ? '<span>🔧 ' + escHtml(jr.profession_needed) + '</span>' : '') +
            (jr.region ? '<span>📍 ' + escHtml(jr.region) + '</span>' : '') +
            (jr.expires_at ? '<span>📅 ' + formatDate(jr.expires_at) + ' ' + t('untilDate') + '</span>' : '') +
          '</div>' +
          (jr.description ? '<div class="job-desc">' + escHtml(jr.description) + '</div>' : '') +
          responsesHtml +
        '</div>';
      }).join('');
  }).catch(function() {
    document.getElementById('contentArea').innerHTML = '<p>' + t('errorGeneric') + '</p>';
  });
}

function markCompleted(id) {
  if (!confirm('Bu buyurtmani bajarildi deb belgilaysizmi?')) return;
  fetch('/api/job-requests/' + id + '/complete', { method: 'PUT' }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { showToast('Buyurtma bajarildi deb belgilandi ✅', 'success'); loadMyRequests(); }
    else showToast(t('errorGeneric'), 'error');
  }).catch(function() { showToast(t('networkError'), 'error'); });
}

function deleteRequest(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/job-requests/' + id, { method: 'DELETE' }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { showToast(t('deleteSuccess'), 'success'); loadMyRequests(); }
  });
}

// ── BOOKMARKS ──
function loadBookmarks() {
  fetch('/api/bookmarks').then(function(r) { return r.json(); }).then(function(d) {
    var area = document.getElementById('contentArea');
    var bms = d.bookmarks || [];
    if (bms.length === 0) {
      area.innerHTML = '<div class="section-title">' + t('savedWorkers') + '</div><div class="empty-state"><div class="empty-icon">❤️</div><p>' + t('noBookmarks') + '</p></div>';
      return;
    }
    area.innerHTML = '<div class="section-title">' + t('savedWorkers') + '</div>' +
      '<div class="cards-grid" style="padding:0">' +
      bms.map(function(b) {
        var initials = (b.name||'?').split(' ').map(function(x){return x[0];}).join('').toUpperCase().slice(0,2);
        var avail = b.availability_status === 'available'
          ? '<span class="badge badge-available">🟢 ' + t('available') + '</span>'
          : '<span class="badge badge-busy">🔴 ' + t('busy') + '</span>';
        return '<div class="worker-card">' +
          '<div class="worker-card-header">' +
            '<div class="worker-avatar">' + initials + '</div>' +
            '<div class="worker-info">' +
              '<div class="worker-name">' + escHtml(b.name) + '</div>' +
              '<div class="worker-profession">' + escHtml(b.profession) + '</div>' +
              '<div class="worker-location">📍 ' + escHtml(b.region||'') + (b.city ? ', '+escHtml(b.city) : '') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="worker-stats">' + avail + '</div>' +
          '<div class="worker-card-actions">' +
            '<button class="btn btn-primary" style="flex:1;font-size:0.85rem" onclick="window.location.href=\'/workers/' + b.worker_id + '\'">' + t('view') + '</button>' +
            '<button class="bookmark-btn active" onclick="removeBookmark(' + b.worker_id + ')">❤️</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
  });
}

function removeBookmark(workerId) {
  fetch('/api/bookmarks/toggle', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ worker_id: workerId }) })
    .then(function() { loadBookmarks(); });
}

// ── PROFILE ──
function loadProfile() {
  fetch('/api/users/profile').then(function(r) { return r.json(); }).then(function(d) {
    var u = d.user;
    var area = document.getElementById('contentArea');
    area.innerHTML = '<div class="section-title" data-lang="myProfile">' + t('myProfile') + '</div>' +
      '<div class="card">' +
        '<div class="form-group"><label class="form-label" data-lang="fullName">To\'liq ism</label>' +
          '<input class="form-input" type="text" id="pName" value="' + escHtml(u.name) + '"></div>' +
        '<div class="form-group"><label class="form-label" data-lang="phone">Telefon</label>' +
          '<input class="form-input" type="text" value="' + formatPhoneDisplay(u.phone) + '" readonly style="background:#f8f9fa;color:#999"></div>' +
        '<div class="form-grid-2">' +
          '<div class="form-group"><label class="form-label" data-lang="region">Viloyat</label>' +
            '<select class="form-select" id="pRegion">' +
              ['Toshkent','Andijon',"Farg'ona",'Namangan','Samarqand','Buxoro','Xorazm','Qashqadaryo','Surxondaryo','Jizzax','Sirdaryo','Navoiy',"Qoraqalpog'iston"].map(function(r) {
                return '<option' + (r===u.region?' selected':'') + '>' + r + '</option>';
              }).join('') +
            '</select></div>' +
          '<div class="form-group"><label class="form-label" data-lang="city">Shahar</label>' +
            '<input class="form-input" type="text" id="pCity" value="' + escHtml(u.city||'') + '"></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label" data-lang="additionalInfo">Qo\'shimcha</label>' +
          '<input class="form-input" type="text" id="pInfo" value="' + escHtml(u.additional_info||'') + '"></div>' +
        '<div class="form-grid-2">' +
          '<div class="form-group"><label class="form-label">Instagram (ixtiyoriy)</label>' +
            '<input class="form-input" type="text" id="pInstagram" value="' + escHtml(u.instagram_username||'') + '" placeholder="@username"></div>' +
          '<div class="form-group"><label class="form-label">Telegram (ixtiyoriy)</label>' +
            '<input class="form-input" type="text" id="pTelegram" value="' + escHtml(u.telegram_username||'') + '" placeholder="@username"></div>' +
        '</div>' +
        '<div class="auth-error" id="profileError"></div>' +
        '<button class="btn btn-primary" onclick="saveProfile()">' + t('save') + '</button>' +
      '</div>';
  });
}

function saveProfile() {
  var name = document.getElementById('pName').value.trim();
  var region = document.getElementById('pRegion').value;
  var city = document.getElementById('pCity').value.trim();
  var info = document.getElementById('pInfo').value.trim();
  if (!name || !region || !city) { document.getElementById('profileError').textContent = t('requiredFields'); return; }
  var instagram = document.getElementById('pInstagram') ? document.getElementById('pInstagram').value.trim() : null;
  var telegram = document.getElementById('pTelegram') ? document.getElementById('pTelegram').value.trim() : null;
  fetch('/api/users/profile', { method: 'PUT', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name: name, region: region, city: city, additional_info: info,
      instagram_username: instagram || null, telegram_username: telegram || null })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) showToast(t('profileUpdated'), 'success');
    else document.getElementById('profileError').textContent = t('errorGeneric');
  });
}

// ── JOB REQUEST MODAL ──
function openJobModal() {
  document.getElementById('jrTitle').value = '';
  document.getElementById('jrDesc').value = '';
  document.getElementById('jrCity').value = '';
  document.getElementById('jrError').textContent = '';
  document.getElementById('jrUrgent').checked = false;
  document.getElementById('jrBudgetSection').style.display = 'none';
  document.getElementById('jrBudgetFrom').value = '';
  document.getElementById('jrBudgetTo').value = '';
  document.getElementById('jobModal').classList.add('open');
}

document.addEventListener('DOMContentLoaded', function() {
  var urgentCb = document.getElementById('jrUrgent');
  if (urgentCb) urgentCb.addEventListener('change', function() {
    document.getElementById('jrBudgetSection').style.display = this.checked ? 'block' : 'none';
  });
});

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
      city: document.getElementById('jrCity').value.trim(),
      phone: phone,
      is_urgent: document.getElementById('jrUrgent').checked ? 1 : 0,
      budget_from: document.getElementById('jrBudgetFrom').value || null,
      budget_to: document.getElementById('jrBudgetTo').value || null
    })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      closeModal('jobModal');
      showToast(t('requestPosted'), 'success');
    } else { errEl.textContent = t(d.error) || d.error; }
  }).catch(function() { errEl.textContent = t('networkError'); });
}

// ── RATING MODAL ──
function openRateModal(workerId, responseId) {
  _rateWorkerId = workerId;
  _rateResponseId = responseId;
  _selectedStars = 0;
  document.getElementById('rateReview').value = '';
  document.getElementById('rateError').textContent = '';
  updateStarUI();
  document.getElementById('rateModal').classList.add('open');
}

function setStar(v) { _selectedStars = v; updateStarUI(); }
function updateStarUI() {
  document.querySelectorAll('#rateStars .star').forEach(function(s, i) {
    s.classList.toggle('selected', i < _selectedStars);
  });
}

function submitRating() {
  var review = document.getElementById('rateReview').value.trim();
  var errEl = document.getElementById('rateError');
  if (!_selectedStars) { errEl.textContent = t('starsRequired'); return; }
  if (!review) { errEl.textContent = t('reviewRequired'); return; }
  var form = new FormData();
  form.append('worker_id', _rateWorkerId);
  form.append('stars', _selectedStars);
  form.append('review', review);
  if (_rateResponseId) form.append('job_response_id', _rateResponseId);
  var photo = document.getElementById('ratePhoto').files[0];
  if (photo) form.append('photo', photo);
  fetch('/api/ratings', { method: 'POST', body: form }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      closeModal('rateModal');
      showToast(t('ratingSuccess'), 'success');
      loadMyRequests();
    } else { errEl.textContent = t(d.error) || d.error; }
  });
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function doLogout() {
  fetch('/api/auth/logout', { method: 'POST' }).then(function() { window.location.href = '/'; });
}
