import { Command } from './Command';

export class MoveLayerCommand implements Command {
  description = 'Move layer';

  constructor(
    private layerId: string,
    private fromIndex: number,
    private toIndex: number,
    private reorder: (fromIndex: number, toIndex: number) => void,
  ) {}

  execute(): void {
    this.reorder(this.fromIndex, this.toIndex);
  }

  undo(): void {
    this.reorder(this.toIndex, this.fromIndex);
  }
}
