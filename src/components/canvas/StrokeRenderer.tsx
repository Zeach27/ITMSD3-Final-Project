import React from 'react';
import { Path } from 'react-native-svg';
import { Stroke } from '@/src/state/types';

interface StrokeRendererProps {
  stroke: Stroke;
}

export function StrokeRenderer({ stroke }: StrokeRendererProps) {
  if (!stroke.smoothedPath && stroke.points.length < 2) {
    return null;
  }

  // Choose filter and style based on brush type
  let filter: string | undefined;
  let strokeOpacity = stroke.opacity;
  let strokeWidth = stroke.brushSize || 1;
  let strokeLinejoin: "round" | "bevel" | "miter" = "round";

  switch (stroke.brushType) {
    case 'pencil':
      filter = 'url(#pencilTexture)';
      strokeOpacity = Math.min(stroke.opacity, 0.85);
      break;
    case 'watercolor':
      filter = 'url(#watercolorSoft)';
      strokeOpacity = Math.min(stroke.opacity, 0.4);
      strokeWidth *= 1.2; // Watercolor spreads a bit
      break;
    case 'marker':
      strokeOpacity = Math.min(stroke.opacity, 0.6);
      strokeLinejoin = "bevel";
      break;
    case 'ink':
      strokeOpacity = Math.min(stroke.opacity, 0.95);
      break;
  }

  return (
    <Path
      d={stroke.smoothedPath ?? ''}
      stroke={stroke.color ?? '#000'}
      strokeWidth={strokeWidth}
      strokeOpacity={strokeOpacity}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin={strokeLinejoin}
      filter={filter}
    />
  );
}