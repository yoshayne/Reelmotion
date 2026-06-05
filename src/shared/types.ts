export interface User {
  id: number;
  clerk_user_id: string;
  email: string;
  role: "viewer" | "creator" | "admin";
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  subscription?: Subscription | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Series {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  carousel_image_url: string | null;
  hero_image_url: string | null;
  release_date: string | null;
  cast: string | null;
  director: string | null;
  content_rating: string | null;
  category_id: number | null;
  category_name?: string | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  episode_count?: number;
}

export interface Video {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content_type: "movie" | "episode" | "clip";
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  mux_duration: number | null;
  thumbnail_url: string | null;
  hero_image_url: string | null;
  carousel_image_url: string | null;
  category_id: number | null;
  category_name?: string | null;
  series_id: number | null;
  series_title?: string | null;
  series_slug?: string | null;
  episode_number: number | null;
  season_number: number | null;
  is_published: boolean;
  is_free: boolean;
  subtitles_enabled: boolean;
  release_date: string | null;
  intro_start_seconds: number | null;
  intro_end_seconds: number | null;
  content_rating: string | null;
  genre: string | null;
  cast: string | null;
  director: string | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  // For continue watching
  last_position_seconds?: number;
  mux_duration_seconds?: number;
  added_at?: string;
}

export interface CarouselItem {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
  video_id: number | null;
  series_id: number | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan: "free" | "monthly" | "yearly";
  status: "active" | "canceled" | "past_due" | "trialing";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  period_start_date: string | null;
  period_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybackHistory {
  id: number;
  user_id: number;
  video_id: number;
  last_position_seconds: number;
  completed: boolean;
  last_watched_at: string;
  // joined
  title?: string;
  thumbnail_url?: string | null;
  mux_duration?: number | null;
  series_id?: number | null;
  slug?: string;
}

export interface WatchlistItem extends Video {
  added_at: string;
}

export interface ContestSubmission {
  id: number;
  film_title: string;
  runtime: string;
  genre: string;
  viewing_link: string;
  password: string | null;
  trailer_link: string | null;
  director_name: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface PromoPopup {
  id: number;
  title: string;
  image_key: string;
  link_type: "video" | "series" | "custom" | null;
  link_video_id: number | null;
  link_series_id: number | null;
  link_custom_url: string | null;
  frequency: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandAsset {
  id: number;
  name: string;
  description: string | null;
  file_key: string;
  content_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionAttempt {
  id: number;
  user_id: number | null;
  email: string;
  billing_period: string | null;
  status: "started" | "completed" | "abandoned";
  stripe_session_id: string | null;
  checkout_started_at: string | null;
  completed_at: string | null;
  abandoned_at: string | null;
  created_at: string;
}

export interface BrowseData {
  videos: Video[];
  series: Series[];
  categories: Category[];
  carousel: CarouselItem[];
}
