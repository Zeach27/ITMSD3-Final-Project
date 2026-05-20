export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsb(r: number, g: number, b: number): { h: number; s: number; b: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, b: max };
}

export function hsbToRgb(h: number, s: number, b: number): { r: number; g: number; b: number } {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);
  let r = 0, g = 0, blue = 0;
  switch (i % 6) {
    case 0: r = b; g = t; blue = p; break;
    case 1: r = q; g = b; blue = p; break;
    case 2: r = p; g = b; blue = t; break;
    case 3: r = p; g = q; blue = b; break;
    case 4: r = t; g = p; blue = b; break;
    case 5: r = b; g = p; blue = q; break;
  }
  return { r: r * 255, g: g * 255, b: blue * 255 };
}

export function hsbToHex(h: number, s: number, b: number): string {
  const { r, g, b: blue } = hsbToRgb(h, s, b);
  return rgbToHex(r, g, blue);
}

export function hexToHsb(hex: string): { h: number; s: number; b: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsb(r, g, b);
}
