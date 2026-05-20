import { CanvasTransform } from '@/src/state/types';

export function scaleTransform(
  transform: CanvasTransform,
  scaleChange: number,
): CanvasTransform {
  const nextScale = Math.max(0.5, Math.min(3, transform.scale * scaleChange));

  return {
    ...transform,
    scale: nextScale,
  };
}

export function mapPinchCenter(
  canvasTransform: CanvasTransform,
  focalX: number,
  focalY: number,
  scaleChange: number,
): CanvasTransform {
  const prevScale = canvasTransform.scale;
  const nextScale = Math.max(0.5, Math.min(3, prevScale * scaleChange));

  const zoomFactor = nextScale / prevScale;

  return {
    ...canvasTransform,
    scale: nextScale,
    offsetX: focalX - (focalX - canvasTransform.offsetX) * zoomFactor,
    offsetY: focalY - (focalY - canvasTransform.offsetY) * zoomFactor,
  };
}
