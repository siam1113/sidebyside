/** Formats a number using compact notation (1.2K, 3.4M, 1B, ...). Returns
 *  undefined for nullish input so callers can decide the fallback -- hide a
 *  label entirely, or show "—". */
export function formatCompactNumber(n: number | null | undefined): string | undefined {
  if (n == null) return undefined;
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n < 1 ? 4 : 2 });
}
