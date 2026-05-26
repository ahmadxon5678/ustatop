-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "region" TEXT,
    "city" TEXT,
    "additional_info" TEXT,
    "user_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "language" TEXT NOT NULL DEFAULT 'uz',
    "instagram_username" TEXT,
    "telegram_username" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "workers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "experience" TEXT,
    "description" TEXT,
    "region" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "telegram" TEXT,
    "instagram" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "availability_status" TEXT NOT NULL DEFAULT 'available',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "last_seen" DATETIME,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_order" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" DATETIME,
    "is_ustoz" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_portfolio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worker_id" INTEGER,
    "image_url" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_portfolio_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_availability_calendar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worker_id" INTEGER,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "worker_availability_calendar_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_views" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worker_id" INTEGER,
    "user_id" INTEGER,
    "viewed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_views_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worker_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shops" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "shop_name" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "phone" TEXT,
    "telegram" TEXT,
    "instagram" TEXT,
    "region" TEXT,
    "city" TEXT,
    "description" TEXT,
    "product_types" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shops_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop_id" INTEGER,
    "product_name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "description" TEXT,
    "product_type" TEXT,
    "seller_phone" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "profession_needed" TEXT,
    "region" TEXT,
    "city" TEXT,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" DATETIME,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "budget_from" INTEGER,
    "budget_to" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_responses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "job_request_id" INTEGER,
    "worker_id" INTEGER,
    "message" TEXT NOT NULL,
    "price_from" INTEGER,
    "price_to" INTEGER,
    "price_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_responses_job_request_id_fkey" FOREIGN KEY ("job_request_id") REFERENCES "job_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_responses_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worker_id" INTEGER,
    "customer_id" INTEGER,
    "job_response_id" INTEGER,
    "stars" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "photo" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ratings_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ratings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ratings_job_response_id_fkey" FOREIGN KEY ("job_response_id") REFERENCES "job_responses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER,
    "user_id" INTEGER,
    "stars" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "photo" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "worker_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookmarks_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "message_uz" TEXT NOT NULL,
    "message_ru" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_submissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "name" TEXT,
    "profession" TEXT,
    "region" TEXT,
    "city" TEXT,
    "experience" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "telegram" TEXT,
    "instagram" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shop_submissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "shop_name" TEXT,
    "owner_name" TEXT,
    "phone" TEXT,
    "telegram" TEXT,
    "instagram" TEXT,
    "region" TEXT,
    "city" TEXT,
    "description" TEXT,
    "product_types" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "workers_user_id_key" ON "workers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_user_id_key" ON "shops"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_worker_id_customer_id_key" ON "ratings"("worker_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_product_id_user_id_key" ON "product_reviews"("product_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_worker_id_key" ON "bookmarks"("user_id", "worker_id");
