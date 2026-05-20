import { Command } from './Command';
import { Layer } from '@/src/state/types';

export class AddLayerCommand implements Command {
  description = 'Add layer';

  constructor(
    private layer: Layer,
    private addLayer: (layer: Layer) => void,
    private deleteLayer: (layerId: string) => void,
  ) {}

  execute(): void {
    this.addLayer(this.layer);
  }

  undo(): void {
    this.deleteLayer(this.layer.id);
  }
}
