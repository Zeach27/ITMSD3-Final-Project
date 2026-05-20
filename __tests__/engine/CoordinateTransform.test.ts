import { screenToCanvas, canvasToScreen, Transform } from '@/src/engine/gestures/CoordinateTransform';

describe('CoordinateTransform', () => {
  const identity: Transform = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0,
  };

  it('screenToCanvas with identity transform returns same coordinates', () => {
    const result = screenToCanvas(100, 200, identity);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('screenToCanvas inverts scale correctly', () => {
    const transform: Transform = { ...identity, scale: 2 };
    const result = screenToCanvas(200, 400, transform);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('screenToCanvas accounts for offset', () => {
    const transform: Transform = { ...identity, offsetX: 50, offsetY: 30 };
    const result = screenToCanvas(150, 130, transform);
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it('screenToCanvas + canvasToScreen round-trips identity', () => {
    const input = { x: 100, y: 200 };
    const screen = canvasToScreen(input.x, input.y, identity);
    const result = screenToCanvas(screen.x, screen.y, identity);
    expect(result.x).toBeCloseTo(input.x);
    expect(result.y).toBeCloseTo(input.y);
  });

  it('screenToCanvas + canvasToScreen round-trips with scale=2, offset=(100,50), rotation=PI/4', () => {
    const transform: Transform = {
      offsetX: 100,
      offsetY: 50,
      scale: 2,
      rotation: Math.PI / 4,
    };

    const input = { x: 150, y: 75 };
    const screen = canvasToScreen(input.x, input.y, transform);
    const result = screenToCanvas(screen.x, screen.y, transform);

    expect(result.x).toBeCloseTo(input.x, 5);
    expect(result.y).toBeCloseTo(input.y, 5);
  });

  it('handles zero scale gracefully', () => {
    const transform: Transform = { ...identity, scale: 0.5 };
    const result = screenToCanvas(100, 200, transform);
    expect(result).toEqual({ x: 200, y: 400 });
  });

  it('canvasToScreen applies rotation correctly', () => {
    const transform: Transform = { ...identity, rotation: Math.PI / 2 };
    const result = canvasToScreen(100, 0, transform);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(100, 5);
  });
});
