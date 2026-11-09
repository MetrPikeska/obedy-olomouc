export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://obedy-olomouc.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Obědy Olomouc";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Center of Olomouc (Horní náměstí). */
export const OLOMOUC_CENTER: [number, number] = [17.2509, 49.5938];

export function photoUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

/** Today's date in Prague as YYYY-MM-DD. */
export function pragueToday(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Prague" }).format(now);
}

export const AMENITY_LABEL: Record<string, string> = {
  restaurant: "Restaurace",
  cafe: "Kavárna",
  fast_food: "Bistro / fast food",
  pub: "Hospoda",
};
