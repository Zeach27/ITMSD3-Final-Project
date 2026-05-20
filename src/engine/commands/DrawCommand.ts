import { Command } from './Command';
import { Stroke, Layer } from '@/src/state/types';

export class DrawCommand implements Command {
  description = 'Draw stroke';

  constructor(
    private layer: Layer,
    private stroke: Stroke,
    private addStroke: (layerId: string, stroke: Stroke) => void,
    private removeStroke: (layerId: string, strokeId: string) => void,
  ) {}

  execute(): void {
    this.addStroke(this.layer.id, this.stroke);
  }

  undo(): void {
    this.removeStroke(this.layer.id, this.stroke.id);
  }
}
