var _session = null;
var _respondJobId = null;
var _notifOpen = false;
var _workerProfile = null;
var _showAll = false;
var _pollInterval = null;
var _calYear = null;
var _calMonth = null;
var _calBusy = null;

// ── INIT ──
fetch('/api/auth/status').then(function(r) { return r.json(); }).then(function(d) {
  if (!d.loggedIn) { window.location.href = '/'; return; }
  _session = d;
  document.getElementById('welcomeSub').textContent = d.userName || '';
  if (d.workerApproved) {
    renderApprovedState();
  } else if (d.workerRejected) {
    renderRejectedState();
  } else {
    renderPendingState();
  }
  loadNotifBadge();
}).catch(function() { window.location.href = '/'; });

// ── CARD CONFIG (SVG icons, no emojis) ──
var DSVG = {
  wrench:   '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  bag:      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  clip:     '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  list:     '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  bookmark: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  user:     '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  file:     '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  image:    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  star:     '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  store:    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  zap:      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F07020" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  grid:     '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  bell:     '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
};

var CARD_CONFIG = {
  findWorker:   { svg: DSVG.wrench,   bg: 'linear-gradient(135deg,#F07020,#ea6000)', sh: 'rgba(240,112,32,0.32)', desc: "Malakali ustalarni toping va yollang" },
  marketplace:  { svg: DSVG.bag,      bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', sh: 'rgba(59,130,246,0.32)', desc: "Qurilish materiallarini ko'ring" },
  jobRequest:   { svg: DSVG.clip,     bg: 'linear-gradient(135deg,#22c55e,#16a34a)', sh: 'rgba(34,197,94,0.32)',  desc: "Yangi ish e'loni joylashtiring" },
  myRequests:   { svg: DSVG.list,     bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', sh: 'rgba(139,92,246,0.32)', desc: "Joriy e'lonlaringizni ko'ring" },
  savedWorkers: { svg: DSVG.bookmark, bg: 'linear-gradient(135deg,#ef4444,#b91c1c)', sh: 'rgba(239,68,68,0.32)',  desc: "Saqlangan ustalaringiz" },
  myProfile:    { svg: DSVG.user,     bg: 'linear-gradient(135deg,#1a1a2e,#2d3748)', sh: 'rgba(26,26,46,0.32)',   desc: "Ma'lumotlaringizni tahrirlang" },
  myResume:     { svg: DSVG.file,     bg: 'linear-gradient(135deg,#F07020,#ea6000)', sh: 'rgba(240,112,32,0.32)', desc: "Tajriba va ko'nikmalaringiz" },
  portfolio:    { svg: DSVG.image,    bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', sh: 'rgba(59,130,246,0.32)', desc: "Ish namunalaringizni ko'rsating" },
  availability: { svg: DSVG.calendar, bg: 'linear-gradient(135deg,#22c55e,#16a34a)', sh: 'rgba(34,197,94,0.32)',  desc: "Bandlik jadvalingizni boshqaring" },
  myReviews:    { svg: DSVG.star,     bg: 'linear-gradient(135deg,#f59e0b,#d97706)', sh: 'rgba(245,158,11,0.32)', desc: "Mijozlar sharhlarini ko'ring" },
  myShop:       { svg: DSVG.store,    bg: 'linear-gradient(135deg,#F07020,#ea6000)', sh: 'rgba(240,112,32,0.32)', desc: "Do'kon ma'lumotlari" }
};

function _mkIconBlock(cfg) {
  return '<div class="dash-card-icon-wrap" style="background:' + cfg.bg + ';box-shadow:0 4px 14px ' + cfg.sh + '">' + cfg.svg + '</div>';
}
function _mkArrow() {
  return '<span class="dash-card-new-arrow">' + DSVG.arrowRight + '</span>';
}

function mkCard(cardId, label, onclick) {
  var cfg = CARD_CONFIG[cardId] || CARD_CONFIG.findWorker;
  return '<div class="dashboard-card" onclick="' + onclick + '">' +
    _mkIconBlock(cfg) +
    '<div class="dash-card-new-title">' + escHtml(label) + '</div>' +
    (cfg.desc ? '<p class="card-description">' + escHtml(cfg.desc) + '</p>' : '') +
    _mkArrow() +
  '</div>';
}

function mkWorkerFeatureCard(cardId, label, onclick) {
  var cfg = CARD_CONFIG[cardId] || CARD_CONFIG.myResume;
  return '<div class="worker-feature-card" onclick="' + onclick + '">' +
    _mkIconBlock(cfg) +
    '<div class="dash-card-new-title">' + escHtml(label) + '</div>' +
    (cfg.desc ? '<p class="card-description">' + escHtml(cfg.desc) + '</p>' : '') +
    _mkArrow() +
  '</div>';
}

function mkGeneralCard(cardId, label, onclick) {
  var cfg = CARD_CONFIG[cardId] || CARD_CONFIG.findWorker;
  return '<div class="general-feature-card" onclick="' + onclick + '">' +
    _mkIconBlock(cfg) +
    '<div class="dash-card-new-title">' + escHtml(label) + '</div>' +
    (cfg.desc ? '<p class="card-description">' + escHtml(cfg.desc) + '</p>' : '') +
    _mkArrow() +
  '</div>';
}

function mkSectionBlock(svgIcon, titleText, titleClass, _unused, cardsHtml, extra) {
  return '<div class="section-block"' + (extra ? ' style="' + extra + '"' : '') + '>' +
    '<div class="section-header">' +
      '<span class="section-icon">' + svgIcon + '</span>' +
      '<span class="section-title ' + titleClass + '">' + titleText + '</span>' +
      '<div class="section-line"></div>' +
    '</div>' +
    '<div class="section-cards-grid">' + cardsHtml + '</div>' +
  '</div>';
}

// ── STATE RENDERERS ──

function renderRejectedState() {
  document.getElementById('pendingBanner').style.display = 'none';
  document.getElementById('rejectedBanner').style.display = '';
  document.getElementById('approvedBadge').style.display = 'none';
  document.getElementById('contentArea').innerHTML = '';
  document.getElementById('dashCards').className = 'dashboard-cards-grid';
  document.getElementById('dashCards').innerHTML =
    mkCard('findWorker',   t('findWorker'),   "window.location.href='/workers'") +
    mkCard('marketplace',  t('marketplace'),  "window.location.href='/marketplace'") +
    mkCard('jobRequest',   t('jobRequest'),   'openJobModal()') +
    mkCard('myRequests',   t('myRequests'),   "showSection('myRequests')") +
    mkCard('savedWorkers', t('savedWorkers'), "showSection('savedWorkers')") +
    mkCard('myProfile',    t('myProfile'),    'openProfileModal()');
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
}

function renderPendingState() {
  document.getElementById('pendingBanner').style.display = '';
  document.getElementById('rejectedBanner').style.display = 'none';
  document.getElementById('approvedBadge').style.display = 'none';
  document.getElementById('contentArea').innerHTML = '';
  document.getElementById('dashCards').className = 'dashboard-cards-grid';
  document.getElementById('dashCards').innerHTML =
    mkCard('findWorker',   t('findWorker'),   "window.location.href='/workers'") +
    mkCard('marketplace',  t('marketplace'),  "window.location.href='/marketplace'") +
    mkCard('jobRequest',   t('jobRequest'),   'openJobModal()') +
    mkCard('myRequests',   t('myRequests'),   "showSection('myRequests')") +
    mkCard('savedWorkers', t('savedWorkers'), "showSection('savedWorkers')") +
    mkCard('myProfile',    t('myProfile'),    'openProfileModal()');
  var sb = document.getElementById('workerStatsBar');
  if (sb) sb.style.display = '';
  loadWorkerStats();
  if (_pollInterval) clearInterval(_pollInterval);
  _pollInterval = setInterval(pollApproval, 30000);
}

function renderApprovedState() {
  document.getElementById('pendingBanner').style.display = 'none';
  document.getElementById('rejectedBanner').style.display = 'none';
  document.getElementById('approvedBadge').style.display = '';
  document.getElementById('contentArea').innerHTML = '';
  var sb = document.getElementById('workerStatsBar');
  if (sb) sb.style.display = '';
  loadWorkerStats();
  document.getElementById('dashCards').className = '';
  document.getElementById('dashCards').innerHTML =
    mkSectionBlock(DSVG.zap, 'Usta imkoniyatlari', 'worker-title', null,
      mkWorkerFeatureCard('myResume',     t('myResume'),     'openResumeModal()') +
      mkWorkerFeatureCard('portfolio',    t('portfolio'),    'openPortfolioModal()') +
      mkWorkerFeatureCard('availability', t('availability'), 'openAvailModal()') +
      mkWorkerFeatureCard('myReviews',    t('myReviews'),    "showSection('myReviews')")
    ) +
    mkSectionBlock(DSVG.grid, 'Umumiy imkoniyatlar', 'general-title', null,
      mkGeneralCard('findWorker',   t('findWorker'),   "window.location.href='/workers'") +
      mkGeneralCard('marketplace',  t('marketplace'),  "window.location.href='/marketplace'") +
      mkGeneralCard('jobRequest',   t('jobRequest'),   'openJobModal()') +
      mkGeneralCard('myRequests',   t('myRequests'),   "showSection('myRequests')") +
      mkGeneralCard('savedWorkers', t('savedWorkers'), "showSection('savedWorkers')") +
      mkGeneralCard('myProfile',    t('myProfile'),    'openProfileModal()'),
      'margin-top:0'
    );
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
  fetch('/api/workers/my/profile').then(function(r) { return r.json(); }).then(function(p) {
    if (p.worker) _workerProfile = p.worker;
  }).catch(function() {});
}

// ── STATS ──

function loadWorkerStats() {
  fetch('/api/workers/my/profile').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (!d || !d.worker) return;
    var el = document.getElementById('stat-responses');
    if (el) el.textContent = d.worker.total_responses || 0;
    var elR = document.getElementById('stat-reviews');
    if (elR) elR.textContent = (d.ratings || []).length || (d.worker.review_count || 0);
    var elP = document.getElementById('stat-portfolio');
    if (elP) elP.textContent = (d.portfolio || []).length;
  }).catch(function() {});
}

// ── POLLING ──

function pollApproval() {
  fetch('/api/auth/status').then(function(r) { return r.json(); }).then(function(d) {
    if (d.workerApproved && _session && !_session.workerApproved) {
      _session = d;
      renderApprovedState();
      showApprovalPopup();
    }
  }).catch(function() {});
}

function showApprovalPopup() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;padding:36px 28px;text-align:center;max-width:320px;margin:16px;box-shadow:0 12px 40px rgba(0,0,0,0.2)">' +
      '<div style="font-size:3rem;margin-bottom:14px">🎉</div>' +
      '<div style="font-size:1.15rem;font-weight:700;color:#27ae60;margin-bottom:8px">' + t('approvalNotification') + '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 5000);
}

// ── NOTIFICATIONS ──

function loadNotifBadge() {
  fetch('/api/notifications').then(function(r) { return r.json(); }).then(function(d) {
    var btn = document.getElementById('notifBtn');
    btn.innerHTML = DSVG.bell + (d.unread > 0 ? '<span class="notif-badge">' + d.unread + '</span>' : '');
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

// ── SECTION LOADER ──

function showSection(name) {
  var area = document.getElementById('contentArea');
  area.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  if (name === 'myRequests')   loadMyRequests();
  else if (name === 'savedWorkers') loadBookmarks();
  else if (name === 'myReviews')    loadMyReviews();
  else if (name === 'jobRequests')  loadJobRequests();
}

// ── JOB REQUEST MODAL (customer feature — both states) ──

function openJobModal() {
  document.getElementById('jrTitle').value = '';
  document.getElementById('jrDesc').value = '';
  document.getElementById('jrError').textContent = '';
  var phoneEl = document.getElementById('jrPhone');
  if (phoneEl) phoneEl.value = '';
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

function formatBudget(num) { return Number(num).toLocaleString('uz-UZ'); }

// ── BASIC PROFILE MODAL (both states — name, phone readonly, region, city) ──

function openProfileModal() {
  fetch('/api/users/profile').then(function(r) { return r.json(); }).then(function(d) {
    var u = d.user;
    document.getElementById('ppName').value = u.name || '';
    document.getElementById('ppPhone').value = formatPhoneDisplay(u.phone);
    document.getElementById('ppCity').value = u.city || '';
    document.getElementById('ppError').textContent = '';
    setSelectValue('ppRegion', u.region);
    document.getElementById('profileModal').classList.add('open');
  }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function saveBasicProfile() {
  var name   = document.getElementById('ppName').value.trim();
  var region = document.getElementById('ppRegion').value;
  var city   = document.getElementById('ppCity').value.trim();
  var errEl  = document.getElementById('ppError');
  errEl.textContent = '';
  if (!name || !region || !city) { errEl.textContent = t('requiredFields'); return; }
  fetch('/api/users/profile', { method: 'PUT', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name: name, region: region, city: city })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      closeModal('profileModal');
      if (_session) _session.userName = name;
      document.getElementById('welcomeSub').textContent = name;
      showToast(t('profileUpdated'), 'success');
    } else { errEl.textContent = t(d.error) || t('errorGeneric'); }
  }).catch(function() { errEl.textContent = t('networkError'); });
}

// ── WORKER RESUME MODAL (approved only — all worker fields) ──

function openResumeModal() {
  fetch('/api/workers/my/profile').then(function(r) { return r.json(); }).then(function(d) {
    if (!d.worker) { showToast(t('errorGeneric'), 'error'); return; }
    var w = d.worker;
    _workerProfile = w;
    document.getElementById('rmName').value      = w.name        || '';
    document.getElementById('rmDesc').value      = w.description || '';
    document.getElementById('rmCity').value      = w.city        || '';
    document.getElementById('rmTelegram').value  = w.telegram    || '';
    document.getElementById('rmInstagram').value = w.instagram   || '';
    document.getElementById('rmError').textContent = '';
    setSelectValue('rmProf',   w.profession);
    setSelectValue('rmExp',    w.experience);
    setSelectValue('rmRegion', w.region);
    if (w.phone) setPhoneValue(document.getElementById('rmPhone'), w.phone);
    else document.getElementById('rmPhone').value = '';
    document.getElementById('resumeModal').classList.add('open');
  }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function saveWorkerResume() {
  var errEl = document.getElementById('rmError');
  errEl.textContent = '';
  var name = document.getElementById('rmName').value.trim();
  if (!name) { errEl.textContent = t('requiredFields'); return; }
  var data = {
    name:        name,
    profession:  document.getElementById('rmProf').value,
    experience:  document.getElementById('rmExp').value,
    description: document.getElementById('rmDesc').value.trim(),
    region:      document.getElementById('rmRegion').value,
    city:        document.getElementById('rmCity').value.trim(),
    phone:       getPhoneRaw(document.getElementById('rmPhone')),
    telegram:    document.getElementById('rmTelegram').value.trim(),
    instagram:   document.getElementById('rmInstagram').value.trim()
  };
  fetch('/api/workers/my/profile', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        closeModal('resumeModal');
        _workerProfile = Object.assign(_workerProfile || {}, data);
        showToast(t('profileUpdated'), 'success');
      } else { errEl.textContent = t(d.error) || t('errorGeneric'); }
    }).catch(function() { errEl.textContent = t('networkError'); });
}

// ── PORTFOLIO MODAL (approved only) ──

function openPortfolioModal() {
  document.getElementById('portfolioContent').innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  document.getElementById('portfolioModal').classList.add('open');
  loadPortfolioContent();
}

function loadPortfolioContent() {
  fetch('/api/workers/my/profile').then(function(r) { return r.json(); }).then(function(d) {
    var imgs = d.portfolio || [];
    var html = '<div class="portfolio-grid">' +
      imgs.map(function(p) {
        return '<div style="position:relative">' +
          '<img src="' + escHtml(p.image_url) + '" class="portfolio-img" alt="portfolio">' +
          '<button onclick="deletePortfolioImg(' + p.id + ')" style="position:absolute;top:4px;right:4px;background:rgba(231,76,60,0.9);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:0.75rem">✕</button>' +
        '</div>';
      }).join('') +
    '</div>';
    html += '<p style="font-size:0.82rem;color:#aaa;margin-top:10px;margin-bottom:0">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:3px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
      'Bepul foydalanuvchilar faqat so\'nggi 5 ta rasmni ko\'rsata oladi.</p>';
    if (imgs.length < 5) {
      html += '<div style="margin-top:12px"><label class="btn btn-outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:7px">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' +
        'Rasm qo\'shish' +
        '<input type="file" accept="image/*" style="display:none" onchange="uploadPortfolioImg(this)">' +
        '</label></div>';
    }
    html += '<p style="font-size:0.82rem;color:#999;margin-top:8px">' + imgs.length + '/5 rasm</p>';
    document.getElementById('portfolioContent').innerHTML = html;
  }).catch(function() {
    document.getElementById('portfolioContent').innerHTML = '<p>' + t('errorGeneric') + '</p>';
  });
}

function uploadPortfolioImg(input) {
  var file = input.files[0];
  if (!file) return;
  var form = new FormData();
  form.append('image', file);
  fetch('/api/workers/my/portfolio', { method: 'POST', body: form })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { showToast(t('photoAdded'), 'success'); loadPortfolioContent(); }
      else showToast(t(d.error) || d.error, 'error');
    }).catch(function() { showToast(t('networkError'), 'error'); });
}

function deletePortfolioImg(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/workers/my/portfolio/' + id, { method: 'DELETE' })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { showToast(t('deleteSuccess'), 'success'); loadPortfolioContent(); }
    }).catch(function() {});
}

// ── AVAILABILITY MODAL (approved only) ──

function openAvailModal() {
  document.getElementById('availContent').innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  document.getElementById('availModal').classList.add('open');
  var now = new Date();
  _calYear = now.getFullYear();
  _calMonth = now.getMonth();
  _calBusy = new Set();
  var profileP = fetch('/api/workers/my/profile').then(function(r) { return r.json(); });
  var calP = fetch('/api/workers/me/availability/calendar').then(function(r) { return r.json(); });
  Promise.all([profileP, calP]).then(function(results) {
    (results[1].dates || []).forEach(function(d) {
      if (d.status === 'busy') _calBusy.add(d.date);
    });
    renderAvailFull(results[0].worker || {});
  }).catch(function() {
    document.getElementById('availContent').innerHTML = '<p>' + t('errorGeneric') + '</p>';
  });
}

function renderAvailFull(worker) {
  var isAvail = !worker.availability_status || worker.availability_status === 'available';
  var statusHtml =
    '<div class="card" style="margin-bottom:16px;text-align:center">' +
      '<div style="font-size:2.5rem;margin-bottom:8px">' + (isAvail ? '🟢' : '🔴') + '</div>' +
      '<div style="font-weight:700;font-size:1.05rem;margin-bottom:16px;color:' + (isAvail ? '#27ae60' : '#e74c3c') + '">' +
        (isAvail ? t('available') : t('busy')) +
      '</div>' +
      '<button class="btn btn-full ' + (isAvail ? 'btn-danger' : 'btn-success') + '" onclick="toggleAvailStatus(\'' + (isAvail ? 'busy' : 'available') + '\')">' +
        (isAvail ? '🔴 ' + t('busy') : '🟢 ' + t('available')) +
      '</button>' +
    '</div>';
  document.getElementById('availContent').innerHTML =
    statusHtml +
    '<div class="section-title" style="margin-top:16px">' + t('calendar') + '</div>' +
    '<p style="font-size:0.85rem;color:#666;margin-bottom:12px">' + t('calendarDesc') + '</p>' +
    '<div id="availCalSection"></div>';
  renderCalSection();
}

function toggleAvailStatus(newStatus) {
  fetch('/api/workers/my/availability', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: newStatus }) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        showToast(t('statusUpdated'), 'success');
        fetch('/api/workers/my/profile').then(function(r) { return r.json(); }).then(function(p) {
          renderAvailFull(p.worker || {});
        });
      }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function renderCalSection() {
  var el = document.getElementById('availCalSection');
  if (!el) return;
  var now = new Date();
  var todayYear = now.getFullYear();
  var todayMonth = now.getMonth();
  var maxMonth = todayMonth + 5;
  var maxYear = todayYear;
  if (maxMonth > 11) { maxYear++; maxMonth -= 12; }
  var monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  var dayNames = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
  var isMin = (_calYear === todayYear && _calMonth === todayMonth);
  var isMax = (_calYear === maxYear && _calMonth === maxMonth);
  var nav =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
      '<button class="btn btn-sm btn-secondary" ' + (isMin ? 'disabled style="opacity:0.3;cursor:default"' : 'onclick="calNav(-1)"') + '>←</button>' +
      '<span style="font-weight:700">' + monthNames[_calMonth] + ' ' + _calYear + '</span>' +
      '<button class="btn btn-sm btn-secondary" ' + (isMax ? 'disabled style="opacity:0.3;cursor:default"' : 'onclick="calNav(1)"') + '>→</button>' +
    '</div>';
  var firstDay = new Date(_calYear, _calMonth, 1).getDay();
  var daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
  var startDay = (firstDay === 0 ? 6 : firstDay - 1);
  var grid = '<div class="calendar-grid">' + dayNames.map(function(d) {
    return '<div style="text-align:center;font-size:0.75rem;font-weight:600;color:#999;padding:4px">' + d + '</div>';
  }).join('');
  for (var i = 0; i < startDay; i++) grid += '<div></div>';
  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = _calYear + '-' + String(_calMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var isBusy = _calBusy && _calBusy.has(dateStr);
    var isToday = (_calYear === todayYear && _calMonth === todayMonth && day === now.getDate());
    var cls = 'cal-day' + (isBusy ? ' busy' : '') + (isToday ? ' today' : '');
    grid += '<div class="' + cls + '" onclick="toggleCalDay(\'' + dateStr + '\')">' + day + '</div>';
  }
  grid += '</div>';
  el.innerHTML =
    '<div class="card">' + nav + grid + '</div>' +
    '<div style="margin-top:16px">' +
      '<button class="btn btn-primary btn-full" onclick="saveCalendar()">Saqlash 💾</button>' +
      '<div id="calSaveMsg" style="text-align:center;font-size:0.85rem;color:#27ae60;margin-top:8px;display:none">Kalendar saqlandi ✓</div>' +
    '</div>';
}

function calNav(dir) {
  _calMonth += dir;
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  if (_calMonth < 0) { _calMonth = 11; _calYear--; }
  renderCalSection();
}

function toggleCalDay(dateStr) {
  if (!_calBusy) return;
  if (_calBusy.has(dateStr)) { _calBusy.delete(dateStr); } else { _calBusy.add(dateStr); }
  renderCalSection();
}

function saveCalendar() {
  var dates = [];
  if (_calBusy) { _calBusy.forEach(function(d) { dates.push({ date: d, status: 'busy' }); }); }
  fetch('/api/workers/me/availability/calendar', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ dates: dates })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      var msg = document.getElementById('calSaveMsg');
      if (msg) { msg.style.display = ''; setTimeout(function() { if (msg) msg.style.display = 'none'; }, 3000); }
    }
  }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

// ── MY REQUESTS (own submitted job requests) ──

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
        var statusBadge = jr.status === 'active'
          ? '<span class="badge badge-approved">' + t('active') + '</span>'
          : '<span class="badge badge-pending">' + t('expired') + '</span>';
        return '<div class="job-card">' +
          '<div class="job-card-header"><div class="job-title">' + escHtml(jr.title) + '</div>' + statusBadge + '</div>' +
          '<div class="job-meta">' +
            (jr.profession_needed ? '<span>🔧 ' + escHtml(jr.profession_needed) + '</span>' : '') +
            (jr.region ? '<span>📍 ' + escHtml(jr.region) + '</span>' : '') +
            '<span>📅 ' + formatDate(jr.created_at) + '</span>' +
          '</div>' +
          (jr.description ? '<div class="job-desc">' + escHtml(jr.description) + '</div>' : '') +
          '<div class="job-actions">' +
            '<button class="btn btn-sm btn-danger" onclick="deleteMyRequest(' + jr.id + ')">🗑 ' + t('delete') + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
  }).catch(function() {
    document.getElementById('contentArea').innerHTML = '<p>' + t('errorGeneric') + '</p>';
  });
}

function deleteMyRequest(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/job-requests/' + id, { method: 'DELETE' }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { showToast(t('deleteSuccess'), 'success'); loadMyRequests(); }
  }).catch(function() {});
}

// ── JOB REQUESTS FROM CUSTOMERS (approved workers only) ──

function loadJobRequests() {
  fetch('/api/job-requests').then(function(r) { return r.json(); }).then(function(d) {
    var area = document.getElementById('contentArea');
    var reqs = d.requests || [];
    if (!_showAll && _workerProfile) {
      reqs = reqs.filter(function(jr) {
        return !jr.profession_needed || jr.profession_needed === _workerProfile.profession;
      });
    }
    var toggleBtn = '<div style="display:flex;gap:8px;margin-bottom:16px">' +
      '<button class="btn ' + (!_showAll ? 'btn-primary' : 'btn-secondary') + ' btn-sm" onclick="_showAll=false;loadJobRequests()">' + t('showMyProfession') + '</button>' +
      '<button class="btn ' + (_showAll ? 'btn-primary' : 'btn-secondary') + ' btn-sm" onclick="_showAll=true;loadJobRequests()">' + t('showAll') + '</button>' +
      '</div>';
    if (reqs.length === 0) {
      area.innerHTML = '<div class="section-title">' + t('jobRequestsForMe') + '</div>' + toggleBtn +
        '<div class="empty-state"><div class="empty-icon">📋</div><p>' + t('noRequests') + '</p></div>';
      return;
    }
    area.innerHTML = '<div class="section-title">' + t('jobRequestsForMe') + '</div>' + toggleBtn +
      reqs.map(function(jr) {
        var urgentBadge = jr.is_urgent
          ? '<div style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:12px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:10px;animation:urgentPulse 2s infinite">🔴 SHOSHILINCH</div>'
          : '';
        var budgetHtml = (jr.is_urgent && (jr.budget_from || jr.budget_to))
          ? '<div style="font-size:13px;color:#F07020;font-weight:600;margin-bottom:8px">💰 Byudjet: ' + (jr.budget_from ? formatBudget(jr.budget_from) : '?') + ' — ' + (jr.budget_to ? formatBudget(jr.budget_to) : '?') + " so'm</div>"
          : '';
        var borderLeft = jr.is_urgent ? 'border-left:4px solid #e74c3c;' : '';
        return '<div class="job-card" style="' + borderLeft + '">' +
          urgentBadge + budgetHtml +
          '<div class="job-card-header"><div class="job-title">' + escHtml(jr.title) + '</div></div>' +
          '<div class="job-meta">' +
            (jr.profession_needed ? '<span>🔧 ' + escHtml(jr.profession_needed) + '</span>' : '') +
            (jr.region ? '<span>📍 ' + escHtml(jr.region) + (jr.city ? ', ' + escHtml(jr.city) : '') + '</span>' : '') +
            '<span>👤 ' + escHtml(jr.poster_name || '') + '</span>' +
            '<span>📅 ' + formatDate(jr.created_at) + '</span>' +
          '</div>' +
          (jr.description ? '<div class="job-desc">' + escHtml(jr.description) + '</div>' : '') +
          '<div class="job-actions">' +
            '<button class="btn btn-primary btn-sm" onclick="openRespondModal(' + jr.id + ',\'' + escHtml(jr.title) + '\')">' + t('respond') + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
  }).catch(function() {
    document.getElementById('contentArea').innerHTML = '<p>' + t('errorGeneric') + '</p>';
  });
}

function openRespondModal(jobId, title) {
  _respondJobId = jobId;
  document.getElementById('respondJobInfo').textContent = title;
  document.getElementById('respondMsg').value = '';
  document.getElementById('respondPriceFrom').value = '';
  document.getElementById('respondPriceTo').value = '';
  document.getElementById('respondError').textContent = '';
  document.getElementById('respondModal').classList.add('open');
}

function submitResponse() {
  var msg = document.getElementById('respondMsg').value.trim();
  var priceFrom = document.getElementById('respondPriceFrom').value.trim();
  var priceTo = document.getElementById('respondPriceTo').value.trim();
  var errEl = document.getElementById('respondError');
  if (!msg) { errEl.textContent = t('messageRequired'); return; }
  var body = { job_request_id: _respondJobId, message: msg };
  if (priceFrom) body.price_from = priceFrom;
  if (priceTo) body.price_to = priceTo;
  fetch('/api/job-responses', { method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) { closeModal('respondModal'); showToast(t('responseSuccess'), 'success'); }
    else { errEl.textContent = t(d.error) || d.error; }
  }).catch(function() { errEl.textContent = t('networkError'); });
}

// ── MY REVIEWS ──

function loadMyReviews() {
  fetch('/api/ratings/my').then(function(r) { return r.json(); }).then(function(d) {
    var area = document.getElementById('contentArea');
    var ratings = d.ratings || [];
    if (ratings.length === 0) {
      area.innerHTML = '<div class="section-title">' + t('myReviews') + '</div>' +
        '<div class="empty-state"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><p>' + t('noReviews') + '</p></div>';
      return;
    }
    area.innerHTML = '<div class="section-title">' + t('myReviews') + ' (' + ratings.length + ')</div>' +
      ratings.map(function(r) {
        return '<div class="review-card">' +
          '<div class="review-header"><span class="review-author">' + escHtml(r.customer_name) + '</span>' +
            '<span class="review-date">' + formatDate(r.created_at) + '</span></div>' +
          '<div>' + renderStars(r.stars) + '</div>' +
          '<div class="review-text">' + escHtml(r.review) + '</div>' +
          (r.photo ? '<img src="' + escHtml(r.photo) + '" class="review-photo">' : '') +
        '</div>';
      }).join('');
  }).catch(function() {
    document.getElementById('contentArea').innerHTML = '<p>' + t('errorGeneric') + '</p>';
  });
}

// ── SAVED WORKERS ──

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
        var initials = (b.name || '?').split(' ').map(function(x) { return x[0]; }).join('').toUpperCase().slice(0, 2);
        return '<div class="worker-card"><div class="worker-card-header"><div class="worker-avatar">' + initials + '</div>' +
          '<div class="worker-info"><div class="worker-name">' + escHtml(b.name) + '</div>' +
          '<div class="worker-profession">' + escHtml(b.profession) + '</div></div></div>' +
          '<div class="worker-card-actions"><button class="btn btn-primary btn-sm" style="flex:1" onclick="window.location.href=\'/workers/' + b.worker_id + '\'">' + t('view') + '</button></div></div>';
      }).join('') + '</div>';
  }).catch(function() {
    document.getElementById('contentArea').innerHTML = '<p>' + t('errorGeneric') + '</p>';
  });
}

// ── HELPERS ──

function setSelectValue(id, value) {
  if (!value) return;
  var sel = document.getElementById(id);
  if (!sel) return;
  for (var i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === value || sel.options[i].text === value) {
      sel.selectedIndex = i; return;
    }
  }
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function doLogout() {
  fetch('/api/auth/logout', { method: 'POST' }).then(function() { window.location.href = '/'; });
}
