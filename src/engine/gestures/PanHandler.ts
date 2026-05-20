import { CanvasTransform } from '@/src/state/types';

export function translateTransform(
  transform: CanvasTransform,
  dx: number,
  dy: number,
): CanvasTransform {
  return {
    ...transform,
    offsetX: transform.offsetX + dx,
    offsetY: transform.offsetY + dy,
  };
}

export function clampOffset(transform: CanvasTransform, min: number, max: number): CanvasTransform {
  return {
    ...transform,
    offsetX: Math.max(min, Math.min(max, transform.offsetX)),
    offsetY: Math.max(min, Math.min(max, transform.offsetY)),
  };
}
