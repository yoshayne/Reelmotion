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
    CREATE TABLE IF NOT EXISTS series (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail_url TEXT,
      genre TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      mux_asset_id TEXT,
      mux_playback_id TEXT,
      mux_duration REAL,
      thumbnail_url TEXT,
      genre TEXT,
      director TEXT,
      cast TEXT,
      release_date DATE,
      content_rating TEXT,
      is_free BOOLEAN NOT NULL DEFAULT false,
      series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
      season_number INTEGER,
      episode_number INTEGER,
      intro_start_seconds REAL,
      intro_end_seconds REAL,
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
      video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
      title TEXT,
      subtitle TEXT,
      image_url TEXT,
      cta_text TEXT,
      cta_link TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS brand_assets (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
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
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      instagram_handle TEXT,
      video_url TEXT,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS promo_popups (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT,
      cta_text TEXT,
      cta_link TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log("DB migrations complete.");
}
