import { distanceMeters, formatDistance, formatRadius } from '../src/utils/geo';

describe('geo utils', () => {
  it('computes zero distance for identical points', () => {
    expect(distanceMeters(24.86, 67.0, 24.86, 67.0)).toBe(0);
  });

  it('computes a known distance (~111km per degree latitude)', () => {
    const d = distanceMeters(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });

  it('formats distances', () => {
    expect(formatDistance(240)).toBe('240 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('formats radii', () => {
    expect(formatRadius(500)).toBe('500 m');
    expect(formatRadius(1000)).toBe('1 km');
  });
});
