export type RegionCode =
  | 'IN'
  | 'US'
  | 'GB'
  | 'EU'
  | 'CA'
  | 'AU'
  | 'SG'
  | 'AE'
  | 'JP'
  | 'KR'
  | 'BR'
  | 'MX'
  | 'ID';

export interface RegionalPricingPlan {
  amount: number; // in minor units (e.g. cents, paise) or zero-decimal units (JPY, KRW)
  formatted: string;
  monthlyEquivalentFormatted: string; // Used when annual is selected (e.g. "₹83.25")
}

export interface RegionPricing {
  regionCode: RegionCode;
  currency: string;
  flag: string;
  name: string;
  currencySymbol: string;
  monthly: RegionalPricingPlan;
  yearly: RegionalPricingPlan;
  savingsPercent: number;
  positioning?: string;
  isZeroDecimal?: boolean;
}

export const YOMI_REGIONAL_PRICING: Record<RegionCode, RegionPricing> = {
  IN: {
    regionCode: 'IN',
    currency: 'INR',
    flag: '🇮🇳',
    name: 'India',
    currencySymbol: '₹',
    monthly: {
      amount: 14900,
      formatted: '₹149',
      monthlyEquivalentFormatted: '₹149',
    },
    yearly: {
      amount: 99900,
      formatted: '₹999',
      monthlyEquivalentFormatted: '₹83.25',
    },
    savingsPercent: 44,
    positioning: 'Matches Netflix Mobile / YouTube Premium; frictionless UPI',
  },
  US: {
    regionCode: 'US',
    currency: 'USD',
    flag: '🇺🇸',
    name: 'United States',
    currencySymbol: '$',
    monthly: {
      amount: 399,
      formatted: '$3.99',
      monthlyEquivalentFormatted: '$3.99',
    },
    yearly: {
      amount: 2999,
      formatted: '$29.99',
      monthlyEquivalentFormatted: '$2.50',
    },
    savingsPercent: 37,
    positioning: 'Underpriced relative to Readest Plus ($4.99)',
  },
  GB: {
    regionCode: 'GB',
    currency: 'GBP',
    flag: '🇬🇧',
    name: 'United Kingdom',
    currencySymbol: '£',
    monthly: {
      amount: 349,
      formatted: '£3.49',
      monthlyEquivalentFormatted: '£3.49',
    },
    yearly: {
      amount: 2499,
      formatted: '£24.99',
      monthlyEquivalentFormatted: '£2.08',
    },
    savingsPercent: 40,
    positioning: 'Low-friction British Pound price point',
  },
  EU: {
    regionCode: 'EU',
    currency: 'EUR',
    flag: '🇪🇺',
    name: 'Europe',
    currencySymbol: '€',
    monthly: {
      amount: 399,
      formatted: '€3.99',
      monthlyEquivalentFormatted: '€3.99',
    },
    yearly: {
      amount: 2999,
      formatted: '€29.99',
      monthlyEquivalentFormatted: '€2.50',
    },
    savingsPercent: 37,
    positioning: 'Clean Euro standard',
  },
  CA: {
    regionCode: 'CA',
    currency: 'CAD',
    flag: '🇨🇦',
    name: 'Canada',
    currencySymbol: 'C$',
    monthly: {
      amount: 499,
      formatted: 'C$4.99',
      monthlyEquivalentFormatted: 'C$4.99',
    },
    yearly: {
      amount: 3499,
      formatted: 'C$34.99',
      monthlyEquivalentFormatted: 'C$2.92',
    },
    savingsPercent: 41,
    positioning: 'Localized CAD',
  },
  AU: {
    regionCode: 'AU',
    currency: 'AUD',
    flag: '🇦🇺',
    name: 'Australia',
    currencySymbol: 'A$',
    monthly: {
      amount: 599,
      formatted: 'A$5.99',
      monthlyEquivalentFormatted: 'A$5.99',
    },
    yearly: {
      amount: 4499,
      formatted: 'A$44.99',
      monthlyEquivalentFormatted: 'A$3.75',
    },
    savingsPercent: 37,
    positioning: 'Localized AUD',
  },
  SG: {
    regionCode: 'SG',
    currency: 'SGD',
    flag: '🇸🇬',
    name: 'Singapore',
    currencySymbol: 'S$',
    monthly: {
      amount: 548,
      formatted: 'S$5.48',
      monthlyEquivalentFormatted: 'S$5.48',
    },
    yearly: {
      amount: 3998,
      formatted: 'S$39.98',
      monthlyEquivalentFormatted: 'S$3.33',
    },
    savingsPercent: 39,
    positioning: 'Localized SGD',
  },
  AE: {
    regionCode: 'AE',
    currency: 'AED',
    flag: '🇦🇪',
    name: 'United Arab Emirates',
    currencySymbol: 'AED ',
    monthly: {
      amount: 1499,
      formatted: 'AED 14.99',
      monthlyEquivalentFormatted: 'AED 14.99',
    },
    yearly: {
      amount: 9999,
      formatted: 'AED 99.99',
      monthlyEquivalentFormatted: 'AED 8.33',
    },
    savingsPercent: 44,
    positioning: 'Under 15 AED / 100 AED psychological thresholds',
  },
  JP: {
    regionCode: 'JP',
    currency: 'JPY',
    flag: '🇯🇵',
    name: 'Japan',
    currencySymbol: '¥',
    isZeroDecimal: true,
    monthly: {
      amount: 500,
      formatted: '¥500',
      monthlyEquivalentFormatted: '¥500',
    },
    yearly: {
      amount: 3500,
      formatted: '¥3,500',
      monthlyEquivalentFormatted: '¥292',
    },
    savingsPercent: 41,
    positioning: 'Familiar one-coin (500-yen) monthly price',
  },
  KR: {
    regionCode: 'KR',
    currency: 'KRW',
    flag: '🇰🇷',
    name: 'South Korea',
    currencySymbol: '₩',
    isZeroDecimal: true,
    monthly: {
      amount: 5500,
      formatted: '₩5,500',
      monthlyEquivalentFormatted: '₩5,500',
    },
    yearly: {
      amount: 39000,
      formatted: '₩39,000',
      monthlyEquivalentFormatted: '₩3,250',
    },
    savingsPercent: 41,
    positioning: 'Standard round won pricing',
  },
  BR: {
    regionCode: 'BR',
    currency: 'BRL',
    flag: '🇧🇷',
    name: 'Brazil',
    currencySymbol: 'R$',
    monthly: {
      amount: 1490,
      formatted: 'R$14.90',
      monthlyEquivalentFormatted: 'R$14.90',
    },
    yearly: {
      amount: 9990,
      formatted: 'R$99.90',
      monthlyEquivalentFormatted: 'R$8.33',
    },
    savingsPercent: 44,
    positioning: 'Emerging market pricing',
  },
  MX: {
    regionCode: 'MX',
    currency: 'MXN',
    flag: '🇲🇽',
    name: 'Mexico',
    currencySymbol: 'MX$',
    monthly: {
      amount: 6900,
      formatted: 'MX$69',
      monthlyEquivalentFormatted: 'MX$69',
    },
    yearly: {
      amount: 49900,
      formatted: 'MX$499',
      monthlyEquivalentFormatted: 'MX$41.58',
    },
    savingsPercent: 40,
    positioning: 'Emerging market pricing',
  },
  ID: {
    regionCode: 'ID',
    currency: 'IDR',
    flag: '🇮🇩',
    name: 'Indonesia',
    currencySymbol: 'Rp ',
    isZeroDecimal: true,
    monthly: {
      amount: 49000,
      formatted: 'Rp 49,000',
      monthlyEquivalentFormatted: 'Rp 49,000',
    },
    yearly: {
      amount: 349000,
      formatted: 'Rp 349,000',
      monthlyEquivalentFormatted: 'Rp 29,083',
    },
    savingsPercent: 40,
    positioning: 'Emerging market pricing',
  },
};

export const ALL_REGIONS = Object.values(YOMI_REGIONAL_PRICING);

export const REGION_STORAGE_KEY = 'yomi_selected_pricing_region';

/**
 * Detects the user's region based on timezone, locale, or stored preference.
 */
export function detectUserRegion(
  explicitTimeZone?: string,
  explicitLocale?: string,
): RegionPricing {
  // Check stored override first if in browser
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(REGION_STORAGE_KEY) as RegionCode | null;
      if (stored && YOMI_REGIONAL_PRICING[stored]) {
        return YOMI_REGIONAL_PRICING[stored];
      }
    } catch {}
  }

  const tz =
    explicitTimeZone ||
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') ||
    '';
  const lang = explicitLocale || (typeof navigator !== 'undefined' ? navigator.language : '') || '';

  // Heuristic matching based on timezone and language/locale
  if (
    tz === 'Asia/Kolkata' ||
    tz === 'Asia/Calcutta' ||
    lang.endsWith('-IN') ||
    lang === 'hi' ||
    lang.startsWith('hi-') ||
    lang.startsWith('ta-') ||
    lang.startsWith('te-') ||
    lang.startsWith('bn-IN')
  ) {
    return YOMI_REGIONAL_PRICING.IN;
  }

  if (
    tz === 'Europe/London' ||
    tz === 'Europe/Belfast' ||
    tz === 'GB' ||
    lang === 'en-GB' ||
    lang.endsWith('-GB')
  ) {
    return YOMI_REGIONAL_PRICING.GB;
  }

  if (tz === 'Asia/Tokyo' || lang.startsWith('ja')) {
    return YOMI_REGIONAL_PRICING.JP;
  }

  if (tz === 'Asia/Seoul' || lang.startsWith('ko')) {
    return YOMI_REGIONAL_PRICING.KR;
  }

  if (tz === 'Asia/Singapore' || lang.endsWith('-SG')) {
    return YOMI_REGIONAL_PRICING.SG;
  }

  if (tz === 'Asia/Dubai' || tz === 'Asia/Muscat' || lang.endsWith('-AE')) {
    return YOMI_REGIONAL_PRICING.AE;
  }

  if (
    tz === 'Asia/Jakarta' ||
    tz === 'Asia/Pontianak' ||
    tz === 'Asia/Makassar' ||
    tz === 'Asia/Jayapura' ||
    lang.startsWith('id')
  ) {
    return YOMI_REGIONAL_PRICING.ID;
  }

  if (
    tz.startsWith('America/Sao_Paulo') ||
    tz.startsWith('America/Recife') ||
    tz.startsWith('America/Fortaleza') ||
    tz.startsWith('America/Belem') ||
    tz.startsWith('America/Manaus') ||
    tz.startsWith('America/Cuiaba') ||
    tz.startsWith('America/Bahia') ||
    lang === 'pt-BR' ||
    lang.endsWith('-BR')
  ) {
    return YOMI_REGIONAL_PRICING.BR;
  }

  if (
    tz.startsWith('America/Mexico_City') ||
    tz.startsWith('America/Cancun') ||
    tz.startsWith('America/Merida') ||
    tz.startsWith('America/Monterrey') ||
    tz.startsWith('America/Tijuana') ||
    tz.startsWith('America/Hermosillo') ||
    lang === 'es-MX' ||
    lang.endsWith('-MX')
  ) {
    return YOMI_REGIONAL_PRICING.MX;
  }

  if (
    tz.startsWith('America/Toronto') ||
    tz.startsWith('America/Vancouver') ||
    tz.startsWith('America/Montreal') ||
    tz.startsWith('America/Edmonton') ||
    tz.startsWith('America/Winnipeg') ||
    tz.startsWith('America/Halifax') ||
    tz.startsWith('America/St_Johns') ||
    lang.endsWith('-CA') ||
    lang === 'en-CA' ||
    lang === 'fr-CA'
  ) {
    return YOMI_REGIONAL_PRICING.CA;
  }

  if (
    tz.startsWith('Australia/') ||
    tz === 'Australia/Sydney' ||
    tz === 'Australia/Melbourne' ||
    tz === 'Australia/Brisbane' ||
    tz === 'Australia/Perth' ||
    tz === 'Australia/Adelaide' ||
    lang.endsWith('-AU') ||
    lang === 'en-AU'
  ) {
    return YOMI_REGIONAL_PRICING.AU;
  }

  if (
    (tz.startsWith('Europe/') && tz !== 'Europe/London' && tz !== 'Europe/Belfast') ||
    tz.startsWith('Atlantic/') ||
    [
      'de',
      'fr',
      'es',
      'it',
      'nl',
      'pt',
      'el',
      'fi',
      'sv',
      'pl',
      'cs',
      'sk',
      'hu',
      'ro',
      'bg',
      'hr',
      'da',
      'et',
      'lv',
      'lt',
      'sl',
    ].some((prefix) => lang === prefix || lang.startsWith(`${prefix}-`))
  ) {
    return YOMI_REGIONAL_PRICING.EU;
  }

  // Fallback to US
  return YOMI_REGIONAL_PRICING.US;
}

/**
 * Persists an explicit user region selection.
 */
export function setStoredUserRegion(regionCode: RegionCode): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(REGION_STORAGE_KEY, regionCode);
    } catch {}
  }
}
