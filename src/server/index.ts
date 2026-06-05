import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { Webhook } from "svix";
import { query, pool } from "./db.js";
import { containsBlockedContent } from "./commentFilter.js";
import { clerkAuth, adminAuth, clerk } from "./auth.js";
import Stripe from "stripe";
import { stripe, createCheckoutSession, createPortalSession } from "./stripe.js";
import { uploadFile, getPublicUrl, getSignedDownloadUrl, listFiles } from "./storage.js";
import { getCached, invalidateCache, redis } from "./redis.js";
import { runMigrations } from "./migrate.js";

const app = new Hono();

// ─── Global error handler — always return JSON ───────────────────────────────
app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.path}`, err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

// ─── Static files ───────────────────────────────────────────────────────────
app.use("/assets/*", serveStatic({ root: "./dist/client" }));
app.use("/manifest.json", serveStatic({ root: "./dist/client" }));

// ─── Clerk Webhook ──────────────────────────────────────────────────────────
app.post("/api/webhooks/clerk", async (c) => {
  const payload = await c.req.text();
  const headers = {
    "svix-id": c.req.header("svix-id") ?? "",
    "svix-timestamp": c.req.header("svix-timestamp") ?? "",
    "svix-signature": c.req.header("svix-signature") ?? "",
  };

  try {
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return c.json({ error: "Webhook secret not configured" }, 500);
    }
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers) as {
      type: string;
      data: {
        id: string;
        email_addresses: Array<{ email_address: string; id: string }>;
        primary_email_address_id: string;
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };
    };

    const { type, data } = evt;
    console.log("Clerk webhook received:", type);

    // Only handle user events — other event types (email.created, session.*, etc.) have different shapes
    if (type !== "user.created" && type !== "user.updated") {
      return c.json({ success: true });
    }

    const primaryEmail = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address;

    const ADMIN_EMAILS = ["romediastudios@gmail.com"];
    const role = ADMIN_EMAILS.includes(primaryEmail ?? "") ? "admin" : "viewer";

    if (type === "user.created") {
      await query(
        `INSERT INTO users (clerk_user_id, email, role, display_name, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (clerk_user_id) DO UPDATE SET role = $3`,
        [
          data.id,
          primaryEmail,
          role,
          [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
          data.image_url,
        ]
      );
    } else if (type === "user.updated") {
      await query(
        `UPDATE users SET email = $2, role = CASE WHEN email = ANY($6::text[]) THEN 'admin' ELSE role END,
         display_name = $3, avatar_url = $4, updated_at = NOW()
         WHERE clerk_user_id = $1`,
        [
          data.id,
          primaryEmail,
          [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
          data.image_url,
          null,
          ADMIN_EMAILS,
        ]
      );
      await invalidateCache(`user:${data.id}`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return c.json({ error: "Invalid webhook" }, 400);
  }
});

// ─── Stripe Webhook ─────────────────────────────────────────────────────────
app.post("/api/billing/stripe-webhook", async (c) => {
  const sig = c.req.header("stripe-signature");
  const body = await c.req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return c.json({ error: "Invalid signature" }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          customer: string;
          subscription: string;
          metadata: { user_id?: string; billing_period?: string };
          customer_email?: string;
        };
        const userId = session.metadata?.user_id;
        if (!userId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const sub = subscription as unknown as Stripe.Subscription & { current_period_start: number; current_period_end: number };
        const priceId = sub.items.data[0]?.price.id;
        const plan =
          priceId === process.env.STRIPE_MONTHLY_PRICE_ID ? "monthly" : "yearly";
        const periodStart = new Date(sub.current_period_start * 1000);
        const periodEnd = new Date(sub.current_period_end * 1000);

        await query(
          `INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id, stripe_price_id, period_start_date, period_end_date)
           VALUES ($1, $2, 'active', $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE SET
             plan = $2, status = 'active', stripe_customer_id = $3,
             stripe_subscription_id = $4, stripe_price_id = $5,
             period_start_date = $6, period_end_date = $7, updated_at = NOW()`,
          [
            userId,
            plan,
            session.customer,
            session.subscription,
            priceId,
            periodStart.toISOString().split("T")[0],
            periodEnd.toISOString().split("T")[0],
          ]
        );

        await query(
          `UPDATE subscription_attempts SET status = 'completed', completed_at = NOW()
           WHERE stripe_session_id = $1`,
          [session as unknown as { id: string } ? (session as unknown as { id: string }).id : null]
        );

        await invalidateCache(`subscription:${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as unknown as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };
        const priceId = sub.items.data[0]?.price.id;
        const plan =
          priceId === process.env.STRIPE_MONTHLY_PRICE_ID ? "monthly" : "yearly";
        const status = ["active", "trialing", "past_due", "canceled"].includes(sub.status)
          ? sub.status
          : "active";
        const periodStart = new Date(sub.current_period_start * 1000);
        const periodEnd = new Date(sub.current_period_end * 1000);

        const result = await query(
          `UPDATE subscriptions SET plan = $1, status = $2, stripe_price_id = $3,
           period_start_date = $4, period_end_date = $5, updated_at = NOW()
           WHERE stripe_subscription_id = $6 RETURNING user_id`,
          [
            plan,
            status,
            priceId,
            periodStart.toISOString().split("T")[0],
            periodEnd.toISOString().split("T")[0],
            sub.id,
          ]
        );

        if (result.rows[0]) {
          await invalidateCache(`subscription:${result.rows[0].user_id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as { id: string };
        const result = await query(
          `UPDATE subscriptions SET status = 'canceled', period_end_date = NULL, updated_at = NOW()
           WHERE stripe_subscription_id = $1 RETURNING user_id`,
          [sub.id]
        );
        if (result.rows[0]) {
          await invalidateCache(`subscription:${result.rows[0].user_id}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription?: string | null; parent?: { subscription_details?: { subscription?: string | null } } };
        const subId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null;
        if (!subId) break;
        const result = await query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
           WHERE stripe_subscription_id = $1 RETURNING user_id`,
          [subId]
        );
        if (result.rows[0]) {
          await invalidateCache(`subscription:${result.rows[0].user_id}`);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
  }

  return c.json({ received: true });
});

// ─── Public Routes ───────────────────────────────────────────────────────────

app.get("/api/categories", async (c) => {
  const result = await query(
    "SELECT * FROM categories ORDER BY sort_order ASC, name ASC"
  );
  return c.json(result.rows);
});

app.get("/api/carousel", async (c) => {
  const result = await query(
    "SELECT * FROM carousel_items WHERE is_active = true ORDER BY display_order ASC"
  );
  return c.json(result.rows);
});

app.get("/api/browse-data", async (c) => {
  try {
    const data = await getCached("browse-data", 300, async () => {
      const [videos, series, categories, carousel] = await Promise.all([
        query(
          `SELECT v.*, s.title as series_title
           FROM videos v
           LEFT JOIN series s ON v.series_id = s.id
           WHERE v.is_published = true
           ORDER BY v.release_date DESC NULLS LAST, v.created_at DESC`
        ),
        query(`SELECT * FROM series ORDER BY created_at DESC`),
        query(`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`).catch(() => ({ rows: [] })),
        query(`SELECT * FROM carousel_items WHERE is_active = true ORDER BY display_order ASC`).catch(() => ({ rows: [] })),
      ]);

      return {
        videos: videos.rows,
        series: series.rows,
        categories: categories.rows,
        carousel: carousel.rows,
      };
    });
    return c.json(data);
  } catch (err) {
    console.error("browse-data error:", err);
    return c.json({ videos: [], series: [], categories: [], carousel: [] });
  }
});

app.get("/api/series/:id", async (c) => {
  const id = c.req.param("id");
  const isSlug = isNaN(Number(id));
  const result = await query(
    `SELECT s.*, c.name as category_name
     FROM series s LEFT JOIN categories c ON s.category_id = c.id
     WHERE ${isSlug ? "s.slug = $1" : "s.id = $1"}`,
    [isSlug ? id : Number(id)]
  );
  if (!result.rows.length) return c.json({ error: "Not found" }, 404);
  return c.json(result.rows[0]);
});

app.get("/api/series/:id/episodes", async (c) => {
  const id = c.req.param("id");
  const isSlug = isNaN(Number(id));
  const seriesResult = await query(
    `SELECT id FROM series WHERE ${isSlug ? "slug = $1" : "id = $1"}`,
    [isSlug ? id : Number(id)]
  );
  if (!seriesResult.rows.length) return c.json({ error: "Not found" }, 404);

  const seriesId = seriesResult.rows[0].id;
  const result = await query(
    `SELECT * FROM videos
     WHERE series_id = $1 AND is_published = true
     ORDER BY season_number ASC NULLS LAST, episode_number ASC NULLS LAST`,
    [seriesId]
  );
  return c.json(result.rows);
});

app.get("/api/watch/:id", async (c) => {
  const id = c.req.param("id");
  const isSlug = isNaN(Number(id));
  const videoResult = await query(
    `SELECT v.*, s.title as series_title, s.slug as series_slug
     FROM videos v
     LEFT JOIN series s ON v.series_id = s.id
     WHERE ${isSlug ? "v.slug = $1" : "v.id = $1"}`,
    [isSlug ? id : Number(id)]
  );

  if (!videoResult.rows.length) return c.json({ error: "Not found" }, 404);
  const video = videoResult.rows[0];

  let nextEpisode = null;
  if (video.series_id && video.episode_number) {
    const nextResult = await query(
      `SELECT * FROM videos
       WHERE series_id = $1 AND is_published = true
         AND (season_number = $2 AND episode_number > $3
              OR season_number > $2)
       ORDER BY season_number ASC, episode_number ASC
       LIMIT 1`,
      [video.series_id, video.season_number ?? 1, video.episode_number]
    );
    nextEpisode = nextResult.rows[0] || null;
  }

  return c.json({ video, nextEpisode });
});

app.get("/api/public/cover-art", async (c) => {
  const result = await query(
    `SELECT id, title, cover_image_url, thumbnail_url, content_type FROM videos
     WHERE is_published = true AND cover_image_url IS NOT NULL
     LIMIT 50`
  );
  return c.json(result.rows);
});

app.get("/api/promo-popup", async (c) => {
  const result = await query(
    `SELECT * FROM promo_popups
     WHERE is_active = true
       AND (start_date IS NULL OR start_date <= CURRENT_DATE)
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     ORDER BY created_at DESC LIMIT 1`
  );
  return c.json(result.rows[0] || null);
});

app.get("/api/images/*", async (c) => {
  const raw = c.req.path.slice("/api/images/".length);
  if (!raw) return c.json({ error: "No key" }, 400);
  const key = decodeURIComponent(raw);
  try {
    const url = await getSignedDownloadUrl(key);
    return c.redirect(url, 302);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
});

app.get("/api/brand-assets/public", async (c) => {
  const assets: Record<string, string> = {};

  // First, pull anything uploaded directly to the brand/ folder in storage
  // (files uploaded via Railway UI won't have DB records)
  try {
    const storageFiles = await listFiles("brand/");
    for (const f of storageFiles) {
      if (f.name) assets[f.name] = `/api/images/${f.key}`;
    }
  } catch { /* storage unavailable — continue */ }

  // DB records override storage so renamed assets take precedence
  const result = await query("SELECT name, file_key FROM brand_assets ORDER BY created_at ASC");
  for (const row of result.rows) {
    assets[row.name] = `/api/images/${row.file_key}`;
  }

  return c.json(assets);
});

app.post("/api/contest", async (c) => {
  const body = await c.req.json<{
    film_title: string;
    runtime: string;
    genre: string;
    viewing_link: string;
    password?: string;
    trailer_link?: string;
    director_name: string;
    email: string;
  }>();

  await query(
    `INSERT INTO contest_submissions (film_title, runtime, genre, viewing_link, password, trailer_link, director_name, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      body.film_title,
      body.runtime,
      body.genre,
      body.viewing_link,
      body.password || null,
      body.trailer_link || null,
      body.director_name,
      body.email,
    ]
  );

  return c.json({ success: true });
});

// ─── Authenticated Routes ────────────────────────────────────────────────────

app.get("/api/users/me", clerkAuth, async (c) => {
  const user = c.get("user");
  const sub = await query(
    "SELECT plan, status, period_end_date FROM subscriptions WHERE user_id = $1",
    [user.id]
  );
  return c.json({ ...user, subscription: sub.rows[0] || null });
});

app.put("/api/users/profile", clerkAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ display_name?: string }>();
  await query(
    "UPDATE users SET display_name = $2, updated_at = NOW() WHERE id = $1",
    [user.id, body.display_name]
  );
  await invalidateCache(`user:${user.clerk_user_id}`);
  return c.json({ success: true });
});

app.post("/api/users/profile-picture", clerkAuth, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  if (!file) return c.json({ error: "No file" }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadFile(buffer, file.name, file.type, "avatars");
  const url = getPublicUrl(key);

  await query(
    "UPDATE users SET avatar_url = $2, updated_at = NOW() WHERE id = $1",
    [user.id, url]
  );
  await invalidateCache(`user:${user.clerk_user_id}`);
  return c.json({ url });
});

app.delete("/api/users/delete-account", clerkAuth, async (c) => {
  const user = c.get("user");

  const sub = await query(
    "SELECT stripe_subscription_id, stripe_customer_id FROM subscriptions WHERE user_id = $1",
    [user.id]
  );

  if (sub.rows[0]?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(sub.rows[0].stripe_subscription_id);
    } catch {
      // ignore
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM watchlist WHERE user_id = $1", [user.id]);
    await client.query("DELETE FROM playback_history WHERE user_id = $1", [user.id]);
    await client.query("DELETE FROM subscriptions WHERE user_id = $1", [user.id]);
    await client.query("DELETE FROM users WHERE id = $1", [user.id]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  try {
    await clerk.users.deleteUser(user.clerk_user_id);
  } catch {
    // ignore
  }

  await invalidateCache(`user:${user.clerk_user_id}`);
  await invalidateCache(`subscription:${user.id}`);
  return c.json({ success: true });
});

// Watchlist
app.get("/api/watchlist", clerkAuth, async (c) => {
  const user = c.get("user");
  const result = await query(
    `SELECT v.id, v.title, v.slug, v.thumbnail_url, v.mux_playback_id, v.is_free,
            v.content_type, v.series_id, v.episode_number, v.season_number,
            w.created_at as added_at
     FROM watchlist w JOIN videos v ON w.video_id = v.id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [user.id]
  );
  return c.json(result.rows);
});

app.post("/api/watchlist", clerkAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ video_id: number }>();
  await query(
    "INSERT INTO watchlist (user_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [user.id, body.video_id]
  );
  return c.json({ success: true });
});

app.delete("/api/watchlist/:videoId", clerkAuth, async (c) => {
  const user = c.get("user");
  const videoId = Number(c.req.param("videoId"));
  await query("DELETE FROM watchlist WHERE user_id = $1 AND video_id = $2", [
    user.id,
    videoId,
  ]);
  return c.json({ success: true });
});

// Playback History
app.get("/api/playback-history", clerkAuth, async (c) => {
  const user = c.get("user");
  const result = await query(
    `SELECT ph.video_id AS id, ph.video_id, ph.last_position_seconds, ph.completed,
            v.title, v.thumbnail_url, v.mux_duration, v.series_id, v.slug,
            v.episode_number, v.season_number
     FROM playback_history ph JOIN videos v ON ph.video_id = v.id
     WHERE ph.user_id = $1 AND ph.completed = false AND ph.last_position_seconds > 5
     ORDER BY ph.updated_at DESC
     LIMIT 20`,
    [user.id]
  );
  return c.json(result.rows);
});

app.post("/api/playback-history", clerkAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    video_id: number;
    last_position_seconds: number;
    completed?: boolean;
    mux_duration?: number;
  }>();

  await query(
    `INSERT INTO playback_history (user_id, video_id, last_position_seconds, completed)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, video_id) DO UPDATE SET
       last_position_seconds = $3, completed = $4, updated_at = NOW()`,
    [user.id, body.video_id, body.last_position_seconds, body.completed ?? false]
  );

  // Backfill mux_duration on the video record if the player reported it and it was missing
  if (body.mux_duration && body.mux_duration > 0) {
    await query(
      `UPDATE videos SET mux_duration = $1 WHERE id = $2 AND (mux_duration IS NULL OR mux_duration = 0)`,
      [body.mux_duration, body.video_id]
    );
  }

  return c.json({ success: true });
});

// Billing
app.get("/api/billing/subscription", clerkAuth, async (c) => {
  const user = c.get("user");
  if (user.role === "admin" || user.role === "creator") {
    return c.json({ plan: "yearly", status: "active", period_end_date: "2099-12-31" });
  }
  const data = await getCached(`subscription:${user.id}`, 120, async () => {
    const result = await query(
      "SELECT * FROM subscriptions WHERE user_id = $1",
      [user.id]
    );
    return result.rows[0] || null;
  });
  return c.json(data);
});

app.post("/api/billing/create-checkout-session", clerkAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ billingPeriod: "monthly" | "yearly" }>();

  const existing = await query(
    "SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1",
    [user.id]
  );
  const customerId = existing.rows[0]?.stripe_customer_id;

  // Track attempt
  await query(
    `INSERT INTO subscription_attempts (user_id, email, billing_period, status, checkout_started_at)
     VALUES ($1, $2, $3, 'started', NOW())`,
    [user.id, user.email, body.billingPeriod]
  );

  const url = await createCheckoutSession(
    user.id,
    user.email,
    body.billingPeriod,
    customerId
  );
  return c.json({ url });
});

app.post("/api/billing/create-portal-session", clerkAuth, async (c) => {
  const user = c.get("user");
  const sub = await query(
    "SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1",
    [user.id]
  );

  if (!sub.rows[0]?.stripe_customer_id) {
    return c.json({ error: "No active subscription" }, 400);
  }

  const url = await createPortalSession(sub.rows[0].stripe_customer_id);
  return c.json({ url });
});

// ─── Admin Routes ────────────────────────────────────────────────────────────

// Videos
app.get("/api/admin/videos", clerkAuth, adminAuth, async (c) => {
  try {
    const result = await query(
      `SELECT v.*, s.title as series_title
       FROM videos v
       LEFT JOIN series s ON v.series_id = s.id
       ORDER BY v.created_at DESC`
    );
    return c.json(result.rows);
  } catch (err) {
    console.error("GET /api/admin/videos error:", err);
    return c.json([]);
  }
});

app.post("/api/admin/videos", clerkAuth, adminAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<Record<string, unknown>>();
  try {
    const result = await query(
      `INSERT INTO videos (title, slug, description, content_type, mux_asset_id, mux_playback_id,
        mux_duration, thumbnail_url, hero_image_url, carousel_image_url, category_id, series_id,
        episode_number, season_number, is_published, is_free, subtitles_enabled, release_date,
        intro_start_seconds, intro_end_seconds, content_rating, genre, "cast", director,
        created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [
        body.title, body.slug || null, body.description || null, body.content_type ?? "movie",
        body.mux_asset_id || null, body.mux_playback_id || null, body.mux_duration || null,
        body.thumbnail_url || null, body.hero_image_url || null, body.carousel_image_url || null,
        body.category_id || null, body.series_id || null, body.episode_number || null, body.season_number || null,
        body.is_published ?? false, body.is_free ?? false, body.subtitles_enabled ?? true, body.release_date || null,
        body.intro_start_seconds || null, body.intro_end_seconds || null, body.content_rating || null,
        body.genre || null, body.cast || null, body.director || null, user.id,
      ]
    );
    await invalidateCache("browse-data");
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error("POST /api/admin/videos error:", err);
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.put("/api/admin/videos/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>();
  try {
    const result = await query(
      `UPDATE videos SET title=$1, slug=$2, description=$3, content_type=$4, mux_asset_id=$5,
        mux_playback_id=$6, mux_duration=$7, thumbnail_url=$8, hero_image_url=$9,
        carousel_image_url=$10, category_id=$11, series_id=$12, episode_number=$13,
        season_number=$14, is_published=$15, is_free=$16, subtitles_enabled=$17, release_date=$18,
        intro_start_seconds=$19, intro_end_seconds=$20, content_rating=$21,
        genre=$22, "cast"=$23, director=$24, updated_at=NOW()
       WHERE id=$25 RETURNING *`,
      [
        body.title, body.slug || null, body.description || null, body.content_type,
        body.mux_asset_id || null, body.mux_playback_id || null, body.mux_duration || null,
        body.thumbnail_url || null, body.hero_image_url || null, body.carousel_image_url || null,
        body.category_id || null, body.series_id || null, body.episode_number || null, body.season_number || null,
        body.is_published ?? false, body.is_free ?? false, body.subtitles_enabled ?? true, body.release_date || null,
        body.intro_start_seconds || null, body.intro_end_seconds || null, body.content_rating || null,
        body.genre || null, body.cast || null, body.director || null, id,
      ]
    );
    await invalidateCache("browse-data");
    return c.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/admin/videos error:", err);
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.delete("/api/admin/videos/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  await query("DELETE FROM videos WHERE id = $1", [id]);
  await invalidateCache("browse-data");
  return c.json({ success: true });
});

// Series
app.get("/api/admin/series", clerkAuth, adminAuth, async (c) => {
  try {
    const result = await query(
      `SELECT s.*,
       (SELECT COUNT(*) FROM videos v WHERE v.series_id = s.id) as episode_count
       FROM series s
       ORDER BY s.created_at DESC`
    );
    return c.json(result.rows);
  } catch (err) {
    console.error("GET /api/admin/series error:", err);
    return c.json([]);
  }
});

app.post("/api/admin/series", clerkAuth, adminAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<Record<string, unknown>>();
  try {
    const result = await query(
      `INSERT INTO series (title, slug, description, cover_image_url, carousel_image_url,
        hero_image_url, release_date, "cast", director, content_rating, category_id, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        body.title, body.slug || null, body.description || null, body.cover_image_url || null,
        body.carousel_image_url || null, body.hero_image_url || null, body.release_date || null,
        body.cast || null, body.director || null, body.content_rating || null,
        body.category_id || null, user.id,
      ]
    );
    await invalidateCache("browse-data");
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error("POST /api/admin/series error:", err);
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.put("/api/admin/series/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>();
  try {
    const result = await query(
      `UPDATE series SET title=$1, slug=$2, description=$3, cover_image_url=$4,
        carousel_image_url=$5, hero_image_url=$6, release_date=$7, "cast"=$8,
        director=$9, content_rating=$10, category_id=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [
        body.title, body.slug || null, body.description || null, body.cover_image_url || null,
        body.carousel_image_url || null, body.hero_image_url || null, body.release_date || null,
        body.cast || null, body.director || null, body.content_rating || null,
        body.category_id || null, id,
      ]
    );
    await invalidateCache("browse-data");
    return c.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/admin/series error:", err);
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.delete("/api/admin/series/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  await query("DELETE FROM series WHERE id = $1", [id]);
  await invalidateCache("browse-data");
  return c.json({ success: true });
});

// Carousel
app.get("/api/admin/carousel", clerkAuth, adminAuth, async (c) => {
  const result = await query("SELECT * FROM carousel_items ORDER BY display_order ASC");
  return c.json(result.rows);
});

app.post("/api/admin/carousel", clerkAuth, adminAuth, async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const result = await query(
    `INSERT INTO carousel_items (title, description, image_url, display_order, is_active, video_id, series_id, release_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      body.title, body.description, body.image_url, body.display_order ?? 0,
      body.is_active ?? true, body.video_id, body.series_id, body.release_date,
    ]
  );
  await invalidateCache("browse-data");
  return c.json(result.rows[0], 201);
});

app.put("/api/admin/carousel/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>();
  const result = await query(
    `UPDATE carousel_items SET title=$1, description=$2, image_url=$3, display_order=$4,
      is_active=$5, video_id=$6, series_id=$7, release_date=$8, updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [
      body.title, body.description, body.image_url, body.display_order,
      body.is_active, body.video_id, body.series_id, body.release_date, id,
    ]
  );
  await invalidateCache("browse-data");
  return c.json(result.rows[0]);
});

app.delete("/api/admin/carousel/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  await query("DELETE FROM carousel_items WHERE id = $1", [id]);
  await invalidateCache("browse-data");
  return c.json({ success: true });
});

// Brand Assets
app.get("/api/admin/brand-assets", clerkAuth, adminAuth, async (c) => {
  const dbResult = await query("SELECT * FROM brand_assets ORDER BY created_at DESC");
  const dbKeys = new Set(dbResult.rows.map((r: any) => r.file_key));

  // Also surface files in the brand/ folder that were uploaded directly to storage
  const storageRows: any[] = [];
  try {
    const storageFiles = await listFiles("brand/");
    for (const f of storageFiles) {
      if (!dbKeys.has(f.key) && f.name) {
        storageRows.push({
          id: `storage-${f.key}`,
          name: f.name,
          file_key: f.key,
          content_type: f.name.match(/\.png$/i) ? "image/png" : f.name.match(/\.jpe?g$/i) ? "image/jpeg" : "image/png",
          file_size: null,
          created_at: null,
          updated_at: null,
        });
      }
    }
  } catch { /* storage unavailable */ }

  return c.json([...storageRows, ...dbResult.rows]);
});

// Upload Image
app.post("/api/admin/upload-image", clerkAuth, adminAuth, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "images";
  if (!file) return c.json({ error: "No file" }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadFile(buffer, file.name, file.type, folder);
  // Always return proxy URL — works whether bucket is public or private
  const url = `/api/images/${key}`;

  if (folder === "brand") {
    const name = (formData.get("name") as string) || file.name;
    await query(
      `INSERT INTO brand_assets (name, file_key, content_type, file_size)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET file_key=$2, content_type=$3, file_size=$4, updated_at=NOW()`,
      [name, key, file.type, file.size]
    );
  }

  return c.json({ key, url });
});

// Subscribers
app.get("/api/admin/subscribers", clerkAuth, adminAuth, async (c) => {
  const result = await query(
    `SELECT u.id, u.email, u.display_name, u.avatar_url, u.created_at,
       s.plan, s.status, s.stripe_customer_id, s.stripe_subscription_id,
       s.period_start_date, s.period_end_date
     FROM users u
     JOIN subscriptions s ON s.user_id = u.id
     ORDER BY u.created_at DESC`
  );
  return c.json(result.rows);
});

app.put("/api/admin/subscribers/:id/subscription", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ plan?: string; status?: string }>();
  await query(
    "UPDATE subscriptions SET plan = COALESCE($1, plan), status = COALESCE($2, status), updated_at = NOW() WHERE user_id = $3",
    [body.plan, body.status, id]
  );
  return c.json({ success: true });
});

app.delete("/api/admin/subscribers/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  await query("DELETE FROM users WHERE id = $1", [id]);
  return c.json({ success: true });
});

// Abandoned signups
app.get("/api/admin/subscription-attempts", clerkAuth, adminAuth, async (c) => {
  const result = await query(
    "SELECT * FROM subscription_attempts ORDER BY created_at DESC LIMIT 200"
  );
  return c.json(result.rows);
});

app.get("/api/admin/abandoned-signups", clerkAuth, adminAuth, async (c) => {
  const result = await query(
    `SELECT * FROM subscription_attempts
     WHERE status = 'started'
       AND checkout_started_at < NOW() - INTERVAL '1 hour'
     ORDER BY checkout_started_at DESC LIMIT 200`
  );
  return c.json(result.rows);
});

app.delete("/api/admin/users/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  const user = await query("SELECT clerk_user_id FROM users WHERE id = $1", [id]);
  await query("DELETE FROM users WHERE id = $1", [id]);
  if (user.rows[0]?.clerk_user_id) {
    try {
      await clerk.users.deleteUser(user.rows[0].clerk_user_id);
    } catch {
      // ignore
    }
  }
  return c.json({ success: true });
});

// Contest Submissions
app.get("/api/admin/contest-submissions", clerkAuth, adminAuth, async (c) => {
  const result = await query(
    "SELECT * FROM contest_submissions ORDER BY created_at DESC"
  );
  return c.json(result.rows);
});

app.put("/api/admin/contest-submissions/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ status: string }>();
  await query(
    "UPDATE contest_submissions SET status = $1, updated_at = NOW() WHERE id = $2",
    [body.status, id]
  );
  return c.json({ success: true });
});

// Promo Popups
app.get("/api/admin/promo-popups", clerkAuth, adminAuth, async (c) => {
  const result = await query("SELECT * FROM promo_popups ORDER BY created_at DESC");
  return c.json(result.rows);
});

app.post("/api/admin/promo-popups", clerkAuth, adminAuth, async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const result = await query(
    `INSERT INTO promo_popups (title, image_key, link_type, link_video_id, link_series_id,
      link_custom_url, frequency, is_active, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      body.title, body.image_key, body.link_type, body.link_video_id,
      body.link_series_id, body.link_custom_url, body.frequency ?? "once_per_day",
      body.is_active ?? false, body.start_date, body.end_date,
    ]
  );
  return c.json(result.rows[0], 201);
});

app.patch("/api/admin/promo-popups/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>();
  const result = await query(
    `UPDATE promo_popups SET title=COALESCE($1,title), image_key=COALESCE($2,image_key),
      link_type=COALESCE($3,link_type), link_video_id=$4, link_series_id=$5,
      link_custom_url=$6, frequency=COALESCE($7,frequency), is_active=COALESCE($8,is_active),
      start_date=$9, end_date=$10, updated_at=NOW()
     WHERE id=$11 RETURNING *`,
    [
      body.title, body.image_key, body.link_type, body.link_video_id,
      body.link_series_id, body.link_custom_url, body.frequency,
      body.is_active, body.start_date, body.end_date, id,
    ]
  );
  return c.json(result.rows[0]);
});

app.delete("/api/admin/promo-popups/:id", clerkAuth, adminAuth, async (c) => {
  const id = Number(c.req.param("id"));
  await query("DELETE FROM promo_popups WHERE id = $1", [id]);
  return c.json({ success: true });
});

// ─── SPA fallback ────────────────────────────────────────────────────────────
app.use("/*", serveStatic({ root: "./dist/client" }));
app.get("/*", async (c) => {
  return c.html(
    (await import("node:fs")).readFileSync("./dist/client/index.html", "utf-8")
  );
});

// ─── Comments ────────────────────────────────────────────────────────────────

// GET /api/videos/:id/comments — public, paginated (optionally authenticated to resolve is_owner)
app.get("/api/videos/:id/comments", async (c) => {
  const videoId = Number(c.req.param("id"));
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  // Resolve current user if token is present (best-effort — don't block unauthenticated requests)
  let currentUserId: number | null = null;
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const { verifyToken } = await import("@clerk/backend");
      const verified = await verifyToken(authHeader.slice(7), { secretKey: process.env.CLERK_SECRET_KEY! });
      const userResult = await query<{ id: number }>("SELECT id FROM users WHERE clerk_user_id = $1", [verified.sub]);
      if (userResult.rows[0]) currentUserId = userResult.rows[0].id;
    } catch { /* unauthenticated — fine */ }
  }

  const result = await query(
    `SELECT c.id, c.body, c.created_at, c.user_id,
            u.display_name, u.avatar_url
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.video_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [videoId, limit + 1, offset]
  );

  const rows = result.rows;
  const hasMore = rows.length > limit;
  const comments = rows.slice(0, limit).map(row => ({
    ...row,
    is_owner: currentUserId !== null && row.user_id === currentUserId,
  }));

  const countResult = await query("SELECT COUNT(*) FROM comments WHERE video_id = $1", [videoId]);
  return c.json({ comments, total: Number(countResult.rows[0].count), hasMore });
});

// POST /api/videos/:id/comments — authenticated + active subscription required
app.post("/api/videos/:id/comments", clerkAuth, async (c) => {
  const user = c.get("user");
  const videoId = Number(c.req.param("id"));
  const body = await c.req.json<{ body: string }>();
  const text = (body.body ?? "").trim();

  if (!text) return c.json({ error: "Comment cannot be empty." }, 400);
  if (text.length > 500) return c.json({ error: "Comment cannot exceed 500 characters." }, 400);
  if (containsBlockedContent(text)) return c.json({ error: "Comment contains prohibited content." }, 400);

  // Require active subscription (admins/creators bypass)
  if (user.role !== "admin" && user.role !== "creator") {
    const subResult = await query(
      `SELECT status FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [user.id]
    );
    if (subResult.rows.length === 0) {
      return c.json({ error: "An active subscription is required to comment." }, 403);
    }
  }

  // Rate limit: max 5 comments per user per 60 seconds
  const rateLimitKey = `comment_rate:${user.id}`;
  try {
    const count = await redis.incr(rateLimitKey);
    if (count === 1) await redis.expire(rateLimitKey, 60);
    if (count > 5) return c.json({ error: "You're posting too fast. Please wait a moment." }, 429);
  } catch { /* Redis unavailable — allow through */ }

  const result = await query(
    `INSERT INTO comments (video_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, body, created_at`,
    [videoId, user.id, text]
  );
  const comment = { ...result.rows[0], display_name: user.display_name, avatar_url: user.avatar_url, user_id: user.id, is_owner: true };
  return c.json(comment, 201);
});

// DELETE /api/comments/:id — owner or admin only
app.delete("/api/comments/:id", clerkAuth, async (c) => {
  const user = c.get("user");
  const commentId = Number(c.req.param("id"));
  const existing = await query("SELECT user_id FROM comments WHERE id = $1", [commentId]);
  if (!existing.rows[0]) return c.json({ error: "Not found" }, 404);
  if (existing.rows[0].user_id !== user.id && user.role !== "admin" && user.role !== "creator") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await query("DELETE FROM comments WHERE id = $1", [commentId]);
  return c.json({ success: true });
});

// GET /api/admin/comments — all comments, admin only
app.get("/api/admin/comments", clerkAuth, adminAuth, async (c) => {
  const result = await query(
    `SELECT c.id, c.body, c.created_at,
            u.display_name, u.avatar_url,
            v.title AS video_title, v.id AS video_id
     FROM comments c
     JOIN users u ON c.user_id = u.id
     JOIN videos v ON c.video_id = v.id
     ORDER BY c.created_at DESC
     LIMIT 500`
  );
  return c.json(result.rows);
});

// ─── Start server ────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3000;

runMigrations()
  .then(() => {
    // Ensure admin accounts have correct role after migrations
    const ADMIN_EMAILS = ["romediastudios@gmail.com"];
    return query(
      `UPDATE users SET role = 'admin' WHERE email = ANY($1::text[]) AND role != 'admin'`,
      [ADMIN_EMAILS]
    );
  })
  .catch((err) => console.error("Migration error:", err))
  .finally(() => {
    serve({ fetch: app.fetch, port }, () => {
      console.log(`ReelMotion server running on port ${port}`);
    });
  });

export default app;
