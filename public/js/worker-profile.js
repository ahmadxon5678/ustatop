var _workerId = parseInt(location.pathname.split('/').pop());
var _session = null;
var _selectedStars = 0;
var _ratingWorkerId = null;
var _isBookmarked = false;
var _calendarData = {};
var _calYear = new Date().getFullYear();
var _calMonth = new Date().getMonth();

// ── SVG icon helpers ──
var SVG = {
  phone: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5a2 2 0 0 1 1.9-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  telegram: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  heartFill: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  heartEmpty: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  mapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
};

// ── Review tracking (localStorage, max 3 total) ──
function getGivenReviews() {
  try { return JSON.parse(localStorage.getItem('givenReviews') || '[]'); } catch(e) { return []; }
}
function markReviewGiven(workerId) {
  var given = getGivenReviews();
  if (given.indexOf(workerId) === -1) { given.push(workerId); localStorage.setItem('givenReviews', JSON.stringify(given)); }
}

Promise.all([
  fetch('/api/auth/status').then(function(r) { return r.json(); }).catch(function() { return {}; }),
  fetch('/api/workers/' + _workerId).then(function(r) { return r.json(); })
]).then(function(results) {
  _session = results[0];
  var data = results[1];
  if (!data.worker) {
    document.getElementById('profileContent').innerHTML = '<div class="empty-state"><p>' + t('workerNotFound') + '</p></div>';
    return;
  }
  setupNav(_session);
  if (_session && _session.loggedIn) {
    fetch('/api/bookmarks').then(function(r) { return r.json(); }).then(function(bd) {
      _isBookmarked = (bd.bookmarks || []).some(function(b) { return b.worker_id === _workerId; });
      renderProfile(data.worker, data.portfolio || [], data.ratings || [], data.calendar || []);
    }).catch(function() {
      renderProfile(data.worker, data.portfolio || [], data.ratings || [], data.calendar || []);
    });
  } else {
    renderProfile(data.worker, data.portfolio || [], data.ratings || [], data.calendar || []);
  }
}).catch(function(err) {
  console.error('Profile error:', err);
  document.getElementById('profileContent').innerHTML =
    '<div class="empty-state"><p>' + t('errorGeneric') + '</p></div>';
});

function getDashUrl(type) {
  if (type === 'worker') return '/dashboard/worker';
  if (type === 'shop')   return '/dashboard/shop';
  return '/dashboard/customer';
}

function setupNav(session) {
  var navUser = document.getElementById('navUser');
  if (session && session.loggedIn) {
    navUser.innerHTML = '<a href="' + getDashUrl(session.userType) + '" class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.4)">' + (session.userName || t('home')) + '</a>';
    loadNotifBadge();
  } else {
    navUser.innerHTML = '<a href="/" class="btn btn-sm btn-primary">' + t('login') + '</a>';
  }
}

function loadNotifBadge() {
  var area = document.getElementById('notifArea');
  fetch('/api/notifications').then(function(r) { return r.json(); }).then(function(d) {
    area.innerHTML = '<button class="notif-btn" onclick="toggleNotifPanel()" title="' + t('notifications') + '">' +
      SVG.bell + (d.unread > 0 ? '<span class="notif-badge">' + d.unread + '</span>' : '') + '</button>';
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

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getLastSeenText(lastSeen) {
  if (!lastSeen) return '';
  var lang = localStorage.getItem('lang') || 'uz';
  var now = new Date();
  var seen = new Date(lastSeen);
  var diffMins = Math.floor((now - seen) / 60000);
  var diffHours = Math.floor(diffMins / 60);
  var diffDays = Math.floor(diffHours / 24);
  if (diffMins < 5)   return '<span class="last-seen online">● ' + (lang==='ru' ? 'Онлайн' : 'Onlayn') + '</span>';
  if (diffMins < 60)  return '<span class="last-seen recent">' + diffMins + (lang==='ru' ? ' мин. назад' : ' daq. oldin') + '</span>';
  if (diffHours < 24) return '<span class="last-seen today">' + diffHours + (lang==='ru' ? ' ч. назад' : ' soat oldin') + '</span>';
  if (diffDays < 7)   return '<span class="last-seen week">' + diffDays + (lang==='ru' ? ' дн. назад' : ' kun oldin') + '</span>';
  return '<span class="last-seen old">' + (lang==='ru' ? 'Давно не активен' : 'Uzoq faol emas') + '</span>';
}

function getResponseBadge(avgHours, totalResponses) {
  if (!totalResponses) return '';
  var lang = localStorage.getItem('lang') || 'uz';
  if (avgHours <= 1)  return '<span class="response-badge fast">⚡ ' + (lang==='ru' ? 'В течение 1 ч.' : '1 soat ichida') + '</span>';
  if (avgHours <= 3)  return '<span class="response-badge good">' + SVG.clock + ' 2-3 ' + (lang==='ru' ? 'ч.' : 'soat') + '</span>';
  if (avgHours <= 24) return '<span class="response-badge normal">' + SVG.clock + ' ' + Math.round(avgHours) + (lang==='ru' ? ' ч.' : ' soat') + '</span>';
  return '<span class="response-badge slow">' + SVG.clock + ' ' + Math.round(avgHours/24) + (lang==='ru' ? ' дн.' : ' kun') + '</span>';
}

function renderProfile(worker, portfolio, ratings, calendar) {
  // Build calendar lookup map
  _calendarData = {};
  (calendar || []).forEach(function(e) { _calendarData[e.date] = e.status; });

  var initials = (worker.name || '?').split(' ').map(function(x){ return x[0]; }).join('').toUpperCase().slice(0,2);

  // Availability badge (no emoji)
  var availBadge = worker.availability_status === 'available'
    ? '<span class="badge badge-available"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#27ae60;margin-right:5px;vertical-align:middle"></span>' + t('available') + '</span>'
    : '<span class="badge badge-busy"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#e74c3c;margin-right:5px;vertical-align:middle"></span>' + t('busy') + '</span>';

  // Verified badge
  var verifiedBadge = worker.is_verified
    ? '<span class="wp-verified-badge">' + SVG.check + ' Shaxsi tasdiqlangan</span>'
    : '';

  // Calendar trigger button (shown always)
  var calBtn = '<button class="wp-cal-btn" onclick="openCalendarModal()" title="Mavjudlik kalendarini ko\'rish">' + SVG.calendar + '<span>Mavjudlik</span></button>';

  // Bookmark button
  var bmBtn = '';
  if (_session && _session.loggedIn) {
    bmBtn = '<button class="wp-bookmark-btn' + (_isBookmarked ? ' active' : '') + '" id="bmBtn" onclick="toggleBookmark()">' +
      (_isBookmarked ? SVG.heartFill : SVG.heartEmpty) +
      '<span>' + (_isBookmarked ? t('bookmarked') : t('bookmark')) + '</span>' +
    '</button>';
  }

  // ── Contact section ──
  var contactHtml = '';
  if (_session && _session.loggedIn) {
    var contactItems = '';
    if (worker.phone) {
      contactItems += '<a href="tel:' + escHtml(worker.phone) + '" class="wp-contact-item">' +
        '<span class="wp-contact-icon phone">' + SVG.phone + '</span>' +
        '<span>' + formatPhoneDisplay(worker.phone) + '</span></a>';
    }
    if (worker.telegram) {
      var tgHandle = worker.telegram.startsWith('@') ? worker.telegram : '@' + worker.telegram;
      contactItems += '<a href="https://t.me/' + escHtml(tgHandle.replace('@','')) + '" target="_blank" rel="noopener" class="wp-contact-item">' +
        '<span class="wp-contact-icon telegram">' + SVG.telegram + '</span>' +
        '<span>' + escHtml(tgHandle) + '</span></a>';
    }
    if (worker.instagram) {
      var igHandle = worker.instagram.startsWith('@') ? worker.instagram : '@' + worker.instagram;
      contactItems += '<a href="https://instagram.com/' + escHtml(igHandle.replace('@','')) + '" target="_blank" rel="noopener" class="wp-contact-item">' +
        '<span class="wp-contact-icon instagram">' + SVG.instagram + '</span>' +
        '<span>' + escHtml(igHandle) + '</span></a>';
    }
    if (contactItems) {
      contactHtml = '<section class="wp-section wp-contact-card"><div class="wp-section-title">Aloqa</div><div class="wp-contact-list">' + contactItems + '</div></section>';
    }
  } else {
    contactHtml = '<section class="wp-section wp-contact-locked"><span class="wp-contact-lock-icon">' + SVG.lock + '</span><a href="/" class="wp-contact-lock-link">' + t('contactHidden') + '</a></section>';
  }

  // ── Portfolio (max 5) ──
  var portfolioHtml = '';
  if (portfolio.length > 0) {
    var shown = portfolio.slice(0, 5);
    portfolioHtml = '<section class="wp-section"><div class="wp-section-title">' + t('portfolio') + '</div>' +
      '<div class="portfolio-grid">' +
      shown.map(function(p) {
        return '<img src="' + escHtml(p.image_url) + '" class="portfolio-img wp-portfolio-img" alt="portfolio" onclick="window.open(\'' + escHtml(p.image_url) + '\',\'_blank\')">';
      }).join('') + '</div>' +
      (portfolio.length > 5 ? '<p class="wp-portfolio-note">So\'nggi 5 ta rasm ko\'rsatilmoqda</p>' : '') +
    '</section>';
  }

  // ── Reviews ──
  var reviewsList = '';
  if (ratings.length > 0) {
    reviewsList = ratings.map(function(r) {
      return '<div class="review-card">' +
        '<div class="review-header">' +
          '<span class="review-author">' + escHtml(r.customer_name) + '</span>' +
          '<span class="review-date">' + formatDate(r.created_at) + '</span>' +
        '</div>' +
        '<div>' + renderStars(r.stars) + '</div>' +
        '<div class="review-text">' + escHtml(r.review) + '</div>' +
        (r.photo ? '<img src="' + escHtml(r.photo) + '" class="review-photo" alt="review">' : '') +
      '</div>';
    }).join('');
  } else {
    reviewsList = '<div class="empty-state" style="padding:20px 0"><p>' + t('noReviews') + '</p></div>';
  }

  // ── Inline review form ──
  var reviewFormHtml = '';
  if (_session && _session.loggedIn && _session.userType === 'customer') {
    var givenReviews = getGivenReviews();
    var alreadyRatedThis = givenReviews.indexOf(_workerId) !== -1;
    var maxReached = givenReviews.length >= 3;
    var disabled = alreadyRatedThis || maxReached;
    var disabledMsg = alreadyRatedThis
      ? 'Siz bu ustani allaqachon baholagansiz'
      : 'Siz maksimal sharhlar soniga yetdingiz';

    if (disabled) {
      reviewFormHtml = '<div class="wp-review-limit-msg">' + disabledMsg + '</div>';
    } else {
      reviewFormHtml = '<div class="wp-inline-review">' +
        '<div class="wp-section-subtitle">Sharh qoldiring</div>' +
        '<div class="stars-input" id="inlineStarsInput">' +
          '<span class="star" data-v="1" onclick="setInlineStar(1)">★</span>' +
          '<span class="star" data-v="2" onclick="setInlineStar(2)">★</span>' +
          '<span class="star" data-v="3" onclick="setInlineStar(3)">★</span>' +
          '<span class="star" data-v="4" onclick="setInlineStar(4)">★</span>' +
          '<span class="star" data-v="5" onclick="setInlineStar(5)">★</span>' +
        '</div>' +
        '<textarea class="form-input wp-review-textarea" id="inlineReviewText" rows="3" placeholder="Tavsifingizni yozing..."></textarea>' +
        '<div class="auth-error" id="inlineReviewError" style="min-height:18px;margin-bottom:4px"></div>' +
        '<button class="btn btn-primary" onclick="submitInlineRating(' + worker.id + ')">Yuborish</button>' +
      '</div>';
    }
  }

  var reviewsHtml = '<section class="wp-section">' +
    '<div class="wp-section-title">' + t('reviews') + ' (' + ratings.length + ')</div>' +
    reviewsList +
    reviewFormHtml +
  '</section>';

  // ── Build full page ──
  document.getElementById('profileContent').innerHTML =
    '<div class="worker-profile-hero">' +
      '<div class="worker-profile-header">' +
        '<div class="worker-profile-avatar">' + initials + '</div>' +
        '<div class="worker-profile-info">' +
          '<div class="worker-profile-name">' + escHtml(worker.name) + '</div>' +
          (verifiedBadge ? '<div style="margin-bottom:6px">' + verifiedBadge + '</div>' : '') +
          '<div class="worker-profile-profession">' + escHtml(worker.profession) + '</div>' +
          '<div class="worker-profile-meta">' +
            (worker.region ? '<span>' + SVG.mapPin + ' ' + escHtml(worker.region) + (worker.city ? ', ' + escHtml(worker.city) : '') + '</span>' : '') +
            (worker.experience ? '<span>' + SVG.clock + ' ' + escHtml(worker.experience) + '</span>' : '') +
          '</div>' +
          '<div class="wp-hero-badges">' +
            availBadge +
            '<div style="display:flex;align-items:center;gap:4px;color:#fff">' + renderStars(worker.rating) + ' ' + (worker.rating||0).toFixed(1) + '</div>' +
            (getLastSeenText(worker.last_seen) ? getLastSeenText(worker.last_seen) : '') +
          '</div>' +
          (getResponseBadge(worker.avg_response_hours, worker.total_responses) ? '<div style="margin-top:6px">' + getResponseBadge(worker.avg_response_hours, worker.total_responses) + '</div>' : '') +
          '<div class="wp-hero-actions">' + calBtn + bmBtn + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="worker-profile-body">' +
      (worker.description ? '<section class="wp-section"><div class="wp-section-title">' + t('description') + '</div><p class="wp-desc-text">' + escHtml(worker.description) + '</p></section>' : '') +
      contactHtml +
      portfolioHtml +
      reviewsHtml +
    '</div>';
}

// ── Bookmark ──
function toggleBookmark() {
  fetch('/api/bookmarks/toggle', { method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ worker_id: _workerId })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      _isBookmarked = d.bookmarked;
      var btn = document.getElementById('bmBtn');
      if (btn) {
        btn.className = 'wp-bookmark-btn' + (_isBookmarked ? ' active' : '');
        btn.innerHTML = (_isBookmarked ? SVG.heartFill : SVG.heartEmpty) +
          '<span>' + (_isBookmarked ? t('bookmarked') : t('bookmark')) + '</span>';
      }
    }
  }).catch(function() {});
}

// ── Inline rating ──
function setInlineStar(val) {
  _selectedStars = val;
  document.querySelectorAll('#inlineStarsInput .star').forEach(function(s, i) {
    s.classList.toggle('selected', i < val);
  });
}

function submitInlineRating(workerId) {
  var review = document.getElementById('inlineReviewText').value.trim();
  var errEl = document.getElementById('inlineReviewError');
  errEl.textContent = '';
  if (!_selectedStars) { errEl.textContent = t('starsRequired'); return; }
  if (!review) { errEl.textContent = t('reviewRequired'); return; }

  var form = new FormData();
  form.append('worker_id', workerId);
  form.append('stars', _selectedStars);
  form.append('review', review);

  fetch('/api/ratings', { method: 'POST', body: form })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success) {
        markReviewGiven(_workerId);
        showToast(t('ratingSuccess'), 'success');
        setTimeout(function() { location.reload(); }, 1500);
      } else {
        errEl.textContent = t(d.error) || d.error;
      }
    }).catch(function() { errEl.textContent = t('networkError'); });
}

// ── Rate modal (legacy, kept for compatibility) ──
function openRateModal(workerId) {
  _ratingWorkerId = workerId;
  _selectedStars = 0;
  document.getElementById('reviewText').value = '';
  document.getElementById('reviewPhoto').value = '';
  document.getElementById('rateError').textContent = '';
  updateStarDisplay();
  document.getElementById('rateModal').classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function setStar(val) { _selectedStars = val; updateStarDisplay(); }

function updateStarDisplay() {
  document.querySelectorAll('#starsInput .star').forEach(function(s, i) {
    s.classList.toggle('selected', i < _selectedStars);
  });
}

function submitRating() {
  var review = document.getElementById('reviewText').value.trim();
  var errEl = document.getElementById('rateError');
  errEl.textContent = '';
  if (!_selectedStars) { errEl.textContent = t('starsRequired'); return; }
  if (!review) { errEl.textContent = t('reviewRequired'); return; }

  var formData = new FormData();
  formData.append('worker_id', _ratingWorkerId);
  formData.append('stars', _selectedStars);
  formData.append('review', review);
  var photo = document.getElementById('reviewPhoto').files[0];
  if (photo) formData.append('photo', photo);

  fetch('/api/ratings', { method: 'POST', body: formData })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success) {
        markReviewGiven(_workerId);
        closeModal('rateModal');
        showToast(t('ratingSuccess'), 'success');
        setTimeout(function() { location.reload(); }, 1500);
      } else {
        errEl.textContent = t(d.error) || d.error;
      }
    }).catch(function() { errEl.textContent = t('networkError'); });
}

// ── Calendar ──
var _MONTH_NAMES = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
var _DAY_NAMES = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];

function openCalendarModal() {
  _calYear = new Date().getFullYear();
  _calMonth = new Date().getMonth();
  document.getElementById('calendarModal').classList.add('open');
  renderCalendarGrid();
}

function changeCalMonth(dir) {
  _calMonth += dir;
  if (_calMonth < 0) { _calMonth = 11; _calYear--; }
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  renderCalendarGrid();
}

function renderCalendarGrid() {
  document.getElementById('calTitle').textContent = _MONTH_NAMES[_calMonth] + ' ' + _calYear;
  var firstDOW = new Date(_calYear, _calMonth, 1).getDay();
  firstDOW = (firstDOW + 6) % 7; // Monday-first
  var daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();

  var html = '<div class="wp-cal-grid">';
  _DAY_NAMES.forEach(function(d) { html += '<div class="wp-cal-dayname">' + d + '</div>'; });
  for (var i = 0; i < firstDOW; i++) html += '<div class="wp-cal-cell empty"></div>';
  for (var day = 1; day <= daysInMonth; day++) {
    var ds = _calYear + '-' + String(_calMonth+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    var status = _calendarData[ds];
    var cls = 'wp-cal-cell' + (status ? ' wp-cal-' + status : '');
    var label = status === 'available' ? '<span class="wp-cal-cell-label">Bo\'sh</span>'
               : status === 'busy'      ? '<span class="wp-cal-cell-label">Band</span>' : '';
    html += '<div class="' + cls + '"><span class="wp-cal-daynum">' + day + '</span>' + label + '</div>';
  }
  html += '</div>';
  document.getElementById('calendarBody').innerHTML = html;
}
