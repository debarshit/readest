import { describe, expect, it } from 'vitest';
import {
  ALL_REGIONS,
  detectUserRegion,
  YOMI_REGIONAL_PRICING,
} from '@/app/user/utils/regionalPricing';
import { getPlanDetails, getYearlySavingsPercent } from '@/app/user/utils/plan';

describe('regionalPricing', () => {
  it('defines all 13 required regional pricing tiers accurately', () => {
    expect(ALL_REGIONS.length).toBe(13);

    // India
    expect(YOMI_REGIONAL_PRICING.IN.monthly.formatted).toBe('₹149');
    expect(YOMI_REGIONAL_PRICING.IN.yearly.formatted).toBe('₹999');
    expect(YOMI_REGIONAL_PRICING.IN.yearly.monthlyEquivalentFormatted).toBe('₹83.25');
    expect(YOMI_REGIONAL_PRICING.IN.savingsPercent).toBe(44);

    // US
    expect(YOMI_REGIONAL_PRICING.US.monthly.formatted).toBe('$3.99');
    expect(YOMI_REGIONAL_PRICING.US.yearly.formatted).toBe('$29.99');
    expect(YOMI_REGIONAL_PRICING.US.savingsPercent).toBe(37);

    // UK
    expect(YOMI_REGIONAL_PRICING.GB.monthly.formatted).toBe('£3.49');
    expect(YOMI_REGIONAL_PRICING.GB.yearly.formatted).toBe('£24.99');
    expect(YOMI_REGIONAL_PRICING.GB.savingsPercent).toBe(40);

    // Europe
    expect(YOMI_REGIONAL_PRICING.EU.monthly.formatted).toBe('€3.99');
    expect(YOMI_REGIONAL_PRICING.EU.yearly.formatted).toBe('€29.99');
    expect(YOMI_REGIONAL_PRICING.EU.savingsPercent).toBe(37);

    // Canada
    expect(YOMI_REGIONAL_PRICING.CA.monthly.formatted).toBe('C$4.99');
    expect(YOMI_REGIONAL_PRICING.CA.yearly.formatted).toBe('C$34.99');
    expect(YOMI_REGIONAL_PRICING.CA.savingsPercent).toBe(41);

    // Australia
    expect(YOMI_REGIONAL_PRICING.AU.monthly.formatted).toBe('A$5.99');
    expect(YOMI_REGIONAL_PRICING.AU.yearly.formatted).toBe('A$44.99');
    expect(YOMI_REGIONAL_PRICING.AU.savingsPercent).toBe(37);

    // Singapore
    expect(YOMI_REGIONAL_PRICING.SG.monthly.formatted).toBe('S$5.48');
    expect(YOMI_REGIONAL_PRICING.SG.yearly.formatted).toBe('S$39.98');
    expect(YOMI_REGIONAL_PRICING.SG.savingsPercent).toBe(39);

    // UAE
    expect(YOMI_REGIONAL_PRICING.AE.monthly.formatted).toBe('AED 14.99');
    expect(YOMI_REGIONAL_PRICING.AE.yearly.formatted).toBe('AED 99.99');
    expect(YOMI_REGIONAL_PRICING.AE.savingsPercent).toBe(44);

    // Japan
    expect(YOMI_REGIONAL_PRICING.JP.monthly.formatted).toBe('¥500');
    expect(YOMI_REGIONAL_PRICING.JP.yearly.formatted).toBe('¥3,500');
    expect(YOMI_REGIONAL_PRICING.JP.savingsPercent).toBe(41);

    // Korea
    expect(YOMI_REGIONAL_PRICING.KR.monthly.formatted).toBe('₩5,500');
    expect(YOMI_REGIONAL_PRICING.KR.yearly.formatted).toBe('₩39,000');
    expect(YOMI_REGIONAL_PRICING.KR.savingsPercent).toBe(41);

    // Brazil
    expect(YOMI_REGIONAL_PRICING.BR.monthly.formatted).toBe('R$14.90');
    expect(YOMI_REGIONAL_PRICING.BR.yearly.formatted).toBe('R$99.90');
    expect(YOMI_REGIONAL_PRICING.BR.savingsPercent).toBe(44);

    // Mexico
    expect(YOMI_REGIONAL_PRICING.MX.monthly.formatted).toBe('MX$69');
    expect(YOMI_REGIONAL_PRICING.MX.yearly.formatted).toBe('MX$499');
    expect(YOMI_REGIONAL_PRICING.MX.savingsPercent).toBe(40);

    // Indonesia
    expect(YOMI_REGIONAL_PRICING.ID.monthly.formatted).toBe('Rp 49,000');
    expect(YOMI_REGIONAL_PRICING.ID.yearly.formatted).toBe('Rp 349,000');
    expect(YOMI_REGIONAL_PRICING.ID.savingsPercent).toBe(40);
  });

  it('correctly detects region based on timezone and locale heuristics', () => {
    expect(detectUserRegion('Asia/Kolkata', 'en-IN').regionCode).toBe('IN');
    expect(detectUserRegion('Asia/Calcutta', 'en-US').regionCode).toBe('IN');
    expect(detectUserRegion('Europe/London', 'en-GB').regionCode).toBe('GB');
    expect(detectUserRegion('Asia/Tokyo', 'ja-JP').regionCode).toBe('JP');
    expect(detectUserRegion('Asia/Seoul', 'ko-KR').regionCode).toBe('KR');
    expect(detectUserRegion('Asia/Singapore', 'en-SG').regionCode).toBe('SG');
    expect(detectUserRegion('Asia/Dubai', 'en-AE').regionCode).toBe('AE');
    expect(detectUserRegion('America/Sao_Paulo', 'pt-BR').regionCode).toBe('BR');
    expect(detectUserRegion('America/Mexico_City', 'es-MX').regionCode).toBe('MX');
    expect(detectUserRegion('America/Toronto', 'en-CA').regionCode).toBe('CA');
    expect(detectUserRegion('Australia/Sydney', 'en-AU').regionCode).toBe('AU');
    expect(detectUserRegion('Europe/Berlin', 'de-DE').regionCode).toBe('EU');
    expect(detectUserRegion('Europe/Paris', 'fr-FR').regionCode).toBe('EU');
    expect(detectUserRegion('America/New_York', 'en-US').regionCode).toBe('US');
  });

  it('populates regional pricing details into getPlanDetails for plus tier', () => {
    const indiaPricing = YOMI_REGIONAL_PRICING.IN;
    const monthlyPlus = getPlanDetails('plus', [], 'month', indiaPricing);
    expect(monthlyPlus.currency).toBe('INR');
    expect(monthlyPlus.price).toBe(14900);
    expect(monthlyPlus.formattedPrice).toBe('₹149');
    expect(monthlyPlus.monthlyEquivalentFormatted).toBe('₹149');

    const yearlyPlus = getPlanDetails('plus', [], 'year', indiaPricing);
    expect(yearlyPlus.currency).toBe('INR');
    expect(yearlyPlus.price).toBe(99900);
    expect(yearlyPlus.formattedPrice).toBe('₹999');
    expect(yearlyPlus.monthlyEquivalentFormatted).toBe('₹83.25');
  });

  it('returns regional savings percent when availablePlans is empty', () => {
    const indiaPricing = YOMI_REGIONAL_PRICING.IN;
    expect(getYearlySavingsPercent([], indiaPricing)).toBe(44);

    const usPricing = YOMI_REGIONAL_PRICING.US;
    expect(getYearlySavingsPercent([], usPricing)).toBe(37);
  });
});
