"use server";

import { updateTag } from "next/cache";

/** Expire cached pages touched by a new review so the author sees it right away. */
export async function reviewCreated(restaurantId: number, restaurantSlug: string, dishSlug: string) {
  updateTag(`reviews:r:${restaurantId}`);
  updateTag(`score:${restaurantId}`);
  updateTag(`menu:${restaurantId}`);
  updateTag(`dish:${dishSlug}`);
  updateTag(`restaurant:${restaurantSlug}`);
  updateTag("restaurants");
}
