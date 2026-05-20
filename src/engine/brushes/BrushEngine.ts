import { Point, BrushType } from '@/src/state/types';

interface BrushResult {
  pathString: string;
  points: Point[];
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

function pressureFromPosition(index: number, total: number, brushType: BrushType): number {
  if (total < 4) return 1;
  
  // Natural tapering at start and end (15% of stroke or max 12 points)
  const taperRange = Math.min(12, Math.ceil(total * 0.15));
  
  let pressure = 1.0;
  if (index < taperRange) {
    pressure = 0.2 + (index / taperRange) * 0.8;
  } else if (index > total - taperRange) {
    pressure = 0.2 + ((total - index) / taperRange) * 0.8;
  }
  
  // Add slight "jitter" to pencil for texture
  if (brushType === 'pencil') {
    pressure *= (0.9 + Math.random() * 0.2);
  }
  
  return pressure;
}

function makePath(points: Point[], brushType: BrushType): string {
  if (points.length === 0) {
    return '';
  }

  const pathParts: string[] = [];
  const smoothedPoints = catmullRom(points);

  if (smoothedPoints.length === 1) {
    const point = smoothedPoints[0];
    return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }

  if (smoothedPoints.length === 2) {
    const [first, second] = smoothedPoints;
    return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} L ${second.x.toFixed(2)} ${second.y.toFixed(2)}`;
  }

  let lastPoint: Point | null = null;
  smoothedPoints.forEach((point, index) => {
    if (index === 0) {
      pathParts.push(`M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
    } else if (lastPoint) {
      const midX = (lastPoint.x + point.x) / 2;
      const midY = (lastPoint.y + point.y) / 2;
      pathParts.push(`Q ${lastPoint.x.toFixed(2)} ${lastPoint.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`);
    }
    lastPoint = point;
  });

  if (brushType === 'watercolor' && smoothedPoints.length > 1) {
    const last = smoothedPoints[smoothedPoints.length - 1];
    pathParts.push(`L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`);
  }

  return pathParts.join(' ');
}

export const BrushEngine = {
  generateStroke(points: Point[], brushType: BrushType): BrushResult {
    const finalPoints = points.map((point, index) => {
      const pressure = pressureFromPosition(index, points.length, brushType);
      return {
        ...point,
        pressure,
      };
    });

    const pathString = makePath(finalPoints, brushType);
    return { pathString, points: finalPoints };
  },
};
