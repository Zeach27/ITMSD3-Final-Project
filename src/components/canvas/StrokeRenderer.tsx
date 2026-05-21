import React from 'react';
import { Path } from 'react-native-svg';
import { Stroke } from '@/src/state/types';
import { getBrushRenderConfig } from '@/src/engine/brushes/brushStyles';

interface StrokeRendererProps {
  stroke: Stroke;
}

export function StrokeRenderer({ stroke }: StrokeRendererProps) {
  if (!stroke.smoothedPath && stroke.points.length < 2) {
    return null;
  }

  const { filter, strokeOpacity } = getBrushRenderConfig(
    stroke.brushType,
    stroke.brushSize,
    stroke.opacity,
    stroke.points,
  );

  return (
    <Path
      d={stroke.smoothedPath ?? ''}
      fill={stroke.color ?? '#000'}
      fillOpacity={strokeOpacity}
      stroke="none"
      filter={filter}
    />
  );
}