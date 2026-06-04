-- ReelMotion PostgreSQL Schema
-- Run this against your Railway PostgreSQL database

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS series (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  carousel_image_url TEXT,
  hero_image_url TEXT,
  release_date DATE,
  cast TEXT,
  director TEXT,
  content_rating TEXT,
  category_id INTEGER,
  created_by_user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'movie',
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  mux_duration REAL,
  thumbnail_url TEXT,
  hero_image_url TEXT,
  carousel_image_url TEXT,
  category_id INTEGER,
  series_id INTEGER,
  episode_number INTEGER,
  season_number INTEGER,
  is_published BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  release_date DATE,
  intro_start_seconds REAL,
  intro_end_seconds REAL,
  content_rating TEXT,
  genre TEXT,
  cast TEXT,
  director TEXT,
  created_by_user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_content_type ON videos(content_type);
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_series_id ON videos(series_id);

CREATE TABLE IF NOT EXISTS video_categories (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX IF NOT EXISTS idx_video_categories_category_id ON video_categories(category_id);

CREATE TABLE IF NOT EXISTS series_categories (
  id SERIAL PRIMARY KEY,
  series_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_series_categories_series_id ON series_categories(series_id);

CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

CREATE TABLE IF NOT EXISTS playback_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  last_position_seconds REAL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_playback_history_user_id ON playback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_history_last_watched_at ON playback_history(last_watched_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  period_start_date DATE,
  period_end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

CREATE TABLE IF NOT EXISTS carousel_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  video_id INTEGER,
  series_id INTEGER,
  release_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_carousel_display_order ON carousel_items(display_order);

CREATE TABLE IF NOT EXISTS brand_assets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_popups (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_key TEXT NOT NULL,
  link_type TEXT NOT NULL,
  link_video_id INTEGER,
  link_series_id INTEGER,
  link_custom_url TEXT,
  frequency TEXT NOT NULL DEFAULT 'once_per_day',
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contest_submissions (
  id SERIAL PRIMARY KEY,
  film_title TEXT NOT NULL,
  runtime TEXT NOT NULL,
  genre TEXT NOT NULL,
  viewing_link TEXT NOT NULL,
  password TEXT,
  trailer_link TEXT,
  director_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_email ON contest_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_status ON contest_submissions(status);

CREATE TABLE IF NOT EXISTS subscription_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  email TEXT NOT NULL,
  billing_period TEXT,
  status TEXT DEFAULT 'started',
  stripe_session_id TEXT,
  checkout_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  abandoned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_attempts_email ON subscription_attempts(email);
CREATE INDEX IF NOT EXISTS idx_subscription_attempts_status ON subscription_attempts(status);
