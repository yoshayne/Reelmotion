import type { Subscription } from "@/shared/types";

const ADMIN_EMAILS = ["romediastudios@gmail.com"];

export function hasAccess(subscription: Subscription | null | undefined, role?: string, email?: string): boolean {
  if (role === "admin" || role === "creator") return true;
  if (email && ADMIN_EMAILS.includes(email)) return true;
  if (!subscription) return false;
  if (subscription.status === "active" || subscription.status === "trialing") return true;
  if (subscription.status === "canceled" && subscription.period_end_date) {
    return new Date(subscription.period_end_date) > new Date();
  }
  return false;
}

export function isSubscriptionActive(subscription: Subscription | null | undefined, role?: string, email?: string): boolean {
  return hasAccess(subscription, role, email);
}
