/** Shared pieces of the stop-sign language: pictograms, the score plate, the walk estimate. */

type IconName = "arrow-right" | "arrow-left" | "walk" | "camera" | "locate" | "board" | "external";

const PATHS: Record<IconName, React.ReactNode> = {
  "arrow-right": <path d="M4 12h14M12 5l7 7-7 7" />,
  "arrow-left": <path d="M20 12H6M12 5l-7 7 7 7" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  walk: (
    <>
      <circle cx="13" cy="4.5" r="1.8" fill="currentColor" stroke="none" />
      <path d="M10 21l2.2-6.5L15 17v4M8 11.5l2.5-3.5h3l2.5 3.5 2.5 1M12.5 8l-.8 6.5M9.5 12.5 7 21" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
      <circle cx="12" cy="13" r="3.6" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  board: <path d="M3 5h18v11H3zM8 20h8M12 16v4" />,
};

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Black pictogram square with an arrow, like the inset on a direction sign. */
export function ArrowBox({ dir = "right", className = "" }: { dir?: "right" | "left"; className?: string }) {
  return (
    <span className={`inline-grid size-9 shrink-0 place-items-center bg-ink text-sheet ${className}`}>
      <Icon name={dir === "right" ? "arrow-right" : "arrow-left"} className="size-5" />
    </span>
  );
}

export function scoreTone(v: number) {
  return v >= 4 ? "bg-go" : v >= 3 ? "bg-mid" : "bg-route";
}

const fmt = (v: number) => v.toLocaleString("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Score plate: the average as a number on a colored plate, five segments below.
 * Replaces star glyphs. 5 is best.
 */
export function Score({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "lg" }) {
  const filled = Math.round(value);
  const label = `${fmt(value)} z 5${count ? `, ${count} hodnocení` : ""}`;
  const big = size === "lg";
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap" role="img" aria-label={label} title={label}>
      <span
        className={`inline-flex flex-col items-stretch ${scoreTone(value)} text-sheet ${big ? "px-2.5 pt-1 pb-1.5" : "px-1.5 pt-0.5 pb-1"}`}
      >
        <span className={`font-sign font-bold leading-none tnum ${big ? "text-3xl" : "text-base"}`}>{fmt(value)}</span>
        <span className={`mt-1 flex gap-[2px] ${big ? "h-1.5" : "h-1"}`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`flex-1 ${n <= filled ? "bg-sheet" : "bg-sheet/30"}`} />
          ))}
        </span>
      </span>
      {count != null && <span className={`text-ink-2 tnum ${big ? "text-base" : "text-xs"}`}>{count}×</span>}
    </span>
  );
}

/** Straight-line distance in meters (haversine). */
export function distanceM(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough walking estimate: street detour factor 1.3, 75 m per minute. */
export function walkMinutes(a: [number, number], b: [number, number]) {
  return Math.max(1, Math.round((distanceM(a, b) * 1.3) / 75));
}
