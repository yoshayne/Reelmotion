import { query } from "./db.js";

export async function runMigrations() {
  console.log("Running DB migrations...");

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'viewer',
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS series (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      cover_image_url TEXT,
      carousel_image_url TEXT,
      hero_image_url TEXT,
      thumbnail_url TEXT,
      genre TEXT,
      director TEXT,
      cast TEXT,
      content_rating TEXT,
      release_date DATE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      content_type TEXT NOT NULL DEFAULT 'movie',
      mux_asset_id TEXT,
      mux_playback_id TEXT,
      mux_duration REAL,
      thumbnail_url TEXT,
      hero_image_url TEXT,
      carousel_image_url TEXT,
      genre TEXT,
      director TEXT,
      cast TEXT,
      content_rating TEXT,
      release_date DATE,
      is_free BOOLEAN NOT NULL DEFAULT false,
      is_published BOOLEAN NOT NULL DEFAULT false,
      series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
      season_number INTEGER,
      episode_number INTEGER,
      intro_start_seconds REAL,
      intro_end_seconds REAL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT UNIQUE,
      plan TEXT,
      status TEXT NOT NULL DEFAULT 'inactive',
      period_start_date TIMESTAMPTZ,
      period_end_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, video_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS playback_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
      last_position_seconds REAL NOT NULL DEFAULT 0,
      completed BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, video_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS carousel_items (
      id SERIAL PRIMARY KEY,
      title TEXT,
      description TEXT,
      image_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      video_id INTEGER REFERENCES videos(id) ON DELETE SET NULL,
      series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
      release_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS brand_assets (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      file_key TEXT NOT NULL DEFAULT '',
      content_type TEXT,
      file_size BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS abandoned_signups (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS contest_submissions (
      id SERIAL PRIMARY KEY,
      film_title TEXT,
      runtime TEXT,
      genre TEXT,
      viewing_link TEXT,
      password TEXT,
      trailer_link TEXT,
      director_name TEXT,
      email TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      instagram_handle TEXT,
      video_url TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS promo_popups (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      image_key TEXT,
      link_type TEXT,
      link_video_id INTEGER REFERENCES videos(id) ON DELETE SET NULL,
      link_series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
      link_custom_url TEXT,
      frequency TEXT NOT NULL DEFAULT 'once_per_day',
      is_active BOOLEAN NOT NULL DEFAULT false,
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Additive migrations: add missing columns to tables that already exist
  const alterations = [
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS slug TEXT`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS carousel_image_url TEXT`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS hero_image_url TEXT`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS director TEXT`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS cast TEXT`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS content_rating TEXT`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS release_date DATE`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS category_id INTEGER`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER`,
    `ALTER TABLE series ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS slug TEXT`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'movie'`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS hero_image_url TEXT`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS carousel_image_url TEXT`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS category_id INTEGER`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER`,
    `ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    `ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS series_id INTEGER`,
    `ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS release_date DATE`,
    `ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE brand_assets ADD COLUMN IF NOT EXISTS file_key TEXT DEFAULT ''`,
    `ALTER TABLE brand_assets ADD COLUMN IF NOT EXISTS content_type TEXT`,
    `ALTER TABLE brand_assets ADD COLUMN IF NOT EXISTS file_size BIGINT`,
    `ALTER TABLE brand_assets ALTER COLUMN url SET DEFAULT ''`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS film_title TEXT`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS runtime TEXT`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS genre TEXT`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS viewing_link TEXT`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS password TEXT`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS trailer_link TEXT`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS director_name TEXT`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`,
    `ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS image_key TEXT`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS link_type TEXT`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS link_video_id INTEGER`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS link_series_id INTEGER`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS link_custom_url TEXT`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'once_per_day'`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS start_date DATE`,
    `ALTER TABLE promo_popups ADD COLUMN IF NOT EXISTS end_date DATE`,
  ];

  for (const sql of alterations) {
    await query(sql).catch(() => {}); // safe — ignore if column already exists
  }

  console.log("DB migrations complete.");
}
