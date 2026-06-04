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

    const result = await query<AuthUser>(
      "SELECT id, clerk_user_id, email, role, display_name, avatar_url FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: "User not found" }, 404);
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
