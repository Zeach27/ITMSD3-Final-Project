import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef, useEffect } from 'react';
import { CanvasState, Layer, Stroke } from './types';
import { canvasReducer } from './canvasReducer';
import { Command } from '@/src/engine/commands/Command';
import { CommandHistory } from '@/src/engine/commands/CommandHistory';
import { AsyncStorageService } from '@/src/storage/AsyncStorageService';
import { ArtworkRecord } from '@/src/storage/schema';
import { generateThumbnailDataURI } from '@/src/utils/thumbnailUtils';

export interface CanvasContextValue {
  state: CanvasState;
  addStroke: (layerId: string, stroke: Stroke) => void;
  removeStroke: (layerId: string, strokeId: string) => void;
  removeStrokes: (layerId: string, strokeIds: string[]) => void;
  restoreStrokes: (layerId: string, strokes: Stroke[]) => void;
  updateTransform: (transform: Partial<CanvasState['transform']>) => void;
  setTool: (tool: CanvasState['activeTool']) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushType: (brushType: CanvasState['brushType']) => void;
  setBrushOpacity: (opacity: number) => void;
  addLayer: (layer: Layer) => void;
  deleteLayer: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  renameLayer: (layerId: string, name: string) => void;
  setActiveLayer: (layerId: string) => void;
  setLayerStrokes: (layerId: string, strokes: Stroke[]) => void;
  setLayersOrder: (layers: Layer[]) => void;
  setTitle: (title: string) => void;
  setId: (id: string) => void;
  resetCanvas: () => void;
  loadArtwork: (artwork: ArtworkRecord) => void;
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined);

const createInitialState = (initialArtwork?: ArtworkRecord): CanvasState => {
  if (initialArtwork) {
    return {
      id: initialArtwork.id,
      title: initialArtwork.title,
      layers: initialArtwork.layers,
      activeLayerId: initialArtwork.layers[0]?.id || 'layer-1',
      activeStrokeId: null,
      currentColor: '#5856D6',
      brushSize: 10,
      brushType: 'pencil',
      brushOpacity: 0.95,
      activeTool: 'brush',
      transform: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
      canUndo: false,
      canRedo: false,
      canvasWidth: initialArtwork.canvasWidth,
      canvasHeight: initialArtwork.canvasHeight,
    };
  }

  return {
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
    currentColor: '#5856D6',
    brushSize: 10,
    brushType: 'pencil',
    brushOpacity: 0.95,
    activeTool: 'brush',
    transform: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
    canUndo: false,
    canRedo: false,
    canvasWidth: 2048,
    canvasHeight: 2048,
  };
};

export function CanvasProvider({ children, initialArtwork }: { children: React.ReactNode, initialArtwork?: ArtworkRecord }) {
  const [state, dispatch] = useReducer(canvasReducer, initialArtwork, (init) => createInitialState(init));
  
  useEffect(() => {
    console.log('CanvasProvider State Initialized:', state);
  }, []);

  const historyRef = useRef<CommandHistory>(new CommandHistory());
  const isInitialMount = useRef(true);

  // Auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const saveTimeout = setTimeout(async () => {
      // Generate thumbnail for gallery preview
      const thumbnail = generateThumbnailDataURI(state.layers, state.canvasWidth, state.canvasHeight);
      
      const record: ArtworkRecord = {
        id: state.id,
        title: state.title,
        layers: state.layers,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        thumbnail: thumbnail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      try {
        await AsyncStorageService.saveArtwork(record);
        console.log('✓ Artwork auto-saved successfully:', {
          id: state.id,
          title: state.title,
          layerCount: state.layers.length,
          totalStrokes: state.layers.reduce((sum, layer) => sum + layer.strokes.length, 0),
          hasThumbnail: thumbnail.length > 0,
        });
      } catch (error) {
        console.error('❌ Failed to auto-save artwork:', error);
      }
    }, 5000); 

    return () => clearTimeout(saveTimeout);
  }, [state.id, state.title, state.layers, state.canvasWidth, state.canvasHeight]);

  const updateHistoryState = useCallback(() => {
    dispatch({
      type: 'UPDATE_UNDO_REDO',
      canUndo: historyRef.current.canUndo(),
      canRedo: historyRef.current.canRedo(),
    });
  }, []);

  const executeCommand = useCallback(
    (command: Command) => {
      historyRef.current.execute(command);
      updateHistoryState();
    },
    [updateHistoryState],
  );

  const undo = useCallback(() => {
    const result = historyRef.current.undo();
    if (result) {
      updateHistoryState();
    }
  }, [updateHistoryState]);

  const resetCanvas = useCallback(() => {
    historyRef.current = new CommandHistory();
    dispatch({ type: 'RESET_CANVAS' });
    updateHistoryState();
  }, [updateHistoryState]);

  const redo = useCallback(() => {
    const result = historyRef.current.redo();
    if (result) {
      updateHistoryState();
    }
  }, [updateHistoryState]);

  const value = useMemo(
    () => ({
      state,
      addStroke: (layerId: string, stroke: Stroke) =>
        dispatch({ type: 'ADD_STROKE', layerId, stroke }),
      removeStroke: (layerId: string, strokeId: string) =>
        dispatch({ type: 'REMOVE_STROKE', layerId, strokeId }),
      removeStrokes: (layerId: string, strokeIds: string[]) =>
        dispatch({ type: 'REMOVE_STROKES', layerId, strokeIds }),
      restoreStrokes: (layerId: string, strokes: Stroke[]) =>
        dispatch({ type: 'RESTORE_STROKES', layerId, strokes }),
      updateTransform: (transform: Partial<CanvasState['transform']>) =>
        dispatch({ type: 'UPDATE_TRANSFORM', transform }),
      setTool: (tool: CanvasState['activeTool']) =>
        dispatch({ type: 'SET_TOOL', tool }),
      setColor: (color: string) =>
        dispatch({ type: 'SET_COLOR', color }),
      setBrushSize: (size: number) =>
        dispatch({ type: 'SET_BRUSH_SIZE', size }),
      setBrushType: (brushType: CanvasState['brushType']) =>
        dispatch({ type: 'SET_BRUSH_TYPE', brushType }),
      setBrushOpacity: (opacity: number) =>
        dispatch({ type: 'SET_BRUSH_OPACITY', opacity }),
      addLayer: (layer: Layer) => dispatch({ type: 'ADD_LAYER', layer }),
      deleteLayer: (layerId: string) => dispatch({ type: 'DELETE_LAYER', layerId }),
      reorderLayers: (fromIndex: number, toIndex: number) =>
        dispatch({ type: 'REORDER_LAYERS', fromIndex, toIndex }),
      setLayersOrder: (layers: Layer[]) =>
        dispatch({ type: 'SET_LAYERS_ORDER', layers }),
      toggleLayerVisibility: (layerId: string) =>
        dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', layerId }),
      toggleLayerLock: (layerId: string) =>
        dispatch({ type: 'TOGGLE_LAYER_LOCK', layerId }),
      renameLayer: (layerId: string, name: string) =>
        dispatch({ type: 'RENAME_LAYER', layerId, name }),
      setActiveLayer: (layerId: string) =>
        dispatch({ type: 'SET_ACTIVE_LAYER', layerId }),
      setLayerStrokes: (layerId: string, strokes: Stroke[]) =>
        dispatch({ type: 'SET_LAYER_STROKES', layerId, strokes }),
      setTitle: (title: string) => {
        dispatch({ type: 'SET_TITLE', title });
        // Force an immediate save when title changes for better gallery responsiveness
        const record: ArtworkRecord = {
          id: state.id,
          title: title,
          layers: state.layers,
          canvasWidth: state.canvasWidth,
          canvasHeight: state.canvasHeight,
          thumbnail: '', // Needs to be handled better, maybe store in state?
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        AsyncStorageService.saveArtwork(record);
      },
      setId: (id: string) =>
        dispatch({ type: 'SET_ID', id }),
      resetCanvas,
      loadArtwork: (artwork: ArtworkRecord) =>
        dispatch({ type: 'LOAD_ARTWORK', artwork }),
      executeCommand,
      undo,
      redo,
    }),
    [state, executeCommand, undo, redo, resetCanvas],
  );

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used inside CanvasProvider');
  }
  return context;
}
