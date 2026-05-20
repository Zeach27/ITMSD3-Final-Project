import { hexToRgb, rgbToHex, rgbToHsb, hsbToRgb, hsbToHex, hexToHsb } from '@/src/utils/colorUtils';

describe('colorUtils', () => {
  it('hexToRgb converts #FF0000 to red (255,0,0)', () => {
    const result = hexToRgb('#FF0000');
    expect(result).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('rgbToHex converts (0, 255, 0) to #00ff00', () => {
    const result = rgbToHex(0, 255, 0);
    expect(result.toLowerCase()).toBe('#00ff00');
  });

  it('rgbToHsb for red (255,0,0) returns h=0, s=1, b=1', () => {
    const result = rgbToHsb(255, 0, 0);
    expect(result.h).toBe(0);
    expect(result.s).toBe(1);
    expect(result.b).toBe(1);
  });

  it('hsbToRgb for h=0, s=0, b=0 returns black', () => {
    const result = hsbToRgb(0, 0, 0);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it('hexToHsb + hsbToHex round-trips preserves values', () => {
    const original = '#5856D6';
    const hsb = hexToHsb(original);
    const result = hsbToHex(hsb.h, hsb.s, hsb.b);
    expect(result.toUpperCase()).toBe(original.toUpperCase());
  });

  it('hsbToRgb + rgbToHsb round-trips preserves values', () => {
    const hsb = rgbToHsb(100, 150, 200);
    const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
    expect(Math.round(rgb.r)).toBe(100);
    expect(Math.round(rgb.g)).toBe(150);
    expect(Math.round(rgb.b)).toBe(200);
  });

  it('handles hex without hash prefix', () => {
    const result = hexToRgb('00FF00');
    expect(result).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('handles invalid hex gracefully', () => {
    const result = hexToRgb('not-a-color');
    expect(result).toEqual({ r: 0, g: 0, b: 0 });
  });
});
