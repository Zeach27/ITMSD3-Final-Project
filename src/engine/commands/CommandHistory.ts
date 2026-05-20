import { Command } from './Command';

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistory = 100;

  /**
   * Execute a command and add it to the undo stack.
   */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the most recent command.
   */
  undo(): Command | null {
    const command = this.undoStack.pop();
    if (!command) {
      return null;
    }

    command.undo();
    this.redoStack.push(command);
    return command;
  }

  /**
   * Redo the most recently undone command.
   */
  redo(): Command | null {
    const command = this.redoStack.pop();
    if (!command) {
      return null;
    }

    command.execute();
    this.undoStack.push(command);
    return command;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
