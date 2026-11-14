import { verifyToken } from "@clerk/backend";
import type { Context } from "hono";
import { query } from "./db.js";
import type { AuthUser } from "./auth.js";

// Must stay in sync with hasAccess() in src/react-app/utils/access.ts.
export function subscriptionGrantsAccess(
  sub: { status: string | null; period_end_date: string | Date | null } | null | undefined
): boolean {
  if (!sub?.status) return false;
  if (sub.status === "active" || sub.status === "trialing") return true;
  if (sub.status === "canceled" && sub.period_end_date) {
    return new Date(sub.period_end_date) > new Date();
  }
  return false;
}

export async function userHasAccess(user: Pick<AuthUser, "id" | "role"> | null): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin" || user.role === "creator") return true;
  const result = await query<{ status: string; period_end_date: string | null }>(
    "SELECT status, period_end_date FROM subscriptions WHERE user_id = $1",
    [user.id]
  );
  return result.rows.some(subscriptionGrantsAccess);
}

// Resolves the signed-in user if a valid Bearer token is present; never rejects the request.
export async function getOptionalUser(c: Context): Promise<AuthUser | null> {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const verified = await verifyToken(header.slice(7), { secretKey: process.env.CLERK_SECRET_KEY! });
    const result = await query<AuthUser>(
      "SELECT id, clerk_user_id, email, role, display_name, avatar_url FROM users WHERE clerk_user_id = $1",
      [verified.sub]
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}
