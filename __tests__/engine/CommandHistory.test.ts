import { CommandHistory } from '@/src/engine/commands/CommandHistory';
import { Command } from '@/src/engine/commands/Command';

class MockCommand implements Command {
  public executed = 0;
  public undone = 0;
  description: string;

  constructor(description = 'Mock command') {
    this.description = description;
  }

  execute(): void {
    this.executed++;
  }

  undo(): void {
    this.undone++;
  }
}

describe('CommandHistory', () => {
  it('execute() pushes to undoStack and clears redoStack', () => {
    const history = new CommandHistory();
    const cmd1 = new MockCommand();
    const cmd2 = new MockCommand();

    history.execute(cmd1);
    history.execute(cmd2);

    expect(cmd1.executed).toBe(1);
    expect(cmd2.executed).toBe(1);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('undo() calls command.undo() and moves to redoStack', () => {
    const history = new CommandHistory();
    const cmd = new MockCommand();
    history.execute(cmd);

    const result = history.undo();

    expect(result).toBe(cmd);
    expect(cmd.undone).toBe(1);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it('redo() re-executes command and moves back to undoStack', () => {
    const history = new CommandHistory();
    const cmd = new MockCommand();
    history.execute(cmd);
    history.undo(); // cmd is now in redoStack

    const result = history.redo();

    expect(result).toBe(cmd);
    expect(cmd.executed).toBe(2); // once from execute, once from redo
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('calls execute() on the command when execute() is called', () => {
    const history = new CommandHistory();
    const cmd = new MockCommand();
    history.execute(cmd);
    expect(cmd.executed).toBe(1);
  });

  it('history is capped at maxHistory', () => {
    const history = new CommandHistory();
    const max = 100;

    // Create and execute max + 10 commands
    const commands: MockCommand[] = [];
    for (let i = 0; i < max + 10; i++) {
      const cmd = new MockCommand(`cmd-${i}`);
      commands.push(cmd);
      history.execute(cmd);
    }

    // We should still be able to undo (stack is not empty)
    expect(history.canUndo()).toBe(true);

    // The oldest commands should have been evicted from the stack
    // but they were still executed
    for (let i = 0; i < 10; i++) {
      expect(commands[i].executed).toBe(1);
    }

    // We can undo up to max commands
    let undoCount = 0;
    while (history.canUndo()) {
      history.undo();
      undoCount++;
    }
    expect(undoCount).toBeLessThanOrEqual(max);
  });

  it('undo() returns null when undoStack is empty', () => {
    const history = new CommandHistory();
    expect(history.undo()).toBeNull();
    expect(history.canUndo()).toBe(false);
  });

  it('redo() returns null when redoStack is empty', () => {
    const history = new CommandHistory();
    expect(history.redo()).toBeNull();
    expect(history.canRedo()).toBe(false);
  });

  it('clear() empties both stacks', () => {
    const history = new CommandHistory();
    history.execute(new MockCommand());
    history.execute(new MockCommand());
    expect(history.canUndo()).toBe(true);

    history.clear();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });
});
