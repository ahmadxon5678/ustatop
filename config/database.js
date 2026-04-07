const Database = require('better-sqlite3');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const db = new Database(path.join(DATA_DIR, 'database.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT '',
    region TEXT,
    city TEXT,
    additional_info TEXT,
    user_type TEXT NOT NULL CHECK(user_type IN ('customer','worker','shop')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active','banned')),
    language TEXT DEFAULT 'uz',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    profession TEXT NOT NULL,
    experience TEXT,
    description TEXT,
    region TEXT,
    city TEXT,
    phone TEXT,
    telegram TEXT,
    instagram TEXT,
    rating REAL DEFAULT 0,
    availability_status TEXT DEFAULT 'available' CHECK(availability_status IN ('available','busy')),
    approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS worker_portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS worker_availability_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('available','busy'))
  );

  CREATE TABLE IF NOT EXISTS worker_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT,
    telegram TEXT,
    region TEXT,
    city TEXT,
    description TEXT,
    product_types TEXT,
    approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER REFERENCES shops(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT,
    product_type TEXT,
    seller_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    profession_needed TEXT,
    region TEXT,
    city TEXT,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','deleted')),
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_request_id INTEGER REFERENCES job_requests(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_response_id INTEGER REFERENCES job_responses(id),
    stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    review TEXT NOT NULL,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, customer_id)
  );

  CREATE TABLE IF NOT EXISTS product_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    review TEXT NOT NULL,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, worker_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_uz TEXT NOT NULL,
    message_ru TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS worker_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    name TEXT, profession TEXT, region TEXT, city TEXT,
    experience TEXT, description TEXT, phone TEXT,
    telegram TEXT, instagram TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shop_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    shop_name TEXT, owner_name TEXT, phone TEXT,
    telegram TEXT, region TEXT, city TEXT,
    description TEXT, product_types TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Migration: fix notifications table if it has old 'message' NOT NULL column ──
try {
  const notifCols = db.prepare('PRAGMA table_info(notifications)').all();
  const msgCol = notifCols.find(c => c.name === 'message');
  if (msgCol && msgCol.notnull) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_uz TEXT NOT NULL DEFAULT '',
        message_ru TEXT NOT NULL DEFAULT '',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO notifications_new (id, user_id, message_uz, message_ru, is_read, created_at)
        SELECT id, user_id,
          COALESCE(NULLIF(message_uz,''), message, ''),
          COALESCE(NULLIF(message_ru,''), message, ''),
          is_read, created_at FROM notifications;
      DROP TABLE notifications;
      ALTER TABLE notifications_new RENAME TO notifications;
    `);
    console.log('Notifications table migrated successfully');
  }
} catch (e) {
  console.error('Notifications migration error:', e.message);
}

// ── Migration: add created_at to worker_portfolio if missing ──
try {
  const portfolioCols = db.prepare('PRAGMA table_info(worker_portfolio)').all();
  if (!portfolioCols.find(c => c.name === 'created_at')) {
    db.exec(`ALTER TABLE worker_portfolio ADD COLUMN created_at DATETIME DEFAULT NULL`);
    console.log('worker_portfolio: added created_at column');
  }
} catch (e) {
  console.error('worker_portfolio migration error:', e.message);
}

// ── Migration: add instagram to shops and shop_submissions if missing ──
try {
  const shopCols = db.prepare('PRAGMA table_info(shops)').all();
  if (!shopCols.find(c => c.name === 'instagram')) {
    db.exec(`ALTER TABLE shops ADD COLUMN instagram TEXT`);
    console.log('shops: added instagram column');
  }
  const subCols = db.prepare('PRAGMA table_info(shop_submissions)').all();
  if (!subCols.find(c => c.name === 'instagram')) {
    db.exec(`ALTER TABLE shop_submissions ADD COLUMN instagram TEXT`);
    console.log('shop_submissions: added instagram column');
  }
} catch (e) {
  console.error('shops instagram migration error:', e.message);
}

// ── Migration: add last_seen, is_featured, featured_order to workers ──
try {
  const workerCols = db.prepare('PRAGMA table_info(workers)').all();
  if (!workerCols.find(c => c.name === 'last_seen')) {
    db.exec(`ALTER TABLE workers ADD COLUMN last_seen DATETIME DEFAULT NULL`);
    console.log('workers: added last_seen column');
  }
  if (!workerCols.find(c => c.name === 'is_featured')) {
    db.exec(`ALTER TABLE workers ADD COLUMN is_featured INTEGER DEFAULT 0`);
    console.log('workers: added is_featured column');
  }
  if (!workerCols.find(c => c.name === 'featured_order')) {
    db.exec(`ALTER TABLE workers ADD COLUMN featured_order INTEGER DEFAULT 0`);
    console.log('workers: added featured_order column');
  }
} catch (e) {
  console.error('Workers columns migration error:', e.message);
}

// ── Cleanup: remove job_requests_new if it exists from a failed migration ──
try {
  db.exec('DROP TABLE IF EXISTS job_requests_new');
} catch (e) {}

// ── Migration: add urgent + budget fields to job_requests ──
try {
  const jrCols = db.prepare('PRAGMA table_info(job_requests)').all();
  if (!jrCols.find(c => c.name === 'is_urgent')) {
    db.exec('ALTER TABLE job_requests ADD COLUMN is_urgent INTEGER DEFAULT 0');
    console.log('job_requests: added is_urgent column');
  }
  if (!jrCols.find(c => c.name === 'budget_from')) {
    db.exec('ALTER TABLE job_requests ADD COLUMN budget_from INTEGER DEFAULT NULL');
    console.log('job_requests: added budget_from column');
  }
  if (!jrCols.find(c => c.name === 'budget_to')) {
    db.exec('ALTER TABLE job_requests ADD COLUMN budget_to INTEGER DEFAULT NULL');
    console.log('job_requests: added budget_to column');
  }
} catch (e) {
  console.error('job_requests urgent migration error:', e.message);
}

// ── Migration: add is_verified + verified_at to workers ──
try {
  const wCols = db.prepare('PRAGMA table_info(workers)').all();
  if (!wCols.find(c => c.name === 'is_verified')) {
    db.exec('ALTER TABLE workers ADD COLUMN is_verified INTEGER DEFAULT 0');
    console.log('workers: added is_verified column');
  }
  if (!wCols.find(c => c.name === 'verified_at')) {
    db.exec('ALTER TABLE workers ADD COLUMN verified_at DATETIME DEFAULT NULL');
    console.log('workers: added verified_at column');
  }
} catch (e) {
  console.error('workers verified migration error:', e.message);
}

// ── Migration: add is_ustoz to workers ──
try {
  const wColsUstoz = db.prepare('PRAGMA table_info(workers)').all();
  if (!wColsUstoz.find(c => c.name === 'is_ustoz')) {
    db.exec('ALTER TABLE workers ADD COLUMN is_ustoz INTEGER DEFAULT 0');
    console.log('workers: added is_ustoz column');
  }
} catch (e) {
  console.error('workers is_ustoz migration error:', e.message);
}

// ── Migration: add rating (REAL) to products ──
try {
  const productCols = db.prepare('PRAGMA table_info(products)').all();
  if (!productCols.find(c => c.name === 'rating')) {
    db.exec('ALTER TABLE products ADD COLUMN rating REAL DEFAULT 0');
    console.log('products: added rating column');
  }
} catch (e) {
  console.error('products rating migration error:', e.message);
}

// ── Migration: add price fields to job_responses ──
try {
  const jresCols = db.prepare('PRAGMA table_info(job_responses)').all();
  if (!jresCols.find(c => c.name === 'price_from')) {
    db.exec('ALTER TABLE job_responses ADD COLUMN price_from INTEGER DEFAULT NULL');
    console.log('job_responses: added price_from column');
  }
  if (!jresCols.find(c => c.name === 'price_to')) {
    db.exec('ALTER TABLE job_responses ADD COLUMN price_to INTEGER DEFAULT NULL');
    console.log('job_responses: added price_to column');
  }
  if (!jresCols.find(c => c.name === 'price_note')) {
    db.exec('ALTER TABLE job_responses ADD COLUMN price_note TEXT DEFAULT NULL');
    console.log('job_responses: added price_note column');
  }
} catch (e) {
  console.error('job_responses price migration error:', e.message);
}

module.exports = db;
