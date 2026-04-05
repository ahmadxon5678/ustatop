var _currentTab = 'overview';
var _activeCharts = [];
var _wSubs = [];
var _sSubs = [];

// Load stats on init
loadStats();
showTab('overview');

function loadStats() {
  fetch('/api/admin/stats').then(function(r) { return r.json(); }).then(function(d) {
    document.getElementById('stUsers').textContent = d.totalUsers || 0;
    document.getElementById('stWorkers').textContent = d.totalWorkers !== undefined ? d.totalWorkers : (d.approvedWorkers || 0);
    document.getElementById('stShops').textContent = d.totalShops !== undefined ? d.totalShops : (d.approvedShops || 0);
    document.getElementById('stProducts').textContent = d.totalProducts || 0;
    var b = document.getElementById('badgeWsubs');
    if (b) { b.textContent = d.pendingWorkers || 0; b.style.display = d.pendingWorkers > 0 ? '' : 'none'; }
    var b2 = document.getElementById('badgeSsubs');
    if (b2) { b2.textContent = d.pendingShops || 0; b2.style.display = d.pendingShops > 0 ? '' : 'none'; }
  }).catch(function(e) { console.error('Stats error:', e); });
}

function showTab(tab) {
  _currentTab = tab;
  _activeCharts.forEach(function(c) { try { c.destroy(); } catch(e) {} });
  _activeCharts = [];
  document.querySelectorAll('.admin-sidebar-btn').forEach(function(b) { b.classList.remove('active'); });
  var tabs = { overview:0, users:1, wsubs:2, ssubs:3, workers:4, products:5, jobreqs:6, ratings:7, responses:8 };
  var idx = tabs[tab];
  if (idx !== undefined) document.querySelectorAll('.admin-sidebar-btn')[idx].classList.add('active');
  var content = document.getElementById('adminContent');
  content.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  if (tab === 'overview') loadOverview();
  else if (tab === 'users') loadUsers();
  else if (tab === 'wsubs') loadWorkerSubs();
  else if (tab === 'ssubs') loadShopSubs();
  else if (tab === 'workers') loadWorkers();
  else if (tab === 'products') loadProducts();
  else if (tab === 'jobreqs') loadJobReqs();
  else if (tab === 'ratings') loadRatings();
  else if (tab === 'responses') loadResponses();
}

// ── OVERVIEW ──
function loadOverview() {
  fetch('/api/admin/stats').then(function(r) { return r.json(); }).then(function(d) {
    console.log('Stats API response:', JSON.stringify(d));
    var workers = d.totalWorkers !== undefined ? d.totalWorkers : (d.approvedWorkers || 0);
    var shops   = d.totalShops   !== undefined ? d.totalShops   : (d.approvedShops   || 0);
    var customers = d.totalCustomers || 0;
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">📊 Umumiy ko\'rinish</h2></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:12px">' +
        statCard(d.totalUsers||0, 'Foydalanuvchilar', '#F07020') +
        statCard(workers, 'Ustalar', '#F07020') +
        statCard(shops, "Do'konlar", '#F07020') +
        statCard(customers, 'Mijozlar', '#F07020') +
        statCard(d.totalProducts||0, 'Mahsulotlar', '#F07020') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px">' +
        statCard(d.activeJobRequests||0, 'Faol buyurtmalar', '#27ae60') +
        statCard(d.pendingWorkers||0, 'Kutayotgan ustalar', '#e74c3c') +
        statCard(d.pendingShops||0, "Kutayotgan do'konlar", '#e74c3c') +
        statCard(d.totalRatings||0, 'Jami sharhlar', '#3498db') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">' +
        '<div class="card" style="border-radius:14px"><div style="font-weight:700;margin-bottom:14px;font-size:0.85rem;color:#1a1a2e">📈 So\'nggi 30 kun — Ro\'yxatdan o\'tishlar</div><canvas id="chartReg"></canvas></div>' +
        '<div class="card" style="border-radius:14px"><div style="font-weight:700;margin-bottom:14px;font-size:0.85rem;color:#1a1a2e">⚒️ Kasblar bo\'yicha ustalar</div><canvas id="chartProf"></canvas></div>' +
        '<div class="card" style="border-radius:14px"><div style="font-weight:700;margin-bottom:14px;font-size:0.85rem;color:#1a1a2e">🗺️ Viloyatlar bo\'yicha foydalanuvchilar</div><canvas id="chartRegion"></canvas></div>' +
        '<div class="card" style="border-radius:14px"><div style="font-weight:700;margin-bottom:14px;font-size:0.85rem;color:#1a1a2e">📋 So\'nggi 30 kun — Buyurtmalar</div><canvas id="chartJR"></canvas></div>' +
      '</div>';
    setTimeout(function() { renderCharts(d); }, 60);
  });
}

function statCard(val, label, color) {
  var bg = color === '#e74c3c' ? 'rgba(231,76,60,0.07)' : color === '#27ae60' ? 'rgba(39,174,96,0.07)' : color === '#3498db' ? 'rgba(52,152,219,0.07)' : 'rgba(240,112,32,0.07)';
  var border = color === '#e74c3c' ? 'rgba(231,76,60,0.2)' : color === '#27ae60' ? 'rgba(39,174,96,0.2)' : color === '#3498db' ? 'rgba(52,152,219,0.2)' : 'rgba(240,112,32,0.2)';
  return '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:14px;text-align:center;padding:18px 10px">' +
    '<div style="font-size:2.1rem;font-weight:800;color:' + color + ';line-height:1">' + val + '</div>' +
    '<div style="font-size:0.75rem;color:#666;margin-top:6px;font-weight:500;line-height:1.3">' + label + '</div>' +
  '</div>';
}

function renderCharts(d) {
  var gold = '#F07020', blue = '#3498db';
  var colors = ['#F07020','#27ae60','#3498db','#e74c3c','#9b59b6','#1abc9c','#f39c12','#e67e22','#2980b9','#16a085','#8e44ad','#c0392b','#2c3e50'];

  var el1 = document.getElementById('chartReg');
  if (el1) _activeCharts.push(new Chart(el1, {
    type: 'line',
    data: {
      labels: (d.registrationsPerDay||[]).map(function(r){return r.date.slice(5);}),
      datasets: [{ data: (d.registrationsPerDay||[]).map(function(r){return r.count;}),
        borderColor: gold, backgroundColor: 'rgba(245,166,35,0.12)', tension: 0.3, fill: true, pointRadius: 3 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } } }
  }));

  var el2 = document.getElementById('chartProf');
  if (el2) _activeCharts.push(new Chart(el2, {
    type: 'bar',
    data: {
      labels: (d.professionBreakdown||[]).map(function(p){return p.profession;}),
      datasets: [{ data: (d.professionBreakdown||[]).map(function(p){return p.count;}), backgroundColor: gold, borderRadius: 6 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } } }
  }));

  var el3 = document.getElementById('chartRegion');
  if (el3) {
    var rLabels = (d.regionBreakdown||[]).map(function(r){return r.region;});
    var rData = (d.regionBreakdown||[]).map(function(r){return r.count;});
    _activeCharts.push(new Chart(el3, {
      type: 'doughnut',
      data: { labels: rLabels, datasets: [{ data: rData, backgroundColor: colors.slice(0, rLabels.length) }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } } } }
    }));
  }

  var el4 = document.getElementById('chartJR');
  if (el4) _activeCharts.push(new Chart(el4, {
    type: 'line',
    data: {
      labels: (d.jobRequestsPerDay||[]).map(function(r){return r.date.slice(5);}),
      datasets: [{ data: (d.jobRequestsPerDay||[]).map(function(r){return r.count;}),
        borderColor: blue, backgroundColor: 'rgba(52,152,219,0.12)', tension: 0.3, fill: true, pointRadius: 3 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } } }
  }));
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatStatus(s) {
  var map = { active:'<span class="badge badge-approved">Faol</span>', banned:'<span class="badge badge-rejected">Bloklangan</span>',
    pending:'<span class="badge badge-pending">Kutmoqda</span>', approved:'<span class="badge badge-approved">Tasdiqlangan</span>',
    rejected:'<span class="badge badge-rejected">Rad etilgan</span>' };
  return map[s] || s;
}

function translateUserType(type) {
  var types = { 'worker': 'Usta', 'shop': "Do'kon", 'customer': 'Mijoz' };
  return types[type] || type;
}

// ── USERS ──
function loadUsers() {
  fetch('/api/admin/users').then(function(r) { return r.json(); }).then(function(d) {
    var users = d.users || [];
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">👤 Foydalanuvchilar (' + users.length + ')</h2>' +
        '<input class="admin-search" placeholder="Ism yoki telefon..." oninput="filterRows(\'usersTable\', this.value)">' +
      '</div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Ism</th><th>Telefon</th><th>Tur</th><th>Viloyat</th><th>Holat</th><th>Sana</th><th>Amallar</th></tr></thead>' +
      '<tbody id="usersTable">' +
      users.map(function(u) {
        return '<tr>' +
          '<td>' + u.id + '</td><td>' + escHtml(u.name) + '</td><td>' + escHtml(u.phone) + '</td>' +
          '<td>' + translateUserType(u.user_type) + '</td><td>' + escHtml(u.region||'') + '</td>' +
          '<td>' + formatStatus(u.status) + '</td><td>' + formatDate(u.created_at) + '</td>' +
          '<td style="display:flex;gap:4px;flex-wrap:wrap">' +
            (u.status === 'active'
              ? '<button class="btn btn-sm btn-danger" onclick="banUser(' + u.id + ')">Ban</button>'
              : '<button class="btn btn-sm btn-success" onclick="unbanUser(' + u.id + ')">Unban</button>') +
            '<button class="btn btn-sm btn-secondary" onclick="deleteUser(' + u.id + ')">🗑</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function banUser(id) {
  if (!confirm(t('confirmBan'))) return;
  fetch('/api/admin/users/' + id + '/ban', { method: 'PUT' }).then(function() { showToast(t('banSuccess'), 'success'); loadUsers(); loadStats(); });
}
function unbanUser(id) {
  fetch('/api/admin/users/' + id + '/unban', { method: 'PUT' }).then(function() { showToast(t('unbanSuccess'), 'success'); loadUsers(); loadStats(); });
}
function deleteUser(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/admin/users/' + id, { method: 'DELETE' }).then(function() { showToast("O'chirildi", 'success'); loadUsers(); loadStats(); });
}

// ── WORKER SUBMISSIONS ──
function loadWorkerSubs() {
  fetch('/api/admin/worker-submissions').then(function(r) { return r.json(); }).then(function(d) {
    _wSubs = d.submissions || [];
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">🔨 Usta arizalari</h2></div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Ism</th><th>Kasb</th><th>Viloyat</th><th>Telefon</th><th>Tajriba</th><th>Holat</th><th style="text-align:center">Amallar</th></tr></thead>' +
      '<tbody>' +
      _wSubs.map(function(s) {
        var actions = '';
        if (s.status === 'pending') {
          actions = '<button class="btn btn-sm btn-success" onclick="approveWSub(' + s.id + ')" style="white-space:nowrap">✓ Tasdiqlash</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="rejectWSub(' + s.id + ')" style="white-space:nowrap">✕ Rad etish</button>';
        } else if (s.status === 'rejected') {
          actions = '<button class="btn btn-sm" style="background:#1a1a2e;color:#fff;white-space:nowrap" onclick="openWSubReconsider(' + s.id + ')">↩ Qayta ko\'rib chiqish</button>';
        } else if (s.status === 'approved') {
          actions = '<span style="color:#27ae60;font-size:13px;font-weight:600;white-space:nowrap">✓ Tasdiqlangan</span>' +
                    '<button class="btn btn-sm btn-danger" onclick="revokeWSub(' + s.id + ')" style="white-space:nowrap;margin-left:6px">Bekor qilish</button>';
        }
        return '<tr style="height:56px">' +
          '<td style="vertical-align:middle">' + s.id + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.name) + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.profession) + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.region||'') + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.phone||'') + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.experience||'') + '</td>' +
          '<td style="vertical-align:middle">' + formatStatus(s.status) + '</td>' +
          '<td style="text-align:center;vertical-align:middle;white-space:nowrap">' +
            '<div style="display:inline-flex;align-items:center;justify-content:center;gap:6px">' + actions + '</div>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function approveWSub(id) {
  fetch('/api/admin/worker-submissions/' + id + '/approve', { method: 'PUT' }).then(function() { showToast(t('approveSuccess'), 'success'); loadWorkerSubs(); loadStats(); });
}
function rejectWSub(id) {
  fetch('/api/admin/worker-submissions/' + id + '/reject', { method: 'PUT' }).then(function() { showToast(t('rejectSuccess'), 'success'); loadWorkerSubs(); loadStats(); });
}
function revokeWSub(id) {
  if (!confirm("Bu ustaning tasdiqlashini bekor qilasizmi?")) return;
  fetch('/api/admin/worker-submissions/' + id + '/revoke', { method: 'POST' })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { showToast('Bekor qilindi', 'success'); loadWorkerSubs(); loadStats(); }
      else { showToast(t('errorGeneric'), 'error'); }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function openWSubReconsider(id) {
  var s = (_wSubs || []).find(function(x) { return x.id === id; });
  if (!s) return;
  var existing = document.getElementById('reconsiderOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'reconsiderOverlay';
  overlay.className = 'modal-overlay open';
  overlay.innerHTML =
    '<div class="modal" style="max-width:520px;max-height:85vh;overflow-y:auto">' +
      '<button class="modal-close" onclick="document.getElementById(\'reconsiderOverlay\').remove()">✕</button>' +
      '<div style="background:#fdf3f0;border:1px solid #e74c3c;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.85rem;color:#c0392b">⚠️ Bu ariza avval rad etilgan</div>' +
      '<div class="modal-title">Arizani qayta ko\'rib chiqish</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.88rem">' +
        _subRow('Ism', s.name) + _subRow('Kasb', s.profession) +
        _subRow('Viloyat', s.region) + _subRow('Shahar', s.city) +
        _subRow('Telefon', s.phone) + _subRow('Telegram', s.telegram) +
        _subRow('Instagram', s.instagram) + _subRow('Tajriba', s.experience) +
        _subRow('Tavsif', s.description) + _subRow('Ariza sanasi', formatDate(s.created_at)) +
      '</table>' +
      '<div style="display:flex;gap:8px;margin-top:20px">' +
        '<button class="btn btn-secondary" style="flex:1" onclick="document.getElementById(\'reconsiderOverlay\').remove()">Yopish</button>' +
        '<button class="btn btn-success" style="flex:2" onclick="reconsiderWSub(' + s.id + ')">✓ Tasdiqlash</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function _subRow(label, value) {
  return '<tr><td style="padding:6px 8px;font-weight:600;color:#666;width:35%;border-bottom:1px solid #f0f0f0">' + escHtml(label) + '</td>' +
         '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">' + escHtml(String(value || '—')) + '</td></tr>';
}

function reconsiderWSub(id) {
  fetch('/api/admin/worker-submissions/' + id + '/reconsider', { method: 'PUT' })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        var overlay = document.getElementById('reconsiderOverlay');
        if (overlay) overlay.remove();
        showToast('Usta muvaffaqiyatli tasdiqlandi ✓', 'success');
        loadWorkerSubs(); loadStats();
      } else {
        showToast(t('errorGeneric'), 'error');
      }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

// ── SHOP SUBMISSIONS ──
function loadShopSubs() {
  fetch('/api/admin/shop-submissions').then(function(r) { return r.json(); }).then(function(d) {
    _sSubs = d.submissions || [];
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">🏪 Do\'kon arizalari</h2></div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Do\'kon</th><th>Egasi</th><th>Telefon</th><th>Viloyat</th><th>Holat</th><th style="text-align:center">Amallar</th></tr></thead>' +
      '<tbody>' +
      _sSubs.map(function(s) {
        var actions = '';
        if (s.status === 'pending') {
          actions = '<button class="btn btn-sm btn-success" onclick="approveSSub(' + s.id + ')" style="white-space:nowrap">✓ Tasdiqlash</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="rejectSSub(' + s.id + ')" style="white-space:nowrap">✕ Rad etish</button>';
        } else if (s.status === 'rejected') {
          actions = '<button class="btn btn-sm" style="background:#1a1a2e;color:#fff;white-space:nowrap" onclick="openSSubReconsider(' + s.id + ')">↩ Qayta ko\'rib chiqish</button>';
        } else if (s.status === 'approved') {
          actions = '<button class="btn btn-sm btn-secondary" style="white-space:nowrap" onclick="revokeSSub(' + s.id + ')">✕ Bekor qilish</button>';
        }
        return '<tr style="height:56px">' +
          '<td style="vertical-align:middle">' + s.id + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.shop_name) + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.owner_name) + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.phone||'') + '</td>' +
          '<td style="vertical-align:middle">' + escHtml(s.region||'') + '</td>' +
          '<td style="vertical-align:middle">' + formatStatus(s.status) + '</td>' +
          '<td style="text-align:center;vertical-align:middle;white-space:nowrap">' +
            '<div style="display:inline-flex;align-items:center;justify-content:center;gap:6px">' + actions + '</div>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function approveSSub(id) {
  fetch('/api/admin/shop-submissions/' + id + '/approve', { method: 'PUT' }).then(function() { showToast(t('approveSuccess'), 'success'); loadShopSubs(); loadStats(); });
}
function rejectSSub(id) {
  fetch('/api/admin/shop-submissions/' + id + '/reject', { method: 'PUT' }).then(function() { showToast(t('rejectSuccess'), 'success'); loadShopSubs(); loadStats(); });
}
function revokeSSub(id) {
  if (!confirm("Do'konni tasdiqlamaslik? Egasi kirish imkoniyatini yo'qotadi.")) return;
  fetch('/api/admin/shop-submissions/' + id + '/revoke', { method: 'PUT' }).then(function() { showToast("Bekor qilindi", 'success'); loadShopSubs(); loadStats(); });
}

function openSSubReconsider(id) {
  var s = (_sSubs || []).find(function(x) { return x.id === id; });
  if (!s) return;
  var existing = document.getElementById('reconsiderOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'reconsiderOverlay';
  overlay.className = 'modal-overlay open';
  overlay.innerHTML =
    '<div class="modal" style="max-width:520px;max-height:85vh;overflow-y:auto">' +
      '<button class="modal-close" onclick="document.getElementById(\'reconsiderOverlay\').remove()">✕</button>' +
      '<div style="background:#fdf3f0;border:1px solid #e74c3c;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.85rem;color:#c0392b">⚠️ Bu ariza avval rad etilgan</div>' +
      '<div class="modal-title">Do\'kon arizasini qayta ko\'rib chiqish</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.88rem">' +
        _subRow("Do'kon nomi", s.shop_name) + _subRow('Egasi', s.owner_name) +
        _subRow('Telefon', s.phone) + _subRow('Telegram', s.telegram) +
        _subRow('Instagram', s.instagram) +
        _subRow('Viloyat', s.region) + _subRow('Shahar', s.city) +
        _subRow('Tavsif', s.description) + _subRow('Ariza sanasi', formatDate(s.created_at)) +
      '</table>' +
      '<div style="display:flex;gap:8px;margin-top:20px">' +
        '<button class="btn btn-secondary" style="flex:1" onclick="document.getElementById(\'reconsiderOverlay\').remove()">Yopish</button>' +
        "<button class=\"btn btn-success\" style=\"flex:2\" onclick=\"reconsiderSSub(" + s.id + ")\">✓ Tasdiqlash</button>" +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function reconsiderSSub(id) {
  fetch('/api/admin/shop-submissions/' + id + '/reconsider', { method: 'PUT' })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        var overlay = document.getElementById('reconsiderOverlay');
        if (overlay) overlay.remove();
        showToast("Do'kon muvaffaqiyatli tasdiqlandi ✓", 'success');
        loadShopSubs(); loadStats();
      } else {
        showToast(t('errorGeneric'), 'error');
      }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

// ── WORKERS ──
function loadWorkers() {
  fetch('/api/admin/workers').then(function(r) { return r.json(); }).then(function(d) {
    var workers = d.workers || [];
    var featuredCount = workers.filter(function(w) { return w.is_featured; }).length;
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">⚒️ Ustalar</h2>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<span style="font-size:0.82rem;color:#F07020;font-weight:700;background:rgba(240,112,32,0.1);padding:4px 12px;border-radius:20px;border:1px solid rgba(240,112,32,0.3)">📌 Pinlangan: ' + featuredCount + '/3</span>' +
          '<input class="admin-search" placeholder="Ism yoki kasb..." oninput="filterRows(\'workersTable\', this.value)">' +
          '<button class="btn btn-primary btn-sm" onclick="openWorkerModal()">+ Qo\'shish</button>' +
        '</div>' +
      '</div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Ism</th><th>Kasb</th><th>Viloyat</th><th>Telefon</th><th>Reyting</th><th>Pin</th><th>Tekshirilgan</th><th>Amallar</th></tr></thead>' +
      '<tbody id="workersTable">' +
      workers.map(function(w) {
        var pinBtn = w.is_featured
          ? '<button class="btn btn-sm" style="background:#F07020;color:#fff;white-space:nowrap" onclick="unfeatureWorker(' + w.id + ')">📌 #' + w.featured_order + ' Pinlangan ✓</button>'
          : '<button class="btn btn-sm btn-secondary" style="white-space:nowrap" onclick="featureWorker(' + w.id + ')" ' + (featuredCount >= 3 ? 'disabled title="Maksimal 3 ta"' : '') + '>📌 Pinlash</button>';
        var verifyBtn = w.is_verified
          ? '<button class="btn btn-sm" style="background:#27ae60;color:#fff;white-space:nowrap" onclick="unverifyWorker(' + w.id + ')">✓ Tasdiqlangan</button>'
          : '<button class="btn btn-sm btn-secondary" style="white-space:nowrap" onclick="verifyWorker(' + w.id + ')">Tasdiqlash</button>';
        return '<tr>' +
          '<td>' + w.id + '</td><td>' + escHtml(w.name) + '</td><td>' + escHtml(w.profession) + '</td>' +
          '<td>' + escHtml(w.region||'') + '</td><td>' + escHtml(w.phone||'') + '</td>' +
          '<td>⭐ ' + (w.rating||0).toFixed(1) + '</td>' +
          '<td>' + pinBtn + '</td>' +
          '<td>' + verifyBtn + '</td>' +
          '<td style="display:flex;gap:4px">' +
            '<button class="btn btn-sm btn-secondary" onclick="editWorker(' + w.id + ')">✏️</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteWorker(' + w.id + ')">🗑</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function featureWorker(id) {
  fetch('/api/admin/workers/' + id + '/feature', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { showToast('Usta pinlandi 📌', 'success'); loadWorkers(); }
      else { showToast(d.message || 'Maksimal 3 ta usta pinlanishi mumkin', 'error'); }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function unfeatureWorker(id) {
  fetch('/api/admin/workers/' + id + '/unfeature', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { showToast('Pin olib tashlandi', 'success'); loadWorkers(); }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function verifyWorker(id) {
  fetch('/api/admin/workers/' + id + '/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { showToast("Usta shaxsi tasdiqlandi ✓", 'success'); loadWorkers(); }
      else { showToast(t('errorGeneric'), 'error'); }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function unverifyWorker(id) {
  fetch('/api/admin/workers/' + id + '/unverify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { showToast("Tasdiq olib tashlandi", 'success'); loadWorkers(); }
    }).catch(function() { showToast(t('errorGeneric'), 'error'); });
}

function openWorkerModal() {
  document.getElementById('workerModalTitle').textContent = t('addWorker');
  document.getElementById('wEditId').value = '';
  document.getElementById('wName').value = ''; document.getElementById('wExp').value = '';
  document.getElementById('wDesc').value = ''; document.getElementById('wCity').value = '';
  document.getElementById('wTelegram').value = ''; document.getElementById('wInstagram').value = '';
  document.getElementById('wRating').value = '';
  document.getElementById('wError').textContent = '';
  document.getElementById('workerModal').classList.add('open');
}

function editWorker(id) {
  fetch('/api/admin/workers').then(function(r) { return r.json(); }).then(function(d) {
    var w = d.workers.find(function(x) { return x.id === id; });
    if (!w) return;
    document.getElementById('workerModalTitle').textContent = t('editWorker');
    document.getElementById('wEditId').value = w.id;
    document.getElementById('wName').value = w.name || '';
    document.getElementById('wProf').value = w.profession || '';
    document.getElementById('wExp').value = w.experience || '';
    document.getElementById('wDesc').value = w.description || '';
    document.getElementById('wRegion').value = w.region || '';
    document.getElementById('wCity').value = w.city || '';
    document.getElementById('wTelegram').value = w.telegram || '';
    document.getElementById('wInstagram').value = w.instagram || '';
    document.getElementById('wRating').value = w.rating || '';
    if (w.phone) setPhoneValue(document.getElementById('wPhone'), w.phone);
    document.getElementById('wError').textContent = '';
    document.getElementById('workerModal').classList.add('open');
  });
}

function saveWorker() {
  var editId = document.getElementById('wEditId').value;
  var name = document.getElementById('wName').value.trim();
  var prof = document.getElementById('wProf').value;
  if (!name || !prof) { document.getElementById('wError').textContent = t('requiredFields'); return; }
  var data = {
    name: name, profession: prof,
    experience: document.getElementById('wExp').value.trim(),
    description: document.getElementById('wDesc').value.trim(),
    region: document.getElementById('wRegion').value,
    city: document.getElementById('wCity').value.trim(),
    phone: getPhoneRaw(document.getElementById('wPhone')),
    telegram: document.getElementById('wTelegram').value.trim(),
    instagram: document.getElementById('wInstagram').value.trim(),
    rating: document.getElementById('wRating').value
  };
  var url = editId ? '/api/admin/workers/' + editId : '/api/admin/workers';
  var method = editId ? 'PUT' : 'POST';
  fetch(url, { method: method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { closeModal('workerModal'); showToast(t('savedSuccess'), 'success'); loadWorkers(); loadStats(); }
      else document.getElementById('wError').textContent = t('errorGeneric');
    });
}

function deleteWorker(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/admin/workers/' + id, { method: 'DELETE' }).then(function() { showToast("O'chirildi", 'success'); loadWorkers(); loadStats(); });
}

// ── PRODUCTS ──
function loadProducts() {
  fetch('/api/admin/products').then(function(r) { return r.json(); }).then(function(d) {
    var products = d.products || [];
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">📦 Mahsulotlar</h2>' +
        '<div style="display:flex;gap:8px">' +
          '<input class="admin-search" placeholder="Nom yoki sotuvchi..." oninput="filterRows(\'productsTable\', this.value)">' +
          '<button class="btn btn-primary btn-sm" onclick="openProductModal()">+ Qo\'shish</button>' +
        '</div>' +
      '</div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Nomi</th><th>Narx</th><th>Sotuvchi</th><th>Telefon</th><th>Turi</th><th>Amallar</th></tr></thead>' +
      '<tbody id="productsTable">' +
      products.map(function(p) {
        var price = parseFloat(p.price);
        var priceStr = !isNaN(price) ? price.toLocaleString('uz-UZ') + " so'm" : escHtml(p.price);
        return '<tr>' +
          '<td>' + p.id + '</td><td>' + escHtml(p.product_name) + '</td><td>' + priceStr + '</td>' +
          '<td>' + escHtml(p.seller||'') + '</td><td>' + escHtml(p.seller_phone||'') + '</td>' +
          '<td>' + escHtml(p.product_type||'') + '</td>' +
          '<td style="display:flex;gap:4px">' +
            '<button class="btn btn-sm btn-secondary" onclick="editProduct(' + p.id + ')">✏️</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteProduct(' + p.id + ')">🗑</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function openProductModal() {
  document.getElementById('productModalTitle').textContent = t('addProduct');
  document.getElementById('pEditId').value = '';
  document.getElementById('pName').value = ''; document.getElementById('pPrice').value = '';
  document.getElementById('pType').value = ''; document.getElementById('pSeller').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('pPhone').value = '';
  document.getElementById('pError').textContent = '';
  document.getElementById('productModal').classList.add('open');
}

function editProduct(id) {
  fetch('/api/admin/products').then(function(r) { return r.json(); }).then(function(d) {
    var p = d.products.find(function(x) { return x.id === id; });
    if (!p) return;
    document.getElementById('productModalTitle').textContent = t('editProduct');
    document.getElementById('pEditId').value = p.id;
    document.getElementById('pName').value = p.product_name || '';
    document.getElementById('pPrice').value = p.price || '';
    document.getElementById('pType').value = p.product_type || '';
    document.getElementById('pSeller').value = p.seller || '';
    document.getElementById('pDesc').value = p.description || '';
    if (p.seller_phone) setPhoneValue(document.getElementById('pPhone'), p.seller_phone);
    document.getElementById('pError').textContent = '';
    document.getElementById('productModal').classList.add('open');
  });
}

function saveProduct() {
  var editId = document.getElementById('pEditId').value;
  var name = document.getElementById('pName').value.trim();
  var price = document.getElementById('pPrice').value.trim();
  if (!name || !price) { document.getElementById('pError').textContent = t('nameAndPriceRequired'); return; }
  var data = {
    product_name: name, price: price,
    product_type: document.getElementById('pType').value,
    seller_phone: getPhoneRaw(document.getElementById('pPhone')),
    description: document.getElementById('pDesc').value.trim()
  };
  var url = editId ? '/api/admin/products/' + editId : '/api/admin/products';
  var method = editId ? 'PUT' : 'POST';
  fetch(url, { method: method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    .then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { closeModal('productModal'); showToast(t('savedSuccess'), 'success'); loadProducts(); loadStats(); }
      else document.getElementById('pError').textContent = t('errorGeneric');
    });
}

function deleteProduct(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/admin/products/' + id, { method: 'DELETE' }).then(function() { showToast("O'chirildi", 'success'); loadProducts(); loadStats(); });
}

// ── JOB REQUESTS ──
function loadJobReqs() {
  fetch('/api/admin/job-requests').then(function(r) { return r.json(); }).then(function(d) {
    var reqs = d.requests || [];
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">📋 Buyurtmalar</h2>' +
        '<input class="admin-search" placeholder="Sarlavha..." oninput="filterRows(\'jrTable\', this.value)">' +
      '</div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Sarlavha</th><th>Kasb</th><th>Viloyat</th><th>Telefon</th><th>Holat</th><th>Sana</th><th>Amallar</th></tr></thead>' +
      '<tbody id="jrTable">' +
      reqs.map(function(r) {
        return '<tr>' +
          '<td>' + r.id + '</td><td>' + escHtml(r.title) + '</td><td>' + escHtml(r.profession_needed||'') + '</td>' +
          '<td>' + escHtml(r.region||'') + '</td><td>' + escHtml(r.phone||'') + '</td>' +
          '<td>' + formatStatus(r.status) + '</td><td>' + formatDate(r.created_at) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteJR(' + r.id + ')">🗑</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function deleteJR(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/admin/job-requests/' + id, { method: 'DELETE' }).then(function() { showToast("O'chirildi", 'success'); loadJobReqs(); });
}

// ── RATINGS ──
function loadRatings() {
  fetch('/api/admin/ratings').then(function(r) { return r.json(); }).then(function(d) {
    var ratings = d.ratings || [];
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">⭐ Sharhlar</h2></div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Usta</th><th>Mijoz</th><th>Yulduz</th><th>Sharh</th><th>Sana</th><th>Amallar</th></tr></thead>' +
      '<tbody>' +
      ratings.map(function(r) {
        return '<tr>' +
          '<td>' + r.id + '</td><td>' + escHtml(r.worker_name||'') + '</td><td>' + escHtml(r.customer_name||'') + '</td>' +
          '<td>★ ' + r.stars + '</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(r.review) + '</td>' +
          '<td>' + formatDate(r.created_at) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteRating(' + r.id + ')">🗑</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function deleteRating(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/admin/ratings/' + id, { method: 'DELETE' }).then(function() { showToast("O'chirildi", 'success'); loadRatings(); loadStats(); });
}

// ── JOB RESPONSES ──
function loadResponses() {
  fetch('/api/admin/job-responses').then(function(r) { return r.json(); }).then(function(d) {
    var responses = d.responses || [];
    document.getElementById('adminContent').innerHTML =
      '<div class="admin-toolbar"><h2 class="admin-panel-title">💬 Javoblar</h2></div>' +
      '<div class="data-table"><table><thead><tr><th>ID</th><th>Buyurtma</th><th>Usta</th><th>Xabar</th><th>Sana</th><th>Amallar</th></tr></thead>' +
      '<tbody>' +
      responses.map(function(r) {
        return '<tr>' +
          '<td>' + r.id + '</td><td>' + escHtml(r.job_title||'') + '</td><td>' + escHtml(r.worker_name||'') + '</td>' +
          '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(r.message) + '</td>' +
          '<td>' + formatDate(r.created_at) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteResponse(' + r.id + ')">🗑</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  });
}

function deleteResponse(id) {
  if (!confirm(t('confirmDelete'))) return;
  fetch('/api/admin/job-responses/' + id, { method: 'DELETE' }).then(function() { showToast("O'chirildi", 'success'); loadResponses(); });
}

// ── UTILS ──
function filterRows(tableId, query) {
  var rows = document.querySelectorAll('#' + tableId + ' tr');
  var q = query.toLowerCase();
  rows.forEach(function(row) {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function doLogout() {
  fetch('/api/auth/logout', { method: 'POST' }).then(function() { window.location.href = '/'; });
}
