# Project 6: Gesture-Controlled Drawing Canvas
### Capstone Plan & AI Build Prompt — ITMSD 3

---

## Overview

A **Procreate-inspired** whiteboard/drawing app built with **React Native + Expo**, featuring multi-touch gestures, a full undo/redo system via the **Command Pattern**, layer management, pinch-to-zoom, and a rich toolbar — all without any drawing libraries.

---

## Folder Structure

```
project6-drawing-canvas/
├── app/
│   ├── _layout.tsx              # Root layout (Expo Router)
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator
│   │   ├── index.tsx            # Main canvas screen
│   │   ├── gallery.tsx          # Saved artworks gallery
│   │   └── settings.tsx         # App preferences
│   ├── canvas/
│   │   └── [id].tsx             # Full-screen canvas (stack)
│   └── modal/
│       └── layer-manager.tsx    # Layer modal (modal navigation)
│
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── DrawingCanvas.tsx        # Core canvas component
│   │   │   ├── CanvasLayer.tsx          # Single layer renderer (SVG)
│   │   │   ├── StrokeRenderer.tsx       # Renders individual strokes
│   │   │   └── SelectionOverlay.tsx     # Selection bounding box
│   │   ├── toolbar/
│   │   │   ├── TopToolbar.tsx           # Undo, redo, save, layers
│   │   │   ├── LeftToolbar.tsx          # Brush, eraser, selection, move
│   │   │   ├── RightToolbar.tsx         # Color swatch + opacity slider
│   │   │   ├── BrushPanel.tsx           # Brush size & type picker
│   │   │   └── ColorPicker.tsx          # HSB color wheel
│   │   ├── layers/
│   │   │   ├── LayerList.tsx            # Draggable layer stack
│   │   │   └── LayerThumbnail.tsx       # Mini preview per layer
│   │   └── ui/
│   │       ├── SliderKnob.tsx           # Custom slider (no library)
│   │       ├── IconButton.tsx           # Reusable icon button
│   │       └── Tooltip.tsx              # Press-and-hold tooltip
│   │
│   ├── engine/
│   │   ├── commands/
│   │   │   ├── Command.ts               # Base Command interface
│   │   │   ├── DrawCommand.ts           # Add stroke command
│   │   │   ├── EraseCommand.ts          # Erase stroke command
│   │   │   ├── MoveLayerCommand.ts      # Reorder layer command
│   │   │   ├── AddLayerCommand.ts       # Add layer command
│   │   │   ├── DeleteLayerCommand.ts    # Delete layer command
│   │   │   └── CommandHistory.ts        # Undo/redo stack manager
│   │   ├── gestures/
│   │   │   ├── PanHandler.ts            # Pan gesture math
│   │   │   ├── PinchHandler.ts          # Pinch-to-zoom math
│   │   │   └── CoordinateTransform.ts   # Screen ↔ canvas coordinate math
│   │   └── brushes/
│   │       ├── BrushEngine.ts           # Generates stroke point arrays
│   │       ├── PencilBrush.ts           # Pencil pressure simulation
│   │       ├── InkBrush.ts              # Ink brush with taper
│   │       └── WatercolorBrush.ts       # Soft wash brush
│   │
│   ├── state/
│   │   ├── CanvasContext.tsx            # Global canvas state (Context)
│   │   ├── canvasReducer.ts             # useReducer logic
│   │   ├── types.ts                     # All TypeScript types/interfaces
│   │   └── selectors.ts                 # Derived state helpers
│   │
│   ├── storage/
│   │   ├── AsyncStorageService.ts       # Artwork save/load/list/delete
│   │   └── schema.ts                    # Data schema definitions
│   │
│   └── utils/
│       ├── colorUtils.ts                # HSB ↔ HEX ↔ RGB conversions
│       ├── pathUtils.ts                 # SVG path string builders
│       └── mathUtils.ts                 # Interpolation, bezier curves
│
├── assets/
│   ├── icons/                           # Custom SVG icons (Procreate-style)
│   └── brushes/                         # Brush texture masks (PNG)
│
├── __tests__/
│   ├── engine/
│   │   ├── CommandHistory.test.ts       # Core algorithm tests
│   │   ├── DrawCommand.test.ts
│   │   ├── CoordinateTransform.test.ts
│   │   └── BrushEngine.test.ts
│   └── utils/
│       ├── colorUtils.test.ts
│       └── pathUtils.test.ts
│
├── app.json
├── package.json
└── tsconfig.json
```

---

## Core Algorithm: Command Pattern + Coordinate Math

### 1. Command Interface (`Command.ts`)

```ts
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}
```

### 2. CommandHistory (`CommandHistory.ts`)

```ts
export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory = 100;

  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // clear redo on new action
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift(); // evict oldest
    }
  }

  undo(): Command | null {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      return command;
    }
    return null;
  }

  redo(): Command | null {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
      return command;
    }
    return null;
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
  clear(): void { this.undoStack = []; this.redoStack = []; }
}
```

### 3. DrawCommand (`DrawCommand.ts`)

```ts
import { Command } from './Command';
import { Stroke, Layer } from '../state/types';

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
```

### 4. EraseCommand (`EraseCommand.ts`)

```ts
export class EraseCommand implements Command {
  description = 'Erase stroke';
  private erasedStrokes: Stroke[] = [];

  constructor(
    private layer: Layer,
    private eraserPath: Point[],
    private getStrokesInPath: (layerId: string, path: Point[]) => Stroke[],
    private removeStrokes: (layerId: string, ids: string[]) => void,
    private restoreStrokes: (layerId: string, strokes: Stroke[]) => void,
  ) {}

  execute(): void {
    this.erasedStrokes = this.getStrokesInPath(this.layer.id, this.eraserPath);
    this.removeStrokes(this.layer.id, this.erasedStrokes.map(s => s.id));
  }

  undo(): void {
    this.restoreStrokes(this.layer.id, this.erasedStrokes);
  }
}
```

### 5. CoordinateTransform (`CoordinateTransform.ts`)

```ts
// Converts raw touch screen coordinates → canvas coordinates
// accounting for pan offset, zoom scale, and canvas rotation.

export interface Transform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number; // radians
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  transform: Transform,
): { x: number; y: number } {
  // Step 1: translate by offset
  const tx = screenX - transform.offsetX;
  const ty = screenY - transform.offsetY;

  // Step 2: undo scale
  const sx = tx / transform.scale;
  const sy = ty / transform.scale;

  // Step 3: undo rotation
  const cos = Math.cos(-transform.rotation);
  const sin = Math.sin(-transform.rotation);
  const x = sx * cos - sy * sin;
  const y = sx * sin + sy * cos;

  return { x, y };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  transform: Transform,
): { x: number; y: number } {
  // Apply rotation
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  const rx = canvasX * cos - canvasY * sin;
  const ry = canvasX * sin + canvasY * cos;

  // Apply scale
  const sx = rx * transform.scale;
  const sy = ry * transform.scale;

  // Apply offset
  return {
    x: sx + transform.offsetX,
    y: sy + transform.offsetY,
  };
}
```

---

## State Management: Context + useReducer

### Types (`types.ts`)

```ts
export interface Point { x: number; y: number; pressure?: number; }

export interface Stroke {
  id: string;
  layerId: string;
  points: Point[];
  color: string;         // HEX
  opacity: number;       // 0–1
  brushSize: number;     // px
  brushType: BrushType;
  blendMode: BlendMode;
  smoothedPath?: string; // cached SVG path
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  strokes: Stroke[];
  order: number;
}

export interface CanvasTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export interface CanvasState {
  layers: Layer[];
  activeLayerId: string;
  activeStrokeId: string | null;
  currentColor: string;
  brushSize: number;
  brushType: BrushType;
  brushOpacity: number;
  activeTool: Tool;
  transform: CanvasTransform;
  canUndo: boolean;
  canRedo: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export type Tool = 'brush' | 'eraser' | 'selection' | 'move' | 'eyedropper';
export type BrushType = 'pencil' | 'ink' | 'watercolor' | 'marker';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';
```

### Reducer Actions (`canvasReducer.ts`)

```ts
type Action =
  | { type: 'ADD_STROKE'; layerId: string; stroke: Stroke }
  | { type: 'REMOVE_STROKE'; layerId: string; strokeId: string }
  | { type: 'UPDATE_TRANSFORM'; transform: Partial<CanvasTransform> }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_COLOR'; color: string }
  | { type: 'SET_BRUSH_SIZE'; size: number }
  | { type: 'ADD_LAYER' }
  | { type: 'DELETE_LAYER'; layerId: string }
  | { type: 'REORDER_LAYERS'; fromIndex: number; toIndex: number }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; layerId: string }
  | { type: 'SET_ACTIVE_LAYER'; layerId: string }
  | { type: 'UPDATE_UNDO_REDO'; canUndo: boolean; canRedo: boolean };
```

---

## Navigation Structure (Expo Router)

```
Tabs:
  ├── / (index)         → Main canvas screen (default)
  ├── /gallery          → Saved artworks list
  └── /settings         → App settings

Stack (inside canvas):
  └── /canvas/[id]      → Full-screen canvas for a saved artwork

Modal:
  └── /modal/layer-manager → Layer panel (slides up from bottom)
```

**3 navigation patterns used:**
1. **Tab navigation** — between Canvas, Gallery, Settings
2. **Stack navigation** — opening a specific saved artwork
3. **Modal navigation** — layer manager panel

---

## Local Persistence Schema (`schema.ts`)

```ts
// AsyncStorage key structure:
// artworks:list         → string[] (artwork IDs)
// artworks:{id}         → ArtworkRecord (JSON)
// settings:preferences  → UserPreferences (JSON)

export interface ArtworkRecord {
  id: string;
  title: string;
  thumbnail: string;       // base64 PNG preview
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;       // ISO date
  updatedAt: string;
}

export interface UserPreferences {
  defaultBrushSize: number;
  defaultColor: string;
  theme: 'dark' | 'light';
  pressureSensitivity: number;
  autoSaveInterval: number; // seconds
}
```

---

## Procreate-Like UI Design Spec

### Color Palette (Dark Theme — Procreate aesthetic)

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#1C1C1E` | App background |
| `--bg-canvas` | `#2C2C2E` | Canvas background |
| `--bg-panel` | `#242426` | Toolbar/panel bg |
| `--surface` | `#3A3A3C` | Button/card surface |
| `--surface-hover` | `#48484A` | Hover/active state |
| `--accent` | `#5856D6` | Primary accent (purple-blue) |
| `--accent-warm` | `#FF9F0A` | Secondary accent (gold) |
| `--text-primary` | `#FFFFFF` | Labels |
| `--text-muted` | `#8E8E93` | Secondary text |
| `--border` | `#38383A` | Dividers |
| `--canvas-white` | `#FAFAFA` | Drawing canvas surface |

### Layout Blueprint

```
┌────────────────────────────────────────────────────────┐
│  [≡ Gallery]  [Artwork Title]  [Export] [Share] [···]  │  ← Top Toolbar (48px)
├──────┬──────────────────────────────────────┬──────────┤
│      │                                      │  Color   │
│  🖌  │                                      │  ●       │
│  ✏️  │         CANVAS (SVG)                 │  ──────  │
│  ◻  │                                      │  Opacity │
│  ↕  │                                      │  ══════  │
│  💧 │                                      │  Size    │
│      │                                      │  ══════  │
├──────┴──────────────────────────────────────┴──────────┤
│  [Undo] [Redo]   [+Layer] [Layers▲]   [Brush Panel▲]  │  ← Bottom Bar (56px)
└────────────────────────────────────────────────────────┘
```

### Assets to Include (Procreate-style)

**Icons** (custom SVG, 24×24, stroke-based):
- `brush.svg` — angled brush tip
- `pencil.svg` — pencil with eraser end
- `eraser.svg` — eraser block
- `eyedropper.svg` — dropper
- `selection.svg` — dashed rectangle
- `move.svg` — four-way arrow
- `undo.svg` — curved arrow left
- `redo.svg` — curved arrow right
- `layers.svg` — stacked rectangles
- `add-layer.svg` — plus in rectangle
- `delete-layer.svg` — trash in rectangle
- `lock.svg` / `unlock.svg`
- `eye.svg` / `eye-off.svg`
- `export.svg` — arrow out of box
- `gallery.svg` — photo grid

**Brush cursors** (radial gradient PNG, 32px):
- `cursor-pencil.png`
- `cursor-ink.png`
- `cursor-watercolor.png`
- `cursor-eraser.png`

---

## Unit Tests (Minimum 8)

| # | File | Test |
|---|---|---|
| 1 | `CommandHistory.test.ts` | `execute()` pushes to undoStack, clears redoStack |
| 2 | `CommandHistory.test.ts` | `undo()` calls command.undo(), moves to redoStack |
| 3 | `CommandHistory.test.ts` | `redo()` re-executes and moves back to undoStack |
| 4 | `CommandHistory.test.ts` | History is capped at `maxHistory` (no memory leak) |
| 5 | `DrawCommand.test.ts` | `execute()` calls addStroke with correct args |
| 6 | `DrawCommand.test.ts` | `undo()` calls removeStroke with correct strokeId |
| 7 | `CoordinateTransform.test.ts` | `screenToCanvas()` inverts scale correctly |
| 8 | `CoordinateTransform.test.ts` | `screenToCanvas()` + `canvasToScreen()` round-trips identity |
| 9 | `BrushEngine.test.ts` | Generates smoothed points between two raw touch points |
| 10 | `colorUtils.test.ts` | HSB → HEX → HSB round-trip preserves values |

---

## Live Modification Answer Plan (Defense Prep)

**Instructor challenge:** *"Add an eraser tool using the existing stroke data structure."*

**Answer strategy:**
1. `EraseCommand` already exists — show it uses `getStrokesInPath()` to find intersecting strokes
2. Switch `activeTool` to `'eraser'` in state
3. On touch, build an eraser path (array of Points), call `getStrokesInPath()`
4. Wrap in `EraseCommand`, call `commandHistory.execute(commandInstance)`
5. Strokes are removed visually; `undo()` restores them — Command Pattern makes this trivial
6. Show that no new data structure was needed — eraser operates on existing `Stroke[]`

---

## Git Workflow Plan

```
main
├── feature/project-setup
├── feature/canvas-svg-renderer
├── feature/command-pattern-core
├── feature/brush-engine
├── feature/gesture-handlers
├── feature/layer-management
├── feature/color-picker
├── feature/toolbar-ui
├── feature/async-storage-persistence
├── feature/gallery-screen
├── feature/unit-tests
└── feature/procreate-ui-polish
```

Each branch → PR → merge into `main`. Commit messages follow conventional commits format:
`feat:`, `fix:`, `test:`, `refactor:`, `chore:`

---

## Build Prompt for AI Assistance

> Use the following prompt when scaffolding individual modules with AI tools during **non-defense phases** of development. Do NOT use AI during your live modification challenge.

---

### MASTER BUILD PROMPT

```
You are helping me build Project 6: Gesture-Controlled Drawing Canvas for my React Native + Expo (SDK 52+) capstone project. The app is inspired by Procreate's UI and UX.

STRICT RULES:
- NO external drawing libraries (no react-native-skia, no react-native-canvas, no d3)
- All rendering must use React Native's <Svg> from react-native-svg
- No UI component libraries (no NativeBase, no React Native Paper)
- All gestures via react-native-gesture-handler
- Navigation via Expo Router only
- State: Context + useReducer (no Redux)
- Persistence: AsyncStorage only
- TypeScript throughout, strict mode enabled

CURRENT MODULE TO BUILD: [INSERT MODULE NAME HERE]

Context of what's already built:
- [LIST COMPLETED FILES/MODULES]

The module I need now:
[DESCRIBE EXACTLY WHAT YOU NEED]

Requirements for this module:
1. Must follow the Command Pattern (all canvas mutations go through CommandHistory.execute())
2. All touch coordinates must be transformed via CoordinateTransform.screenToCanvas() before use
3. State mutations only happen through canvasReducer dispatch calls
4. Component must match Procreate's dark theme: bg #1C1C1E, surface #3A3A3C, accent #5856D6
5. Export all types to src/state/types.ts — no local type definitions
6. Include JSDoc comments for every public method
7. No inline styles — use StyleSheet.create()

Please produce the complete file, no placeholders, no TODOs.
```

---

### MODULE-SPECIFIC PROMPTS

**For `CommandHistory.ts`:**
```
Build CommandHistory.ts as described in the plan. It must:
- Manage undoStack and redoStack as private arrays of Command interface
- Cap history at 100 entries (shift oldest when exceeded)
- Expose: execute(cmd), undo(), redo(), canUndo(), canRedo(), clear()
- Be a plain TypeScript class (no React hooks)
- Include full JSDoc
Include its unit test file CommandHistory.test.ts using Jest with at least 4 tests.
```

**For `CoordinateTransform.ts`:**
```
Build CoordinateTransform.ts as described. It must:
- Export screenToCanvas(screenX, screenY, transform) → {x, y}
- Export canvasToScreen(canvasX, canvasY, transform) → {x, y}
- Handle: offsetX, offsetY, scale, rotation (radians)
- Be pure functions (no side effects, no state)
- screenToCanvas and canvasToScreen must be exact mathematical inverses
Include unit tests that verify the round-trip identity for scale=2, offset=(100,50), rotation=Math.PI/4.
```

**For `DrawingCanvas.tsx`:**
```
Build the main DrawingCanvas component. It must:
- Use <GestureDetector> from react-native-gesture-handler
- Use a Pan gesture for drawing (single finger = draw)
- Use a Pinch gesture for zoom
- Use a two-finger Pan for canvas panning
- Convert all touch points via screenToCanvas() before storing
- On touch end, wrap the completed stroke in a DrawCommand and call commandHistory.execute()
- Render all layers as stacked <Svg> elements
- The canvas size is 2048x2048 (Procreate standard)
```

**For `BrushEngine.ts`:**
```
Build BrushEngine.ts. It must:
- Accept raw touch point arrays (Point[]) and return smoothed SVG path strings
- Use Catmull-Rom spline interpolation to smooth jagged touch input
- Support brushType: 'pencil' | 'ink' | 'watercolor' | 'marker'
- For 'pencil': add slight noise variation to strokeWidth per point
- For 'ink': taper width based on speed (distance between points / time delta)
- For 'watercolor': reduce opacity near stroke edges (Gaussian falloff)
- Return: { pathString: string, points: Point[] }
```

**For `ColorPicker.tsx`:**
```
Build a Procreate-style HSB color picker component. It must:
- Show a circular hue ring (outer) and a triangular SB picker (inner)
- No third-party color picker libraries
- Use react-native-svg for the wheel rendering
- Use PanResponder or Gesture Handler for drag interaction on the triangle
- Accept: currentColor (HEX string), onChange: (hex: string) => void
- Show current and previous color swatches below the wheel
- Match Procreate's dark UI style
```

**For `LayerList.tsx` (Modal screen):**
```
Build the layer manager modal screen at app/modal/layer-manager.tsx. It must:
- Show all layers as a draggable list (implement drag manually using PanResponder — no react-native-draggable-flatlist)
- Each layer row: thumbnail preview, visibility toggle (eye icon), lock toggle, opacity slider, layer name (tap to rename)
- Add Layer button → dispatches ADD_LAYER action, wraps in AddLayerCommand
- Delete Layer button → wraps in DeleteLayerCommand  
- Reordering → wraps in MoveLayerCommand
- Use Expo Router's useLocalSearchParams and router.back()
- Slide-up modal animation using Animated.spring
```

---

## Defense Prep Cheat Sheet (Understand, Don't Memorize)

**Why Command Pattern?**
> Every canvas action (draw, erase, move layer) is an object with `execute()` and `undo()`. The `CommandHistory` stack tracks these objects. Undo = pop + call undo(). This separates *what* happened from *when* and *how* to reverse it.

**Why useReducer over useState?**
> The canvas state is deeply nested (layers → strokes → points) and many actions affect multiple state slices simultaneously. `useReducer` gives us a single, predictable state transition function — easier to test, debug, and extend.

**Why screen-to-canvas coordinate math?**
> The canvas can be panned, scaled, and rotated. A touch at screen position (300, 400) doesn't map to canvas point (300, 400) when the canvas is zoomed to 2x and panned 200px right. The transform matrix undoes these operations in reverse order.

**Time complexity of CommandHistory:**
> `execute()`, `undo()`, `redo()` are all **O(1)** — stack push/pop. Memory is O(n) capped at 100 entries.

**What happens if a stroke is partially drawn when the app crashes?**
> The stroke is only committed to state (via `DrawCommand.execute()`) when the touch gesture ends. Mid-stroke, points are stored in a temporary `currentStroke` ref — not in the reducer state — so a crash mid-stroke loses only that stroke, not the history.
```

---

*Built for ITMSD 3 Capstone — Project 6: Gesture-Controlled Drawing Canvas*
