import { CanvasState, Layer } from './types';

export function getActiveLayer(state: CanvasState): Layer | undefined {
  return state.layers.find((l) => l.id === state.activeLayerId);
}

export function getVisibleLayers(state: CanvasState): Layer[] {
  return state.layers.filter((l) => l.visible);
}

export function getSortedLayers(state: CanvasState): Layer[] {
  return [...state.layers].sort((a, b) => a.order - b.order);
}

export function getLayerCount(state: CanvasState): number {
  return state.layers.length;
}

export function getStrokeCount(state: CanvasState): number {
  return state.layers.reduce((sum, l) => sum + l.strokes.length, 0);
}
