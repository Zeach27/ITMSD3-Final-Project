import { Command } from './Command';
import { Layer } from '@/src/state/types';

export class DeleteLayerCommand implements Command {
  description = 'Delete layer';

  constructor(
    private layer: Layer,
    private removeLayer: (layerId: string) => void,
    private restoreLayer: (layer: Layer) => void,
  ) {}

  execute(): void {
    this.removeLayer(this.layer.id);
  }

  undo(): void {
    this.restoreLayer(this.layer);
  }
}
