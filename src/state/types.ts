export interface Point {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

export type BrushType = 'pencil' | 'ink' | 'watercolor' | 'marker';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';
export type Tool = 'brush' | 'eraser' | 'selection' | 'move' | 'eyedropper';

export interface Stroke {
  id: string;
  layerId: string;
  points: Point[];
  color: string;
  opacity: number;
  brushSize: number;
  brushType: BrushType;
  blendMode: BlendMode;
  smoothedPath?: string;
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

export interface UserPreferences {
  defaultBrushSize: number;
  defaultColor: string;
  theme: 'dark' | 'light';
  pressureSensitivity: number;
  autoSaveInterval: number;
}

export interface CanvasState {
  id: string;
  title: string;
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
