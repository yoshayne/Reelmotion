import type { Subscription } from "@/shared/types";

export function hasAccess(subscription: Subscription | null | undefined): boolean {
  if (!subscription) return false;
  if (subscription.status === "active" || subscription.status === "trialing") {
    return true;
  }
  if (subscription.status === "canceled" && subscription.period_end_date) {
    return new Date(subscription.period_end_date) > new Date();
  }
  return false;
}

export function isSubscriptionActive(subscription: Subscription | null | undefined): boolean {
  return hasAccess(subscription);
}
