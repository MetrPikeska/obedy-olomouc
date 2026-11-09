export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const full = Math.round(value);
  return (
    <span
      className={`whitespace-nowrap text-mustard ${size === "lg" ? "text-xl" : "text-sm"}`}
      aria-label={`${value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} z 5`}
      title={`${value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} z 5`}
    >
      {"★".repeat(full)}
      <span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}
