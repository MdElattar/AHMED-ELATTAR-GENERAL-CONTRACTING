/**
 * Multi-currency conversion for the preliminary estimator and proposal PDF.
 *
 * Rates are expressed as units of the target currency per 1 SAR. The Saudi
 * riyal is pegged to the US dollar, so the fallback is stable; the live source
 * is used when reachable and cached briefly to avoid hammering it on every
 * keystroke.
 */

export const CURRENCIES = ["SAR", "USD", "EGP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export type ExchangeRates = {
  base: "SAR";
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  source: "live" | "fallback";
};

export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  SAR: 1,
  USD: 0.2667,
  EGP: 13.1,
};

export const CURRENCY_META: Record<
  CurrencyCode,
  { ar: string; en: string; labelAr: string; labelEn: string }
> = {
  SAR: { ar: "ر.س", en: "SAR", labelAr: "ريال سعودي", labelEn: "Saudi Riyal" },
  USD: { ar: "$", en: "USD", labelAr: "دولار أمريكي", labelEn: "US Dollar" },
  EGP: { ar: "ج.م", en: "EGP", labelAr: "جنيه مصري", labelEn: "Egyptian Pound" },
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const FALLBACK_TTL_MS = 5 * 60 * 1000;

let cache: { value: ExchangeRates; expiresAt: number } | null = null;

export async function getExchangeRates(): Promise<ExchangeRates> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/SAR", {
      signal: AbortSignal.timeout(4500),
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`rates_http_${response.status}`);

    const payload = (await response.json()) as {
      rates?: Record<string, unknown>;
      time_last_update_unix?: number;
    };
    const usd = Number(payload.rates?.USD);
    const egp = Number(payload.rates?.EGP);
    if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(egp) || egp <= 0) {
      throw new Error("rates_invalid");
    }

    const value: ExchangeRates = {
      base: "SAR",
      rates: { SAR: 1, USD: usd, EGP: egp },
      updatedAt: payload.time_last_update_unix
        ? new Date(payload.time_last_update_unix * 1000).toISOString()
        : new Date().toISOString(),
      source: "live",
    };
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch {
    const value: ExchangeRates = {
      base: "SAR",
      rates: FALLBACK_RATES,
      updatedAt: new Date().toISOString(),
      source: "fallback",
    };
    cache = { value, expiresAt: Date.now() + FALLBACK_TTL_MS };
    return value;
  }
}

export function convertFromSar(
  amountSar: number,
  currency: CurrencyCode,
  rates: Record<CurrencyCode, number>,
): number {
  return amountSar * rates[currency];
}

export function formatMoney(
  amountSar: number,
  currency: CurrencyCode,
  locale: "ar" | "en",
  options: { compact?: boolean; rates?: Record<CurrencyCode, number> } = {},
): string {
  const rate = options.rates?.[currency] ?? FALLBACK_RATES[currency];
  return formatCurrencyValue(amountSar * rate, currency, locale, options);
}

export function formatCurrencyValue(
  amount: number,
  currency: CurrencyCode,
  locale: "ar" | "en",
  options: { compact?: boolean } = {},
): string {
  const meta = CURRENCY_META[currency];
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.compact ? 1 : 0,
  });
  return `${formatter.format(Math.round(amount))} ${meta[locale]}`;
}

export function formatRateLine(rates: ExchangeRates, locale: "ar" | "en"): string {
  const usd = rates.rates.USD.toFixed(4);
  const egp = rates.rates.EGP.toFixed(2);
  return locale === "ar"
    ? `١ ر.س = ${usd} دولار · ${egp} جنيه`
    : `1 SAR = ${usd} USD · ${egp} EGP`;
}
