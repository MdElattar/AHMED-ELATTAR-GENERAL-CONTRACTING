/**
 * Lightweight parsers for the localized project facts.
 *
 * Project records carry human-formatted values ("SAR 1.4B", "186,000 m²")
 * because they are read by people first. The cost visualizer needs a numeric
 * fallback when a workspace record does not expose its contract value.
 */

export function parseSarValue(value: string): number {
  const normalized = value.replace(/,/g, "").replace(/[\u0660-\u0669]/g, (digit) =>
    String(digit.charCodeAt(0) - 0x0660),
  );
  const match = normalized.match(/([\d.]+)\s*(billion|million|thousand|b|m|k|مليار|مليون|ألف)/i);
  if (!match) {
    const bare = normalized.match(/([\d.]+)/);
    return bare ? Number(bare[1]) || 0 : 0;
  }
  const amount = Number(match[1]) || 0;
  const unit = match[2].toLowerCase();
  if (unit === "b" || unit === "billion" || unit === "مليار") return amount * 1_000_000_000;
  if (unit === "m" || unit === "million" || unit === "مليون") return amount * 1_000_000;
  if (unit === "k" || unit === "thousand" || unit === "ألف") return amount * 1_000;
  return amount;
}

/** Returns built area in m², or 0 when the fact is a length/level count. */
export function parseAreaSqm(value: string): number {
  const normalized = value.replace(/,/g, "").replace(/[\u0660-\u0669]/g, (digit) =>
    String(digit.charCodeAt(0) - 0x0660),
  );
  const match = normalized.match(/([\d.]+)\s*(km²|km2|km|m²|m2|sqm|hectare|ha)/i);
  if (!match) return 0;
  const amount = Number(match[1]) || 0;
  const unit = match[2].toLowerCase();
  if (unit === "km²" || unit === "km2") return amount * 1_000_000;
  if (unit === "hectare" || unit === "ha") return amount * 10_000;
  if (unit === "km") return 0;
  return amount;
}
