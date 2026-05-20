export interface Transform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  transform: Transform,
): { x: number; y: number } {
  const tx = screenX - transform.offsetX;
  const ty = screenY - transform.offsetY;

  const sx = tx / transform.scale;
  const sy = ty / transform.scale;

  const cos = Math.cos(-transform.rotation);
  const sin = Math.sin(-transform.rotation);

  const x = sx * cos - sy * sin;
  const y = sx * sin + sy * cos;

  return { x, y };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  transform: Transform,
): { x: number; y: number } {
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);

  const rx = canvasX * cos - canvasY * sin;
  const ry = canvasX * sin + canvasY * cos;

  const sx = rx * transform.scale;
  const sy = ry * transform.scale;

  return {
    x: sx + transform.offsetX,
    y: sy + transform.offsetY,
  };
}
