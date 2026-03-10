import { describe, it, expect } from 'vitest';
import {
  calcSaturationVaporPressure,
  calculatePsychrometricsFromDryBulb,
  calculatePsychrometricsFromWetBulb,
  findDryBulbFromWetBulbAndRh,
} from '../utils/psychrometrics';

describe('calcSaturationVaporPressure', () => {
  it('returns ~6.11 hPa at 0°C (ice point)', () => {
    expect(calcSaturationVaporPressure(0)).toBeCloseTo(6.11, 1);
  });

  it('returns ~23.37 hPa at 20°C', () => {
    expect(calcSaturationVaporPressure(20)).toBeCloseTo(23.37, 1);
  });

  it('returns increasing values with temperature', () => {
    expect(calcSaturationVaporPressure(30)).toBeGreaterThan(calcSaturationVaporPressure(20));
  });
});

describe('calculatePsychrometricsFromDryBulb', () => {
  it('returns zeros for invalid RH', () => {
    const result = calculatePsychrometricsFromDryBulb(70, 0);
    expect(result.gpp).toBe(0);
    expect(result.dewPoint).toBe(0);
  });

  it('calculates GPP in a reasonable range for typical conditions (70°F, 50% RH)', () => {
    const result = calculatePsychrometricsFromDryBulb(70, 50);
    expect(result.gpp).toBeGreaterThan(40);
    expect(result.gpp).toBeLessThan(70);
  });

  it('dew point is below dry bulb for RH < 100%', () => {
    const result = calculatePsychrometricsFromDryBulb(75, 60);
    expect(result.dewPoint).toBeLessThan(75);
  });

  it('dew point approaches dry bulb as RH approaches 100%', () => {
    const result = calculatePsychrometricsFromDryBulb(70, 99);
    expect(result.dewPoint).toBeCloseTo(70, 0);
  });

  it('GPP increases with higher RH at same temperature', () => {
    const lo = calculatePsychrometricsFromDryBulb(70, 40);
    const hi = calculatePsychrometricsFromDryBulb(70, 80);
    expect(hi.gpp).toBeGreaterThan(lo.gpp);
  });
});

describe('findDryBulbFromWetBulbAndRh', () => {
  it('returns wet bulb temp when RH is 100%', () => {
    expect(findDryBulbFromWetBulbAndRh(65, 100)).toBe(65);
  });

  it('returns NaN for invalid inputs', () => {
    expect(findDryBulbFromWetBulbAndRh(NaN, 50)).toBeNaN();
    expect(findDryBulbFromWetBulbAndRh(65, 0)).toBeNaN();
  });

  it('dry bulb >= wet bulb for RH < 100%', () => {
    const dryBulb = findDryBulbFromWetBulbAndRh(65, 60);
    expect(dryBulb).toBeGreaterThanOrEqual(65);
  });
});

describe('calculatePsychrometricsFromWetBulb', () => {
  it('returns zeros on invalid input', () => {
    const result = calculatePsychrometricsFromWetBulb(NaN, 50);
    expect(result.dryBulb).toBe(0);
    expect(result.gpp).toBe(0);
  });

  it('produces consistent values pipeline: wet bulb → dry bulb → GPP', () => {
    const result = calculatePsychrometricsFromWetBulb(60, 70);
    expect(result.dryBulb).toBeGreaterThan(0);
    expect(result.gpp).toBeGreaterThan(0);
    expect(result.dewPoint).toBeLessThan(result.dryBulb);
  });
});
