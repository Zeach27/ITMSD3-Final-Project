import { Command } from './Command';
import { Stroke } from '@/src/state/types';

export class EraseCommand implements Command {
  description = 'Erase stroke';

  constructor(
    private layerId: string,
    private originalStrokes: Stroke[],
    private replacementStrokes: Stroke[],
    private removeStrokes: (layerId: string, ids: string[]) => void,
    private restoreStrokes: (layerId: string, strokes: Stroke[]) => void,
  ) {}

  execute(): void {
    const originalIds = this.originalStrokes.map((stroke) => stroke.id);
    if (originalIds.length > 0) {
      this.removeStrokes(this.layerId, originalIds);
    }
    if (this.replacementStrokes.length > 0) {
      this.restoreStrokes(this.layerId, this.replacementStrokes);
    }
  }

  undo(): void {
    if (this.replacementStrokes.length > 0) {
      this.removeStrokes(this.layerId, this.replacementStrokes.map((stroke) => stroke.id));
    }
    if (this.originalStrokes.length > 0) {
      this.restoreStrokes(this.layerId, this.originalStrokes);
    }
  }
}
