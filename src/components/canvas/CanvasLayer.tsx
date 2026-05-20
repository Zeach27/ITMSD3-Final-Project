import React from 'react';
import { G } from 'react-native-svg';
import { Layer } from '@/src/state/types';
import { StrokeRenderer } from './StrokeRenderer';

interface CanvasLayerProps {
  layer: Layer;
}

export function CanvasLayer({ layer }: CanvasLayerProps) {
  if (!layer.visible) {
    return null;
  }

  return (
    <G opacity={layer.opacity}>
      {layer.strokes.map((stroke, index) => (
        <StrokeRenderer key={`${stroke.id}-${index}`} stroke={stroke} />
      ))}
    </G>
  );
}