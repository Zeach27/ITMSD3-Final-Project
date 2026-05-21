import { BrushEngine } from '@/src/engine/brushes/BrushEngine';
import { Point } from '@/src/state/types';

describe('BrushEngine', () => {
  it('returns empty path string for empty points', () => {
    const result = BrushEngine.generateStroke([], 'pencil');
    expect(result.pathString).toBe('');
    expect(result.points).toEqual([]);
  });

  it('generates smoothed points between raw touch points', () => {
    const points: Point[] = [
      { x: 0, y: 0, time: 0 },
      { x: 50, y: 0, time: 100 },
      { x: 100, y: 50, time: 200 },
    ];

    const result = BrushEngine.generateStroke(points, 'ink');
    expect(result.points.length).toBeGreaterThanOrEqual(3);
    expect(result.pathString).toBeTruthy();
    expect(result.pathString).toContain('M');
  });

  it('assigns pressure values based on brush type', () => {
    const points: Point[] = [
      { x: 0, y: 0, time: 0 },
      { x: 10, y: 10, time: 50 },
      { x: 20, y: 20, time: 100 },
    ];

    const result = BrushEngine.generateStroke(points, 'ink');
    for (const p of result.points) {
      expect(p.pressure).toBeDefined();
      expect(p.pressure!).toBeGreaterThanOrEqual(0);
      expect(p.pressure!).toBeLessThanOrEqual(1);
    }
  });

  it('handles single point gracefully', () => {
    const points: Point[] = [{ x: 100, y: 100, time: 0 }];
    const result = BrushEngine.generateStroke(points, 'pencil');
    expect(result.points.length).toBe(1);
    expect(result.pathString).toBeDefined();
  });

  it('produces valid SVG path for pencil strokes', () => {
    const points: Point[] = [
      { x: 10, y: 10, time: 0 },
      { x: 20, y: 20, time: 50 },
    ];
    const result = BrushEngine.generateStroke(points, 'pencil');
    expect(typeof result.pathString).toBe('string');
    expect(result.pathString.length).toBeGreaterThan(0);
    expect(result.pathString).toMatch(/^M/);
  });

  it('supports all brush types without error', () => {
    const points: Point[] = [
      { x: 0, y: 0, time: 0 },
      { x: 10, y: 10, time: 50 },
    ];

    const types: Array<
      | 'pencil'
      | 'ink'
      | 'watercolor'
      | 'marker'
      | 'syrup'
      | 'thylacine'
      | 'fineTip'
      | 'technicalPen'
      | 'gelPen'
      | 'inkBleed'
      | 'studioPen'
      | 'dryInk'
      | 'gesinskiInk'
    > = [
      'pencil',
      'ink',
      'watercolor',
      'marker',
      'syrup',
      'thylacine',
      'fineTip',
      'technicalPen',
      'gelPen',
      'inkBleed',
      'studioPen',
      'dryInk',
      'gesinskiInk',
    ];
    for (const brushType of types) {
      const result = BrushEngine.generateStroke(points, brushType);
      expect(result.pathString).toBeTruthy();
    }
  });
});
