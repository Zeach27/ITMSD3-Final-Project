import { Point } from '@/src/state/types';

export function buildSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  if (points.length === 2) {
    d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  }
  return d;
}

export function strokeBbox(points: Point[], brushSize: number): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const half = brushSize / 2;
  return {
    x: minX - half,
    y: minY - half,
    width: maxX - minX + brushSize,
    height: maxY - minY + brushSize,
  };
}
