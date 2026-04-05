var _allProducts = [];
var _fuseSearch  = null;
var _session     = null;
var _activePill  = 'all';

// ── SVG icon constants ──
var MSVG = {
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  phone: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5a2 2 0 0 1 1.9-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  store: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  box: '<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  flame: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  tag: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  grid: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  zap: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
};

// ── Product-type → gradient theme ──
var TYPE_THEMES = {
  'Sement':   { bg: 'linear-gradient(135deg,#4b5563 0%,#9ca3af 100%)' },
  "G'isht":   { bg: 'linear-gradient(135deg,#b91c1c 0%,#f87171 100%)' },
  "Bo'yoq":   { bg: 'linear-gradient(135deg,#6d28d9 0%,#a78bfa 100%)' },
  'Plitka':   { bg: 'linear-gradient(135deg,#0369a1 0%,#38bdf8 100%)' },
  'Qum':      { bg: 'linear-gradient(135deg,#b45309 0%,#fbbf24 100%)' },
  "Shag'al":  { bg: 'linear-gradient(135deg,#57534e 0%,#a8a29e 100%)' },
  "Yog'och":  { bg: 'linear-gradient(135deg,#7c2d12 0%,#ea580c 100%)' },
  'Temir':    { bg: 'linear-gradient(135deg,#1e3a5f 0%,#3b82f6 100%)' },
  'Shifer':   { bg: 'linear-gradient(135deg,#1f2937 0%,#6b7280 100%)' },
  'Boshqa':   { bg: 'linear-gradient(135deg,#F07020 0%,#FF8C00 100%)' }
};
var DEFAULT_THEME = { bg: 'linear-gradient(135deg,#F07020 0%,#FF8C00 100%)' };

// ── Quick-filter pill definitions ──
var PILLS = [
  { id: 'all',     label: 'Barchasi',      icon: MSVG.grid,  type: '',       sort: '' },
  { id: 'new',     label: 'Eng yangi',     icon: MSVG.zap,   type: '',       sort: '' },
  { id: 'cheap',   label: 'Arzon narxlar', icon: MSVG.tag,   type: '',       sort: 'cheapest' },
  { id: 'popular', label: 'Ommabop',       icon: MSVG.flame, type: '',       sort: 'expensive' },
  { id: 'sement',  label: 'Sement',        icon: '',         type: 'Sement', sort: '' },
  { id: 'gisht',   label: "G'isht",        icon: '',         type: "G'isht", sort: '' },
  { id: 'plitka',  label: 'Plitka',        icon: '',         type: 'Plitka', sort: '' },
  { id: 'boyoq',   label: "Bo'yoq",        icon: '',         type: "Bo'yoq", sort: '' },
  { id: 'yogoch',  label: "Yog'och",       icon: '',         type: "Yog'och",sort: '' }
];

// ── Boot ──
Promise.all([
  fetch('/api/auth/status').then(function(r) { return r.json(); }).catch(function() { return {}; }),
  fetch('/api/products').then(function(r) { return r.json(); })
]).then(function(results) {
  _session = results[0];
  _allProducts = results[1].products || [];
  _fuseSearch  = createProductSearch(_allProducts);
  setupNav(_session);
  renderPills();
  updateCount(_allProducts.length);
  renderProducts(_allProducts);
}).catch(function(err) {
  console.error('Marketplace error:', err);
  document.getElementById('productsGrid').innerHTML =
    '<div class="empty-state" style="grid-column:1/-1"><p>' + t('errorGeneric') + '</p></div>';
});

// ── Nav ──
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
      MSVG.bell + (d.unread > 0 ? '<span class="notif-badge">' + d.unread + '</span>' : '') + '</button>';
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

// ── Pills ──
function renderPills() {
  var row = document.getElementById('mktPillsRow');
  if (!row) return;
  row.innerHTML = PILLS.map(function(pill) {
    var isActive = pill.id === _activePill;
    return '<button class="mkt-pill' + (isActive ? ' active' : '') + '" onclick="clickPill(\'' + pill.id + '\')">' +
      (pill.icon ? '<span class="mkt-pill-icon">' + pill.icon + '</span>' : '') +
      escHtml(pill.label) +
    '</button>';
  }).join('');
}

function clickPill(id) {
  _activePill = id;
  var pill = null;
  for (var i = 0; i < PILLS.length; i++) {
    if (PILLS[i].id === id) { pill = PILLS[i]; break; }
  }
  if (pill) {
    document.getElementById('filterType').value = pill.type;
    document.getElementById('filterSort').value = pill.sort;
  }
  renderPills();
  applyFilters();
}

function onTypeSelectChange() {
  _activePill = null;
  renderPills();
  applyFilters();
}

function onSortSelectChange() {
  _activePill = null;
  renderPills();
  applyFilters();
}

// ── Filters ──
function applyFilters() {
  var query = document.getElementById('searchInput').value.trim();
  var type  = document.getElementById('filterType').value;
  var sort  = document.getElementById('filterSort').value;

  var filtered = _allProducts;
  if (type) filtered = filtered.filter(function(p) { return p.product_type === type; });

  if (query && _fuseSearch) {
    var res = _fuseSearch.search(query);
    var ids = {};
    res.forEach(function(r) { ids[r.item.id] = true; });
    filtered = filtered.filter(function(p) { return ids[p.id]; });
  }

  if (sort === 'cheapest') {
    filtered = filtered.slice().sort(function(a, b) { return parseFloat(a.price) - parseFloat(b.price); });
  } else if (sort === 'expensive') {
    filtered = filtered.slice().sort(function(a, b) { return parseFloat(b.price) - parseFloat(a.price); });
  }

  updateCount(filtered.length);
  renderProducts(filtered);
}

function updateCount(n) {
  var el = document.getElementById('mktProductCount');
  if (el) el.textContent = n + ' ta mahsulot mavjud';
}

// ── Helpers ──
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getTheme(type) {
  return TYPE_THEMES[type] || DEFAULT_THEME;
}

// ── Render ──
function renderProducts(products) {
  var grid = document.getElementById('productsGrid');
  if (!products || products.length === 0) {
    grid.innerHTML =
      '<div class="mkt-empty" style="grid-column:1/-1">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '<p>' + t('noProducts') + '</p>' +
      '</div>';
    return;
  }

  var isLoggedIn = _session && _session.loggedIn;

  grid.innerHTML = products.map(function(p) {
    var theme = getTheme(p.product_type);
    var price = parseFloat(p.price);
    var priceStr = !isNaN(price) ? price.toLocaleString('uz-UZ') + " so'm" : escHtml(p.price);

    // ── Image / placeholder ──
    var imgSection =
      '<div class="mkt-card-img" style="background:' + theme.bg + '">' +
        (p.image_url
          ? '<img src="' + escHtml(p.image_url) + '" alt="' + escHtml(p.product_name) + '" class="mkt-card-img-photo">'
          : '<div class="mkt-card-img-placeholder">' + MSVG.box + '</div>') +
        (p.product_type
          ? '<div class="mkt-card-type-badge">' + escHtml(p.product_type) + '</div>'
          : '') +
      '</div>';

    // ── Contacts ──
    var contacts = '';

    if (p.seller_phone && isLoggedIn) {
      contacts +=
        '<a href="tel:' + escHtml(p.seller_phone) + '" class="mkt-contact-item phone">' +
          '<span class="mkt-contact-icon">' + MSVG.phone + '</span>' +
          '<span>' + formatPhoneDisplay(p.seller_phone) + '</span>' +
        '</a>';
    } else if (!isLoggedIn) {
      contacts +=
        '<span class="mkt-locked-contact">' +
          '<span style="display:flex;color:#bbb">' + MSVG.lock + '</span>' +
          '<a href="/" style="color:#F07020;font-weight:600;text-decoration:none">' + t('contactHidden') + '</a>' +
        '</span>';
    }

    if (p.shop_telegram) {
      var tg = p.shop_telegram.startsWith('@') ? p.shop_telegram : '@' + p.shop_telegram;
      contacts +=
        '<a href="https://t.me/' + escHtml(tg.replace('@','')) + '" target="_blank" rel="noopener" class="mkt-contact-item telegram">' +
          '<span class="mkt-contact-icon">' + MSVG.send + '</span>' +
          '<span>' + escHtml(tg) + '</span>' +
        '</a>';
    }

    if (p.shop_instagram) {
      var ig = p.shop_instagram.startsWith('@') ? p.shop_instagram : '@' + p.shop_instagram;
      contacts +=
        '<a href="https://instagram.com/' + escHtml(ig.replace('@','')) + '" target="_blank" rel="noopener" class="mkt-contact-item instagram">' +
          '<span class="mkt-contact-icon">' + MSVG.instagram + '</span>' +
          '<span>' + escHtml(ig) + '</span>' +
        '</a>';
    }

    return (
      '<div class="mkt-card">' +
        imgSection +
        '<div class="mkt-card-body">' +
          '<div class="mkt-card-name">' + escHtml(p.product_name) + '</div>' +
          '<div class="mkt-card-price">' + priceStr + '</div>' +
          (p.seller
            ? '<div class="mkt-card-seller">' + MSVG.store + '<span>' + escHtml(p.seller) + '</span></div>'
            : '') +
          (p.description
            ? '<div class="mkt-card-desc">' + escHtml(p.description) + '</div>'
            : '') +
          (contacts ? '<div class="mkt-card-contacts">' + contacts + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }).join('');
}
