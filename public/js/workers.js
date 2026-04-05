var _allWorkers = [];
var _fuseSearch = null;
var _session = null;
var _bookmarks = new Set();
var _userCity = null;
var _activeQuickFilter = 'all';

// ── SVG icons ──
var WSVG = {
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  mapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  shieldCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
  starFill: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starFillSm: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starEmpty: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  users: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  zap: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  heartFill: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  heartEmpty: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  trendingUp: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  topStar: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  allGrid: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  topBadgeStar: '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

// ── Boot ──
Promise.all([
  fetch('/api/auth/status').then(function(r) { return r.json(); }).catch(function() { return {}; }),
  fetch('/api/workers').then(function(r) { return r.json(); }).catch(function() { return { workers: [] }; }),
  fetch('/api/auth/me').then(function(r) { return r.ok ? r.json() : {}; }).catch(function() { return {}; })
]).then(function(results) {
  _session = results[0];
  var data = results[1];
  var meData = results[2];
  _allWorkers = data.workers || [];
  _fuseSearch = createWorkerSearch(_allWorkers);
  if (meData && meData.user) _userCity = meData.user.city || null;

  setupNav(_session);

  if (_session && _session.loggedIn) {
    fetch('/api/bookmarks').then(function(r) { return r.json(); }).then(function(bd) {
      (bd.bookmarks || []).forEach(function(b) { _bookmarks.add(b.worker_id); });
      renderWorkers(_allWorkers);
    }).catch(function() { renderWorkers(_allWorkers); });
  } else {
    renderWorkers(_allWorkers);
  }
}).catch(function(err) {
  console.error('Workers load error:', err);
  document.getElementById('workersGrid').innerHTML =
    '<div class="empty-state"><p>' + t('errorGeneric') + '</p></div>';
});

// ── Nav ──
function setupNav(session) {
  var navUser = document.getElementById('navUser');
  if (session && session.loggedIn) {
    navUser.innerHTML = '<a href="' + getDashUrl(session.userType) + '" class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.4)">' + (session.userName || t('home')) + '</a>';
    loadNotifBadge();
  } else {
    navUser.innerHTML = '<a href="/" class="btn btn-sm btn-primary">' + t('login') + '</a>';
  }
}

function getDashUrl(type) {
  if (type === 'worker') return '/dashboard/worker';
  if (type === 'shop')   return '/dashboard/shop';
  return '/dashboard/customer';
}

function loadNotifBadge() {
  var area = document.getElementById('notifArea');
  fetch('/api/notifications').then(function(r) { return r.json(); }).then(function(d) {
    area.innerHTML = '<button class="notif-btn" onclick="toggleNotifPanel()" title="' + t('notifications') + '">' +
      WSVG.bell + (d.unread > 0 ? '<span class="notif-badge">' + d.unread + '</span>' : '') + '</button>';
  }).catch(function() {});
}

var _notifOpen = false;
function toggleNotifPanel() {
  if (_notifOpen) {
    var p = document.getElementById('notifPanel');
    if (p) p.remove();
    _notifOpen = false;
    return;
  }
  _notifOpen = true;
  fetch('/api/notifications').then(function(r) { return r.json(); }).then(function(d) {
    var panel = document.createElement('div');
    panel.id = 'notifPanel';
    panel.className = 'notif-panel';
    var lang = localStorage.getItem('lang') || 'uz';
    var items = (d.notifications || []).map(function(n) {
      return '<div class="notif-item' + (n.is_read ? '' : ' unread') + '">' +
        (lang === 'ru' ? n.message_ru : n.message_uz) +
        '<div class="notif-time">' + formatDate(n.created_at) + '</div></div>';
    }).join('') || '<div class="notif-item">' + t('noNotifications') + '</div>';
    panel.innerHTML = items;
    document.querySelector('.nav-right').style.position = 'relative';
    document.querySelector('.nav-right').appendChild(panel);
    fetch('/api/notifications/read-all', { method: 'POST' });
    loadNotifBadge();
  });
}

// ── Quick filter ──
function setQuickFilter(type) {
  if (type === 'myCity') {
    if (!_session || !_session.loggedIn) {
      showToast('Bu funksiyadan foydalanish uchun tizimga kiring', 'error');
      return;
    }
    if (!_userCity) {
      showToast('Shahringiz profilingizda belgilanmagan', 'error');
      return;
    }
  }
  _activeQuickFilter = type;
  document.getElementById('filter-all').classList.toggle('active', type === 'all');
  document.getElementById('filter-my-city').classList.toggle('active', type === 'myCity');
  applyFilters();
}

function onVerifiedChange() {
  var checked = document.getElementById('filterVerified').checked;
  document.getElementById('pill-verified').classList.toggle('wkr-pill-green', checked);
  applyFilters();
}

// ── Filters ──
function applyFilters() {
  var query      = document.getElementById('searchInput').value.trim();
  var region     = document.getElementById('filterRegion').value;
  var profession = document.getElementById('filterProfession').value;
  var verified   = document.getElementById('filterVerified') && document.getElementById('filterVerified').checked;

  var filtered = _allWorkers;

  if (_activeQuickFilter === 'myCity' && _userCity) {
    filtered = filtered.filter(function(w) {
      return (w.city || '').toLowerCase() === _userCity.toLowerCase();
    });
    if (filtered.length === 0) {
      document.getElementById('workersGrid').innerHTML =
        '<div class="wkr-empty"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><p>Sizning shahringizda hozircha ustalar yo\'q</p></div>';
      return;
    }
  }

  if (verified)   filtered = filtered.filter(function(w) { return w.is_verified; });
  if (region)     filtered = filtered.filter(function(w) { return w.region === region; });
  if (profession) filtered = filtered.filter(function(w) { return w.profession === profession; });

  if (query && _fuseSearch) {
    var res = _fuseSearch.search(query);
    var ids = new Set(res.map(function(r) { return r.item.id; }));
    filtered = filtered.filter(function(w) { return ids.has(w.id); });
  }

  renderWorkers(filtered);
}

// ── Badge helpers ──
function getResponseBadge(avgHours, totalResponses) {
  if (!totalResponses) return '';
  var lang = localStorage.getItem('lang') || 'uz';
  if (avgHours <= 1)
    return '<div class="wkr-resp-badge fast">' + WSVG.zap + (lang==='ru' ? 'В течение 1 ч.' : '1 soat ichida') + '</div>';
  if (avgHours <= 3)
    return '<div class="wkr-resp-badge good">' + WSVG.clock + (lang==='ru' ? '2-3 часа' : '2-3 soat') + '</div>';
  if (avgHours <= 24)
    return '<div class="wkr-resp-badge normal">' + WSVG.clock + Math.round(avgHours) + (lang==='ru' ? ' ч.' : ' soat') + '</div>';
  return '<div class="wkr-resp-badge slow">' + WSVG.calendar + Math.round(avgHours/24) + (lang==='ru' ? ' дн.' : ' kun') + '</div>';
}

function getLastSeenText(lastSeen) {
  if (!lastSeen) return '';
  var lang = localStorage.getItem('lang') || 'uz';
  var diffMins  = Math.floor((new Date() - new Date(lastSeen)) / 60000);
  var diffHours = Math.floor(diffMins / 60);
  var diffDays  = Math.floor(diffHours / 24);
  if (diffMins < 5)
    return '<div class="wkr-last-seen online"><span class="wkr-online-dot"></span>' + (lang==='ru' ? 'Онлайн' : 'Hozir onlayn') + '</div>';
  if (diffMins < 60)
    return '<div class="wkr-last-seen recent">' + diffMins + (lang==='ru' ? ' мин. назад' : ' daq. oldin faol') + '</div>';
  if (diffHours < 24)
    return '<div class="wkr-last-seen today">' + diffHours + (lang==='ru' ? ' ч. назад' : ' soat oldin faol') + '</div>';
  if (diffDays < 7)
    return '<div class="wkr-last-seen week">' + diffDays + (lang==='ru' ? ' дн. назад' : ' kun oldin faol') + '</div>';
  return '<div class="wkr-last-seen old">' + (lang==='ru' ? 'Давно не активен' : 'Uzoq vaqt faol emas') + '</div>';
}

function renderStarsRow(rating) {
  var r = Math.round(rating || 0);
  var html = '';
  for (var i = 1; i <= 5; i++) {
    html += i <= r ? WSVG.starFillSm : WSVG.starEmpty;
  }
  return html;
}

// ── Card builder ──
function workerCardHtml(w, isFeatured) {
  var initials   = (w.name || '?').split(' ').map(function(x) { return x[0]; }).join('').toUpperCase().slice(0, 2);
  var bookmarked = _bookmarks.has(w.id);
  var lang       = localStorage.getItem('lang') || 'uz';

  // Availability pill
  var isAvail = w.availability_status === 'available';
  var availPill =
    '<span class="wkr-avail-pill ' + (isAvail ? 'available' : 'busy') + '">' +
      '<span class="wkr-avail-dot"></span>' +
      (isAvail ? t('available') : t('busy')) +
    '</span>';

  // Verified badge
  var verifiedBadge = w.is_verified
    ? '<span class="wkr-verified">' + WSVG.shieldCheck + 'Tekshirilgan</span>'
    : '';

  // TOP badge
  var topBadge = isFeatured
    ? '<div class="wkr-top-badge">' + WSVG.topBadgeStar + 'TOP USTA</div>'
    : '';

  // Bookmark button
  var bmBtn = (_session && _session.loggedIn)
    ? '<button class="wkr-heart-btn' + (bookmarked ? ' active' : '') + '" onclick="toggleBookmark(event,' + w.id + ')" title="Saqlash">' +
        (bookmarked ? WSVG.heartFill : WSVG.heartEmpty) +
      '</button>'
    : '';

  // Weekly views
  var views = w.weekly_views > 0
    ? '<div class="wkr-views">' + WSVG.trendingUp + 'Bu hafta ' + w.weekly_views + ' kishi murojaat qildi</div>'
    : '';

  return (
    '<div class="wkr-card' + (isFeatured ? ' wkr-card--featured' : '') + '" onclick="openWorker(' + w.id + ')">' +
      topBadge +
      '<div class="wkr-card-body">' +
        // Header
        '<div class="wkr-card-header">' +
          '<div class="wkr-avatar">' + initials + '</div>' +
          '<div class="wkr-card-info">' +
            '<div class="wkr-name">' + escHtml(w.name) + verifiedBadge + '</div>' +
            '<div class="wkr-profession">' + escHtml(w.profession) + '</div>' +
            '<div class="wkr-location">' + WSVG.mapPin + escHtml(w.region || '') + (w.city ? ', ' + escHtml(w.city) : '') + '</div>' +
            getLastSeenText(w.last_seen) +
          '</div>' +
        '</div>' +
        // Stats
        '<div class="wkr-stats">' +
          '<div class="wkr-rating">' +
            renderStarsRow(w.rating) +
            '<span class="wkr-rating-num">' + (w.rating || 0).toFixed(1) + '</span>' +
            (w.review_count > 0 ? '<span class="wkr-rating-count">(' + w.review_count + ')</span>' : '') +
          '</div>' +
          availPill +
        '</div>' +
        // Response badge
        getResponseBadge(w.avg_response_hours, w.total_responses) +
        // Views metric
        views +
        // Spacer
        '<div class="wkr-card-spacer"></div>' +
        // Actions
        '<div class="wkr-actions">' +
          '<button class="wkr-view-btn" onclick="event.stopPropagation();openWorker(' + w.id + ')">' + t('view') + '</button>' +
          bmBtn +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

// ── Section header builder ──
function sectionHeader(icon, label) {
  return '<div class="wkr-section-header">' +
    '<span class="wkr-section-icon">' + icon + '</span>' +
    '<span class="wkr-section-title">' + label + '</span>' +
    '<span class="wkr-section-line"></span>' +
  '</div>';
}

// ── Render ──
function renderWorkers(workers) {
  var grid = document.getElementById('workersGrid');
  if (!workers || workers.length === 0) {
    grid.innerHTML =
      '<div class="wkr-empty">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '<p>' + t('noWorkers') + '</p>' +
      '</div>';
    return;
  }

  var featured = workers.filter(function(w) { return w.is_featured; });
  var regular  = workers.filter(function(w) { return !w.is_featured; });

  if (featured.length === 0) {
    grid.innerHTML =
      sectionHeader(WSVG.allGrid, 'BARCHA USTALAR') +
      '<div class="wkr-cards-grid">' +
        workers.map(function(w) { return workerCardHtml(w, false); }).join('') +
      '</div>';
    return;
  }

  var html =
    sectionHeader(WSVG.topStar, 'TOP USTALAR') +
    '<div class="wkr-cards-grid" style="margin-bottom:32px">' +
      featured.map(function(w) { return workerCardHtml(w, true); }).join('') +
    '</div>';

  if (regular.length > 0) {
    html +=
      sectionHeader(WSVG.allGrid, 'BARCHA USTALAR') +
      '<div class="wkr-cards-grid">' +
        regular.map(function(w) { return workerCardHtml(w, false); }).join('') +
      '</div>';
  }

  grid.innerHTML = html;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openWorker(id) {
  window.location.href = '/workers/' + id;
}

function toggleBookmark(e, workerId) {
  e.stopPropagation();
  if (!_session || !_session.loggedIn) { window.location.href = '/'; return; }
  fetch('/api/bookmarks/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ worker_id: workerId })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      if (d.bookmarked) _bookmarks.add(workerId);
      else _bookmarks.delete(workerId);
      applyFilters();
    }
  }).catch(function() {});
}
