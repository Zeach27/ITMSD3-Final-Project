import { Point, BrushType } from '@/src/state/types';

interface BrushResult {
  pathString: string;
  points: Point[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deterministicNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function catmullRom(points: Point[]): Point[] {
  if (points.length < 3) {
    return points;
  }

  const smoothed: Point[] = [points[0]];

  for (let i = 0; i < points.length - 2; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3] ?? p2;

    for (let t = 0.15; t <= 1.0; t += 0.15) {
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (
        2 * p1.x +
        (p2.x - p0.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (3 * p1.x - p0.x - 3 * p2.x + p3.x) * t3
      );
      const y = 0.5 * (
        2 * p1.y +
        (p2.y - p0.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (3 * p1.y - p0.y - 3 * p2.y + p3.y) * t3
      );
      smoothed.push({ x, y, pressure: p1.pressure, time: p1.time });
    }

    smoothed.push(p2);
  }

  return smoothed;
}

function pressureFromPosition(
  index: number,
  total: number,
  brushType: BrushType,
  point: Point,
  previousPoint?: Point,
): number {
  if (total < 2) return 1.0;

  // Custom organic tapering ranges and profiles for each brush type
  let taper = 1.0;
  
  if (brushType === 'syrup' || brushType === 'studioPen' || brushType === 'gesinskiInk') {
    // Beautiful Procreate-style extremely sharp endpoints
    const taperRange = Math.min(22, Math.ceil(total * 0.35));
    if (index < taperRange) {
      taper = 0.02 + (index / taperRange) * 0.98;
    } else if (index > total - taperRange) {
      taper = 0.02 + ((total - index) / taperRange) * 0.98;
    }
  } else if (brushType === 'technicalPen' || brushType === 'pencil' || brushType === 'ink' || brushType === 'watercolor') {
    // Moderate tapering at the ends
    const taperRange = Math.min(10, Math.ceil(total * 0.15));
    if (index < taperRange) {
      taper = 0.35 + (index / taperRange) * 0.65;
    } else if (index > total - taperRange) {
      taper = 0.35 + ((total - index) / taperRange) * 0.65;
    }
  } else if (brushType === 'inkBleed' || brushType === 'dryInk') {
    // Organic medium taper
    const taperRange = Math.min(16, Math.ceil(total * 0.22));
    if (index < taperRange) {
      taper = 0.15 + (index / taperRange) * 0.85;
    } else if (index > total - taperRange) {
      taper = 0.15 + ((total - index) / taperRange) * 0.85;
    }
  } else if (brushType === 'gelPen' || brushType === 'marker') {
    // Absolutely no tapering for gel pens and markers!
    taper = 1.0;
  }

  let pressure = 1.0;
  const jitter = deterministicNoise(index + 1) * 0.12;

  switch (brushType) {
    case 'pencil':
      pressure = 0.4 + (index / Math.max(1, total - 1)) * 0.6;
      pressure = clamp(pressure + jitter * 0.35, 0.3, 1);
      break;
    case 'ink': {
      const speed = previousPoint && point.time !== undefined && previousPoint.time !== undefined
        ? distance(previousPoint, point) / Math.max(1, point.time - previousPoint.time)
        : 0;
      const normalizedSpeed = clamp(speed / 0.5, 0, 1);
      pressure = 0.5 + (1 - normalizedSpeed) * 0.5;
      pressure = clamp(pressure + jitter * 0.1, 0.3, 1);
      break;
    }
    case 'watercolor':
      pressure = 0.6 + deterministicNoise(index + 7) * 0.15;
      break;
    case 'marker':
      pressure = 0.9 + deterministicNoise(index + 9) * 0.05;
      break;
    case 'syrup':
      pressure = 0.85 + deterministicNoise(index + 11) * 0.08;
      break;
    case 'thylacine':
      pressure = 0.45 + deterministicNoise(index + 13) * 0.4;
      break;
    case 'fineTip':
      pressure = 1.0;
      break;
    case 'technicalPen':
      pressure = 0.95;
      break;
    case 'gelPen':
      pressure = 1.0;
      break;
    case 'inkBleed':
      pressure = 0.75 + deterministicNoise(index + 17) * 0.2;
      break;
    case 'studioPen':
      pressure = 0.85 + deterministicNoise(index + 19) * 0.1;
      break;
    case 'dryInk':
      pressure = 0.6 + deterministicNoise(index + 21) * 0.25;
      break;
    case 'gesinskiInk':
      pressure = 0.65 + deterministicNoise(index + 23) * 0.3;
      break;
  }

  return clamp(pressure * taper, 0.01, 1.0);
}

// Generates a beautiful variable-width filled outline polygon path
function makeFilledPath(points: Point[], brushType: BrushType, brushSize: number): string {
  if (points.length === 0) return '';

  const smoothedPoints = catmullRom(points);
  const n = smoothedPoints.length;

  if (n === 1) {
    const p = smoothedPoints[0];
    const r = (brushSize * (p.pressure ?? 1)) / 2;
    return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)} m -${r.toFixed(2)} 0 a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(r * 2).toFixed(2)} 0 a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 -${(r * 2).toFixed(2)} 0`;
  }

  const leftPts: { x: number; y: number }[] = [];
  const rightPts: { x: number; y: number }[] = [];
  const radii: number[] = [];

  for (let i = 0; i < n; i++) {
    const curr = smoothedPoints[i];
    const next = smoothedPoints[i + 1] ?? curr;
    const prev = smoothedPoints[i - 1] ?? curr;

    let dx = 0;
    let dy = 0;

    if (i === 0) {
      dx = next.x - curr.x;
      dy = next.y - curr.y;
    } else if (i === n - 1) {
      dx = curr.x - prev.x;
      dy = curr.y - prev.y;
    } else {
      dx = next.x - prev.x;
      dy = next.y - prev.y;
    }

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const tx = dx / len;
    const ty = dy / len;

    const nx = -ty;
    const ny = tx;

    // Apply custom scaling factor per brush
    let scale = 1.0;
    switch (brushType) {
      case 'fineTip':
        scale = 0.35;
        break;
      case 'marker':
        scale = 2.2;
        break;
      case 'syrup':
        scale = 1.35;
        break;
      case 'studioPen':
        scale = 1.25;
        break;
      case 'gesinskiInk':
        scale = 1.35;
        break;
      case 'gelPen':
        scale = 1.05;
        break;
      case 'technicalPen':
        scale = 0.85;
        break;
      case 'inkBleed':
        scale = 1.2;
        break;
      case 'dryInk':
        scale = 0.95;
        break;
      case 'thylacine':
        scale = 1.0;
        break;
      case 'pencil':
        scale = 0.8;
        break;
      case 'watercolor':
        scale = 1.5;
        break;
      case 'ink':
        scale = 0.95;
        break;
    }

    const r = Math.max(0.1, (brushSize * scale * (curr.pressure ?? 1)) / 2);
    radii.push(r);

    // Add noise for rough organic brushes
    if (brushType === 'inkBleed' || brushType === 'dryInk' || brushType === 'thylacine' || brushType === 'marker' || brushType === 'pencil' || brushType === 'watercolor' || brushType === 'gesinskiInk') {
      let noiseAmount = 0.15;
      if (brushType === 'pencil') noiseAmount = 0.08; // subtle graphite texture
      if (brushType === 'watercolor' || brushType === 'gesinskiInk') noiseAmount = 0.05; // soft fluid spread
      
      const jScale = r * noiseAmount;
      const noiseL = deterministicNoise(i * 3 + 1) - 0.5;
      const noiseR = deterministicNoise(i * 3 + 2) - 0.5;
      leftPts.push({
        x: curr.x + nx * r + nx * noiseL * jScale,
        y: curr.y + ny * r + ny * noiseL * jScale,
      });
      rightPts.push({
        x: curr.x - nx * r - nx * noiseR * jScale,
        y: curr.y - ny * r - ny * noiseR * jScale,
      });
    } else {
      leftPts.push({ x: curr.x + nx * r, y: curr.y + ny * r });
      rightPts.push({ x: curr.x - nx * r, y: curr.y - ny * r });
    }
  }

  // Construct closed SVG outline string
  const pathParts: string[] = [];

  // Start left
  pathParts.push(`M ${leftPts[0].x.toFixed(2)} ${leftPts[0].y.toFixed(2)}`);

  // Left boundary
  for (let i = 1; i < n; i++) {
    pathParts.push(`L ${leftPts[i].x.toFixed(2)} ${leftPts[i].y.toFixed(2)}`);
  }

  // Round end cap
  const rEnd = radii[n - 1];
  pathParts.push(`A ${rEnd.toFixed(2)} ${rEnd.toFixed(2)} 0 0 1 ${rightPts[n - 1].x.toFixed(2)} ${rightPts[n - 1].y.toFixed(2)}`);

  // Right boundary back
  for (let i = n - 2; i >= 0; i--) {
    pathParts.push(`L ${rightPts[i].x.toFixed(2)} ${rightPts[i].y.toFixed(2)}`);
  }

  // Round start cap
  const rStart = radii[0];
  pathParts.push(`A ${rStart.toFixed(2)} ${rStart.toFixed(2)} 0 0 1 ${leftPts[0].x.toFixed(2)} ${leftPts[0].y.toFixed(2)}`);

  pathParts.push('Z');
  return pathParts.join(' ');
}

export const BrushEngine = {
  generateStroke(points: Point[], brushType: BrushType, brushSize?: number): BrushResult {
    const size = brushSize ?? 10;
    const finalPoints = points.map((point, index) => {
      const pressure = pressureFromPosition(
        index,
        points.length,
        brushType,
        point,
        points[index - 1],
      );
      return {
        ...point,
        pressure,
      };
    });

    const pathString = makeFilledPath(finalPoints, brushType, size);
    return { pathString, points: finalPoints };
  },
};
