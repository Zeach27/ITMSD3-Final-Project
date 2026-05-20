import { DrawCommand } from '@/src/engine/commands/DrawCommand';
import { Stroke, Layer } from '@/src/state/types';

describe('DrawCommand', () => {
  const createMockLayer = (): Layer => ({
    id: 'test-layer',
    name: 'Test Layer',
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'normal',
    strokes: [],
    order: 0,
  });

  const createMockStroke = (id: string): Stroke => ({
    id,
    layerId: 'test-layer',
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    color: '#000000',
    opacity: 1,
    brushSize: 5,
    brushType: 'pencil',
    blendMode: 'normal',
  });

  it('execute() calls addStroke with the correct stroke', () => {
    const layer = createMockLayer();
    const stroke = createMockStroke('stroke-1');
    const addStroke = jest.fn();
    const removeStroke = jest.fn();

    const cmd = new DrawCommand(layer, stroke, addStroke, removeStroke);
    cmd.execute();

    expect(addStroke).toHaveBeenCalledTimes(1);
    expect(addStroke).toHaveBeenCalledWith('test-layer', stroke);
    expect(removeStroke).not.toHaveBeenCalled();
  });

  it('undo() calls removeStroke with the correct strokeId', () => {
    const layer = createMockLayer();
    const stroke = createMockStroke('stroke-1');
    const addStroke = jest.fn();
    const removeStroke = jest.fn();

    const cmd = new DrawCommand(layer, stroke, addStroke, removeStroke);
    cmd.execute();
    cmd.undo();

    expect(removeStroke).toHaveBeenCalledTimes(1);
    expect(removeStroke).toHaveBeenCalledWith('test-layer', 'stroke-1');
  });

  it('description is set correctly', () => {
    const layer = createMockLayer();
    const stroke = createMockStroke('s1');
    const cmd = new DrawCommand(layer, stroke, jest.fn(), jest.fn());
    expect(cmd.description).toBe('Draw stroke');
  });
});
