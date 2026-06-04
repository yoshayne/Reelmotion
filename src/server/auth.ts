import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Context, MiddlewareHandler, Next } from "hono";
import { query } from "./db.js";

export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export interface AuthUser {
  id: number;
  clerk_user_id: string;
  email: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const clerkAuth: MiddlewareHandler = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const verifiedToken = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    const clerkUserId = verifiedToken.sub;

    let result = await query<AuthUser>(
      "SELECT id, clerk_user_id, email, role, display_name, avatar_url FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (result.rows.length === 0) {
      // User authenticated but not in DB yet (webhook may be delayed) — auto-create
      const ADMIN_EMAILS = ["romediastudios@gmail.com"];
      const clerkUser = await clerk.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ?? "";
      const role = ADMIN_EMAILS.includes(email) ? "admin" : "viewer";
      const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
      const avatarUrl = clerkUser.imageUrl || null;

      result = await query<AuthUser>(
        `INSERT INTO users (clerk_user_id, email, role, display_name, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW()
         RETURNING id, clerk_user_id, email, role, display_name, avatar_url`,
        [clerkUserId, email, role, displayName, avatarUrl]
      );
    }

    c.set("user", result.rows[0]);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};

export const adminAuth: MiddlewareHandler = async (c: Context, next: Next) => {
  const user = c.get("user");
  if (!user || (user.role !== "admin" && user.role !== "creator")) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};
