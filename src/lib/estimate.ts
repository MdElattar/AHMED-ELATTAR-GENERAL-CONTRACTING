/**
 * Shared preliminary estimation model.
 *
 * The same rates power the public cost estimator and the "Elattar AI"
 * consultant widget, so both surfaces quote identical numbers from a single
 * source of truth. Values are SAR per m² for built area and m² per month of
 * productivity, calibrated against the company's delivered portfolio.
 */

export type EstimateType = "residential" | "commercial" | "infrastructure" | "industrial";
export type EstimateQuality = "essential" | "premium" | "signature";
export type EstimateCity = "riyadh" | "jeddah" | "neom" | "other";
export type EstimatePace = "standard" | "fast" | "accelerated";

export type EstimateInput = {
  type: EstimateType;
  area: number;
  quality: EstimateQuality;
  city: EstimateCity;
  pace: EstimatePace;
};

export type EstimateResult = {
  low: number;
  high: number;
  total: number;
  months: number;
  perM2: number;
};

export type EstimatePart = {
  key: "structure" | "finishes" | "mep" | "management";
  pct: number;
};

export const ESTIMATE_BREAKDOWN: EstimatePart[] = [
  { key: "structure", pct: 38 },
  { key: "finishes", pct: 27 },
  { key: "mep", pct: 22 },
  { key: "management", pct: 13 },
];

const typeRate: Record<EstimateType, number> = {
  residential: 3200,
  commercial: 4200,
  infrastructure: 1800,
  industrial: 2800,
};

const typeProductivity: Record<EstimateType, number> = {
  residential: 1800,
  commercial: 1400,
  infrastructure: 2200,
  industrial: 2500,
};

const qualityFactor: Record<EstimateQuality, number> = {
  essential: 0.85,
  premium: 1,
  signature: 1.35,
};

const cityFactor: Record<EstimateCity, number> = {
  riyadh: 1,
  jeddah: 1.08,
  neom: 1.22,
  other: 1.05,
};

const paceFactor: Record<EstimatePace, number> = {
  standard: 1,
  fast: 1.12,
  accelerated: 1.25,
};

const paceDuration: Record<EstimatePace, number> = {
  standard: 1,
  fast: 0.82,
  accelerated: 0.66,
};

export const ESTIMATE_AREA_MIN = 200;
export const ESTIMATE_AREA_MAX = 500000;

export function clampEstimateArea(area: number) {
  const safe = Number.isFinite(area) ? area : ESTIMATE_AREA_MIN;
  return Math.max(ESTIMATE_AREA_MIN, Math.min(ESTIMATE_AREA_MAX, safe));
}

export function computeEstimate({ type, area, quality, city, pace }: EstimateInput): EstimateResult {
  const safeArea = clampEstimateArea(area);
  const total =
    safeArea * typeRate[type] * qualityFactor[quality] * cityFactor[city] * paceFactor[pace];
  const months = Math.max(4, Math.ceil((safeArea / typeProductivity[type]) * paceDuration[pace]));

  return {
    low: total * 0.92,
    high: total * 1.08,
    total,
    months,
    perM2: total / safeArea,
  };
}
