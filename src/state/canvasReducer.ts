import { ArtworkRecord } from '../storage/schema';
import { CanvasState, Layer, Stroke, CanvasTransform, Tool } from './types';

export type CanvasAction =
  | { type: 'ADD_STROKE'; layerId: string; stroke: Stroke }
  | { type: 'REMOVE_STROKE'; layerId: string; strokeId: string }
  | { type: 'REMOVE_STROKES'; layerId: string; strokeIds: string[] }
  | { type: 'RESTORE_STROKES'; layerId: string; strokes: Stroke[] }
  | { type: 'UPDATE_TRANSFORM'; transform: Partial<CanvasTransform> }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_COLOR'; color: string }
  | { type: 'SET_BRUSH_SIZE'; size: number }
  | { type: 'SET_BRUSH_TYPE'; brushType: CanvasState['brushType'] }
  | { type: 'SET_BRUSH_OPACITY'; opacity: number }
  | { type: 'ADD_LAYER'; layer: Layer }
  | { type: 'DELETE_LAYER'; layerId: string }
  | { type: 'REORDER_LAYERS'; fromIndex: number; toIndex: number }
  | { type: 'SET_LAYERS_ORDER'; layers: Layer[] }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; layerId: string }
  | { type: 'TOGGLE_LAYER_LOCK'; layerId: string }
  | { type: 'RENAME_LAYER'; layerId: string; name: string }
  | { type: 'SET_ACTIVE_LAYER'; layerId: string }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_ID'; id: string }
  | { type: 'RESET_CANVAS' }
  | { type: 'LOAD_ARTWORK'; artwork: ArtworkRecord }
  | { type: 'SET_LAYER_STROKES'; layerId: string; strokes: Stroke[] }
  | { type: 'UPDATE_UNDO_REDO'; canUndo: boolean; canRedo: boolean };

function updateLayer(layers: Layer[], layerId: string, updater: (layer: Layer) => Layer): Layer[] {
  return layers.map((layer) => (layer.id === layerId ? updater(layer) : layer));
}

function reorderLayers(layers: Layer[], fromIndex: number, toIndex: number): Layer[] {
  const sorted = [...layers].sort((a, b) => b.order - a.order);
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);
  const maxOrder = sorted.length - 1;
  return sorted.map((layer, index) => ({ ...layer, order: maxOrder - index }));
}

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADD_STROKE': {
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          strokes: [...layer.strokes, action.stroke],
        })),
      };
    }
    case 'REMOVE_STROKE': {
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          strokes: layer.strokes.filter((stroke) => stroke.id !== action.strokeId),
        })),
      };
    }
    case 'REMOVE_STROKES': {
      const idSet = new Set(action.strokeIds);
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          strokes: layer.strokes.filter((stroke) => !idSet.has(stroke.id)),
        })),
      };
    }
    case 'RESTORE_STROKES': {
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          strokes: [...layer.strokes, ...action.strokes],
        })),
      };
    }
    case 'UPDATE_TRANSFORM': {
      return {
        ...state,
        transform: {
          ...state.transform,
          ...action.transform,
        },
      };
    }
    case 'SET_TOOL':
      return {
        ...state,
        activeTool: action.tool,
      };
    case 'SET_COLOR':
      return {
        ...state,
        currentColor: action.color,
      };
    case 'SET_BRUSH_SIZE':
      return {
        ...state,
        brushSize: action.size,
      };
    case 'SET_BRUSH_TYPE':
      return {
        ...state,
        brushType: action.brushType,
      };
    case 'SET_BRUSH_OPACITY':
      return {
        ...state,
        brushOpacity: action.opacity,
      };
    case 'ADD_LAYER': {
      return {
        ...state,
        layers: [...state.layers, action.layer].sort((a, b) => a.order - b.order),
        activeLayerId: action.layer.id,
      };
    }
    case 'DELETE_LAYER': {
      const nextLayers = state.layers.filter((layer) => layer.id !== action.layerId);
      const nextActiveLayerId = nextLayers.length
        ? nextLayers[0].id
        : state.activeLayerId;
      return {
        ...state,
        layers: nextLayers,
        activeLayerId: nextActiveLayerId,
      };
    }
    case 'REORDER_LAYERS': {
      return {
        ...state,
        layers: reorderLayers(state.layers, action.fromIndex, action.toIndex),
      };
    }
    case 'SET_LAYERS_ORDER': {
      return {
        ...state,
        layers: action.layers,
      };
    }
    case 'TOGGLE_LAYER_VISIBILITY': {
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          visible: !layer.visible,
        })),
      };
    }
    case 'TOGGLE_LAYER_LOCK': {
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          locked: !layer.locked,
        })),
      };
    }
    case 'RENAME_LAYER': {
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          name: action.name,
        })),
      };
    }
    case 'SET_ACTIVE_LAYER':
      return {
        ...state,
        activeLayerId: action.layerId,
      };
    case 'SET_TITLE':
      return {
        ...state,
        title: action.title,
      };
    case 'SET_ID':
      return {
        ...state,
        id: action.id,
      };
    case 'RESET_CANVAS':
      return {
        ...state,
        id: `artwork-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: 'Untitled',
        layers: [
          {
            id: 'layer-1',
            name: 'Layer 1',
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: 'normal',
            strokes: [],
            order: 0,
          },
        ],
        activeLayerId: 'layer-1',
        activeStrokeId: null,
        transform: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        canUndo: false,
        canRedo: false,
      };
    case 'LOAD_ARTWORK':
      return {
        ...state,
        id: action.artwork.id,
        title: action.artwork.title,
        layers: action.artwork.layers,
        activeLayerId: action.artwork.layers[0]?.id || 'layer-1',
        canvasWidth: action.artwork.canvasWidth,
        canvasHeight: action.artwork.canvasHeight,
        canUndo: false,
        canRedo: false,
      };
    case 'SET_LAYER_STROKES': {
      return {
        ...state,
        layers: updateLayer(state.layers, action.layerId, (layer) => ({
          ...layer,
          strokes: action.strokes,
        })),
      };
    }
    case 'UPDATE_UNDO_REDO':
      return {
        ...state,
        canUndo: action.canUndo,
        canRedo: action.canRedo,
      };
    default:
      return state;
  }
}
