import { BrushType, Point } from '@/src/state/types';

export interface BrushRenderConfig {
  filter?: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeLinejoin: 'round' | 'bevel' | 'miter';
  strokeLinecap: 'round' | 'butt' | 'square';
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function averagePressure(points?: Point[]): number {
  if (!points || points.length === 0) return 1;
  const sum = points.reduce((total, point) => total + (point.pressure ?? 1), 0);
  return sum / points.length;
}

export function getBrushRenderConfig(
  brushType: BrushType,
  brushSize: number,
  opacity: number,
  points?: Point[],
): BrushRenderConfig {
  const pressureFactor = averagePressure(points);
  const baseWidth = clamp(brushSize * Math.max(0.8, Math.min(1.2, pressureFactor)), 1, Infinity);

  let filter: string | undefined = undefined;
  let strokeOpacity = opacity;
  let strokeWidth = baseWidth;
  let strokeLinejoin: 'round' | 'bevel' | 'miter' = 'round';
  let strokeLinecap: 'round' | 'butt' | 'square' = 'round';

  switch (brushType) {
    case 'pencil':
      strokeOpacity = Math.min(opacity, 0.7); // Faded graphite look
      strokeWidth = Math.max(1.5, baseWidth * 0.9);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'ink':
      strokeOpacity = Math.min(opacity, 1.0); // Solid ink
      strokeWidth = Math.max(1, baseWidth * 1.0);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'watercolor':
      strokeOpacity = Math.min(opacity, 0.3); // Soft, light watercolor
      strokeWidth = Math.max(2, baseWidth * 2.0); // Much wider spread
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'marker':
      strokeOpacity = Math.min(opacity, 0.5); // Semi-transparent marker
      strokeWidth = Math.max(4, baseWidth * 2.5); // Wide, flat tip
      strokeLinecap = 'square';
      strokeLinejoin = 'miter';
      break;
    case 'syrup':
      strokeOpacity = Math.min(opacity, 0.9);
      strokeWidth = Math.max(1, baseWidth * 1.35);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'thylacine':
      strokeOpacity = Math.min(opacity, 0.75);
      strokeWidth = Math.max(1, baseWidth * 1.0);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'fineTip':
      strokeOpacity = Math.min(opacity, 0.95);
      strokeWidth = Math.max(1, baseWidth * 0.45);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'technicalPen':
      strokeOpacity = Math.min(opacity, 0.92);
      strokeWidth = Math.max(1, baseWidth * 1.05);
      strokeLinecap = 'butt';
      strokeLinejoin = 'miter';
      break;
    case 'gelPen':
      strokeOpacity = Math.min(opacity, 0.82);
      strokeWidth = Math.max(1, baseWidth * 1.15);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'inkBleed':
      strokeOpacity = Math.min(opacity, 0.63);
      strokeWidth = Math.max(1, baseWidth * 1.5);
      strokeLinecap = 'round';
      strokeLinejoin = 'bevel';
      break;
    case 'studioPen':
      strokeOpacity = Math.min(opacity, 0.88);
      strokeWidth = Math.max(1, baseWidth * 1.25);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'dryInk':
      strokeOpacity = Math.min(opacity, 0.68);
      strokeWidth = Math.max(1, baseWidth * 1.0);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    case 'gesinskiInk':
      strokeOpacity = Math.min(opacity, 0.82);
      strokeWidth = Math.max(1, baseWidth * 1.3);
      strokeLinecap = 'round';
      strokeLinejoin = 'round';
      break;
    default:
      strokeWidth = baseWidth;
  }

  return {
    filter,
    strokeOpacity,
    strokeWidth,
    strokeLinejoin,
    strokeLinecap,
  };
}
