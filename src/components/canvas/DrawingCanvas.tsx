import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Rect, Path, Circle, G, Defs, Filter, FeTurbulence, FeDisplacementMap, FeGaussianBlur } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';

import { useCanvas } from '@/src/state/CanvasContext';
import { screenToCanvas } from '@/src/engine/gestures/CoordinateTransform';
import { mapPinchCenter } from '@/src/engine/gestures/PinchHandler';
import { translateTransform } from '@/src/engine/gestures/PanHandler';
import { BrushEngine } from '@/src/engine/brushes/BrushEngine';
import { getBrushRenderConfig } from '@/src/engine/brushes/brushStyles';
import { DrawCommand } from '@/src/engine/commands/DrawCommand';
import { EraseCommand } from '@/src/engine/commands/EraseCommand';
import { Stroke, Point } from '@/src/state/types';
import { generateUniqueId } from '@/src/utils/idUtils';
import { getActiveLayer } from '@/src/state/selectors';

import { TopToolbar } from '@/src/components/toolbar/TopToolbar';
import { LeftToolbar } from '@/src/components/toolbar/LeftToolbar';
import { RightToolbar } from '@/src/components/toolbar/RightToolbar';
import { BottomToolbar } from '@/src/components/toolbar/BottomToolbar';
import { CanvasLayer } from './CanvasLayer';

const CANVAS_WIDTH = 2048;
const CANVAS_HEIGHT = 2048;

function distanceBetweenPoints(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function distancePointToSegment(point: Point, segmentStart: Point, segmentEnd: Point): number {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;
  if (dx === 0 && dy === 0) return distanceBetweenPoints(point, segmentStart);

  const t = Math.max(0, Math.min(1, ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / (dx * dx + dy * dy)));
  const projection = { x: segmentStart.x + t * dx, y: segmentStart.y + t * dy };
  return distanceBetweenPoints(point, projection);
}

function densifyPath(points: Point[], maxStep: number): Point[] {
  if (points.length < 2) return [...points];
  const result: Point[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    result.push(start);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxStep) {
      const steps = Math.ceil(dist / maxStep);
      for (let step = 1; step < steps; step += 1) {
        const t = step / steps;
        result.push({
          x: start.x + dx * t,
          y: start.y + dy * t,
          pressure: start.pressure !== undefined && end.pressure !== undefined
            ? start.pressure + (end.pressure - start.pressure) * t
            : start.pressure,
          time: start.time !== undefined && end.time !== undefined
            ? Math.round(start.time + (end.time - start.time) * t)
            : start.time,
        });
      }
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

function orientation(p: Point, q: Point, r: Point) {
  return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

function onSegment(p: Point, q: Point, r: Point) {
  return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function segmentsIntersect(p1: Point, q1: Point, p2: Point, q2: Point) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return (o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0);
}

function segmentsDistance(a1: Point, a2: Point, b1: Point, b2: Point): number {
  if (segmentsIntersect(a1, a2, b1, b2)) return 0;
  const d1 = distancePointToSegment(a1, b1, b2);
  const d2 = distancePointToSegment(a2, b1, b2);
  const d3 = distancePointToSegment(b1, a1, a2);
  const d4 = distancePointToSegment(b2, a1, a2);
  return Math.min(d1, d2, d3, d4);
}


function splitStrokeByEraserPath(stroke: Stroke, eraserPoints: Point[], eraserSize: number): Stroke[] {
  if (eraserPoints.length === 0) return [stroke];

  // Precise radius: half of eraser diameter + half of stroke width
  const eraserRadius = (eraserSize / 2) + ((stroke.brushSize || 1) / 2);

  // Quick bounding box check
  let minSX = Infinity, maxSX = -Infinity, minSY = Infinity, maxSY = -Infinity;
  stroke.points.forEach(p => {
    if (p.x < minSX) minSX = p.x;
    if (p.x > maxSX) maxSX = p.x;
    if (p.y < minSY) minSY = p.y;
    if (p.y > maxSY) maxSY = p.y;
  });

  let minEX = Infinity, maxEX = -Infinity, minEY = Infinity, maxEY = -Infinity;
  eraserPoints.forEach(p => {
    if (p.x < minEX) minEX = p.x;
    if (p.x > maxEX) maxEX = p.x;
    if (p.y < minEY) minEY = p.y;
    if (p.y > maxEY) maxEY = p.y;
  });

  // If bounding boxes don't overlap (with radius buffer), skip
  if (maxSX < minEX - eraserRadius || minSX > maxEX + eraserRadius ||
      maxSY < minEY - eraserRadius || minSY > maxEY + eraserRadius) {
    return [stroke];
  }

  // Preliminary hit check: only proceed if any segment of the stroke is actually within radius
  let anyHit = false;
  if (eraserPoints.length === 1) {
    const ep = eraserPoints[0];
    for (let i = 0; i < stroke.points.length - 1; i++) {
      if (distancePointToSegment(ep, stroke.points[i], stroke.points[i + 1]) <= eraserRadius) {
        anyHit = true;
        break;
      }
    }
    if (!anyHit && stroke.points.length === 1) {
      if (distanceBetweenPoints(ep, stroke.points[0]) <= eraserRadius) anyHit = true;
    }
  } else {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      for (let j = 0; j < eraserPoints.length - 1; j++) {
        if (segmentsDistance(stroke.points[i], stroke.points[i + 1], eraserPoints[j], eraserPoints[j + 1]) <= eraserRadius) {
          anyHit = true;
          break;
        }
      }
      if (anyHit) break;
    }
  }

  if (!anyHit) return [stroke];

  // We densify the stroke to allow it to be split at many points for smooth erasure
  const splitPoints = densifyPath(stroke.points, Math.max(2, eraserRadius / 2));
  const n = splitPoints.length;
  
  if (n < 2) {
    // Single-point stroke hit
    return [];
  }

  const erasedSeg: boolean[] = new Array(n - 1).fill(false);
  const m = eraserPoints.length;

  for (let i = 0; i < n - 1; i += 1) {
    const a1 = splitPoints[i];
    const a2 = splitPoints[i + 1];
    
    if (m === 1) {
      if (distancePointToSegment(eraserPoints[0], a1, a2) <= eraserRadius) erasedSeg[i] = true;
    } else {
      for (let j = 0; j < m - 1; j += 1) {
        if (segmentsDistance(a1, a2, eraserPoints[j], eraserPoints[j + 1]) <= eraserRadius) {
          erasedSeg[i] = true;
          break;
        }
      }
    }
  }

  // If no segments were actually erased after densification (highly unlikely if anyHit was true, but safe)
  if (!erasedSeg.some(s => s)) return [stroke];

  const segmentsOut: Stroke[] = [];
  let currentPts: Point[] = [];
  
  for (let i = 0; i < n - 1; i += 1) {
    if (!erasedSeg[i]) {
      if (currentPts.length === 0) currentPts.push(splitPoints[i]);
      currentPts.push(splitPoints[i + 1]);
    } else {
      if (currentPts.length > 0) {
        segmentsOut.push({
          ...stroke,
          id: generateUniqueId('stroke'),
          points: currentPts,
          smoothedPath: BrushEngine.generateStroke(currentPts, stroke.brushType, stroke.brushSize).pathString,
        });
        currentPts = [];
      }
    }
  }

  if (currentPts.length > 0) {
    segmentsOut.push({
      ...stroke,
      id: generateUniqueId('stroke'),
      points: currentPts,
      smoothedPath: BrushEngine.generateStroke(currentPts, stroke.brushType, stroke.brushSize).pathString,
    });
  }

  return segmentsOut;
}

function buildPathFromPoints(points: Point[]): string | null {
  if (points.length < 2) return null;
  return points.reduce(
    (path, point, index) => index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`,
    '',
  );
}

export function DrawingCanvas() {
  const {
    state,
    addStroke,
    removeStroke,
    restoreStrokes,
    removeStrokes,
    updateTransform,
    setLayerStrokes,
    executeCommand,
  } = useCanvas();

  const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const viewShotRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [eraserPoint, setEraserPoint] = useState<Point | null>(null);
  const [eraserPreviewPath, setEraserPreviewPath] = useState<string | null>(null);

  const transformRef = useRef(state.transform);
  const pinchBaseRef = useRef(state.transform);
  const panBaseRef = useRef(state.transform);
  const pendingPointsRef = useRef<{ x: number; y: number; pressure?: number; time: number }[]>([]);
  const currentEraserPathRef = useRef<Point[]>([]);
  const originalStrokesRef = useRef<Stroke[]>([]);
  const lastUpdateRef = useRef<number>(0);

  // Calculate dynamic SVG height to maintain uniform scaling based on CANVAS_WIDTH
  const svgHeight = useMemo(() => {
    if (canvasLayout.width === 0) return CANVAS_HEIGHT;
    return (canvasLayout.height / canvasLayout.width) * CANVAS_WIDTH;
  }, [canvasLayout.width, canvasLayout.height]);

  const previewStyle = useMemo(
    () => getBrushRenderConfig(state.brushType, state.brushSize, state.brushOpacity),
    [state.brushType, state.brushSize, state.brushOpacity],
  );

  useEffect(() => {
    transformRef.current = state.transform;
  }, [state.transform]);

  const activeLayer = useMemo(
    () => {
      const layer = getActiveLayer(state);
      if (!layer) console.error('Active layer not found in state:', state);
      return layer;
    },
    [state],
  );

  const handleLayout = useCallback(() => {
    canvasRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setCanvasLayout({ x, y, width, height });
    });
  }, []);

  const screenToSvg = useCallback((screenX: number, screenY: number) => {
    // Use a uniform scale factor to prevent distortion
    const scale = CANVAS_WIDTH / Math.max(1, canvasLayout.width);
    return {
      x: screenX * scale,
      y: screenY * scale,
    };
  }, [canvasLayout.width]);

  const screenPointToCanvasPoint = useCallback((screenX: number, screenY: number) => {
    const svgPoint = screenToSvg(screenX, screenY);
    return screenToCanvas(svgPoint.x, svgPoint.y, transformRef.current);
  }, [screenToSvg]);

  const commitStroke = useCallback(() => {
    const points = pendingPointsRef.current;
    if (points.length < 2 || !activeLayer || state.activeTool !== 'brush') {
      pendingPointsRef.current = [];
      setPreviewPath(null);
      return;
    }

    const { pathString, points: preparedPoints } = BrushEngine.generateStroke(points, state.brushType, state.brushSize);
    const stroke: Stroke = {
      id: generateUniqueId('stroke'),
      layerId: activeLayer.id,
      points: preparedPoints,
      color: state.currentColor,
      opacity: state.brushOpacity,
      brushSize: state.brushSize,
      brushType: state.brushType,
      blendMode: 'normal',
      smoothedPath: pathString,
    };

    executeCommand(new DrawCommand(activeLayer, stroke, addStroke, removeStroke));
    pendingPointsRef.current = [];
    setPreviewPath(null);
  }, [activeLayer, state.activeTool, state.brushType, state.currentColor, state.brushOpacity, state.brushSize, addStroke, removeStroke, executeCommand]);

  const performIncrementalErasure = useCallback((newEraserPoints: Point[]) => {
    if (!activeLayer) return;
    
    const currentStrokes = activeLayer.strokes || [];
    const nextStrokes: Stroke[] = [];
    let changed = false;

    currentStrokes.forEach((stroke) => {
      // Use splitStrokeByEraserPath with the new small segment of eraser path
      const segments = splitStrokeByEraserPath(stroke, newEraserPoints, state.brushSize);
      const strokeWasModified = segments.length !== 1 || segments[0].points.length !== stroke.points.length;
      
      if (strokeWasModified) {
        nextStrokes.push(...segments);
        changed = true;
      } else {
        nextStrokes.push(stroke);
      }
    });

    if (changed) {
      setLayerStrokes(activeLayer.id, nextStrokes);
    }
  }, [activeLayer, state.brushSize, setLayerStrokes]);

  const commitEraser = useCallback(() => {
    if (!activeLayer) {
      currentEraserPathRef.current = [];
      setEraserPoint(null);
      return;
    }

    // At the end, we compare current strokes with originalStrokesRef to commit one command
    const originalStrokes = originalStrokesRef.current;
    const finalStrokes = activeLayer.strokes || [];

    // Simplified: any stroke in original not in final (by ID) is removed
    // Any stroke in final not in original is added
    const finalIds = new Set(finalStrokes.map(s => s.id));
    const originalIds = new Set(originalStrokes.map(s => s.id));

    const removed = originalStrokes.filter(s => !finalIds.has(s.id));
    const added = finalStrokes.filter(s => !originalIds.has(s.id));

    if (removed.length > 0 || added.length > 0) {
      executeCommand(new EraseCommand(
        activeLayer.id,
        removed,
        added,
        (layerId, ids) => removeStrokes(layerId, ids),
        (layerId, strokes) => restoreStrokes(layerId, strokes),
      ));
    }

    currentEraserPathRef.current = [];
    setEraserPoint(null);
    originalStrokesRef.current = [];
  }, [activeLayer, executeCommand, removeStrokes, restoreStrokes]);

  const gesture = useMemo(() => {
    const drawGesture = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .runOnJS(true)
      .onBegin((event) => {
        const x = event.x;
        const y = event.y;
        const point = screenPointToCanvasPoint(x, y);

        if (state.activeTool === 'brush') {
          pendingPointsRef.current = [{ ...point, pressure: 1, time: Date.now() }];
          setEraserPoint(null);
          setEraserPreviewPath(null);
        } else if (state.activeTool === 'eraser') {
          currentEraserPathRef.current = [point];
          originalStrokesRef.current = activeLayer?.strokes || [];
          setEraserPoint(point);
          setEraserPreviewPath(null);
        }
      })
      .onUpdate((event) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 16) return; // Throttle to ~60fps
        lastUpdateRef.current = now;

        const x = event.x;
        const y = event.y;
        const point = screenPointToCanvasPoint(x, y);

        if (state.activeTool === 'brush') {
          pendingPointsRef.current = [...pendingPointsRef.current, { ...point, pressure: 1, time: now }];
          if (pendingPointsRef.current.length >= 2) {
            const { pathString } = BrushEngine.generateStroke(pendingPointsRef.current, state.brushType, state.brushSize);
            setPreviewPath(pathString);
          }
        } else if (state.activeTool === 'eraser') {
          const lastPoint = currentEraserPathRef.current[currentEraserPathRef.current.length - 1];
          const newSegment = [lastPoint, point];
          currentEraserPathRef.current = [...currentEraserPathRef.current, point];
          performIncrementalErasure(newSegment);
          setEraserPoint(point);
          setEraserPreviewPath(buildPathFromPoints(currentEraserPathRef.current));
        }
      })
      .onEnd(() => {
        if (state.activeTool === 'brush') commitStroke();
        else if (state.activeTool === 'eraser') {
          commitEraser();
          setEraserPreviewPath(null);
        }
      });

    const pinchGesture = Gesture.Pinch()
      .runOnJS(true)
      .onBegin(() => { pinchBaseRef.current = state.transform; })
      .onUpdate((event: any) => {
        if (!event.scale) return;
        const focal = screenToSvg(event.focalX, event.focalY);
        updateTransform(mapPinchCenter(pinchBaseRef.current, focal.x, focal.y, event.scale));
      });

    const panGesture = Gesture.Pan()
      .minPointers(2)
      .runOnJS(true)
      .onBegin(() => { panBaseRef.current = state.transform; })
      .onUpdate((event) => {
        const svgDelta = screenToSvg(event.translationX, event.translationY);
        updateTransform(translateTransform(panBaseRef.current, svgDelta.x, svgDelta.y));
      });

    return Gesture.Simultaneous(drawGesture, pinchGesture, panGesture);
  }, [state.activeTool, state.brushType, state.transform, canvasLayout, screenPointToCanvasPoint, screenToSvg, commitStroke, commitEraser, updateTransform, activeLayer]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <ViewShot ref={viewShotRef} style={StyleSheet.absoluteFill}>
          <View ref={canvasRef} onLayout={handleLayout} style={StyleSheet.absoluteFill}>
            <Svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${CANVAS_WIDTH} ${svgHeight}`}
            >
              <Defs>
                <Filter id="pencilTexture" x="-10%" y="-10%" width="120%" height="120%">
                  <FeTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" result="noise" />
                  <FeDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
                </Filter>
                <Filter id="watercolorSoft" x="-20%" y="-20%" width="140%" height="140%">
                  <FeGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                </Filter>
              </Defs>
              <Rect width={CANVAS_WIDTH} height={svgHeight} fill="#FAFAFA" />
              <G
                transform={`translate(${state.transform.offsetX}, ${state.transform.offsetY}) scale(${state.transform.scale}) rotate(${(state.transform.rotation * 180) / Math.PI})`}
              >
                {state.layers.map((layer) => (
                  <CanvasLayer key={layer.id} layer={layer} />
                ))}
                {previewPath && state.activeTool === 'brush' && (
                  <Path
                    d={previewPath}
                    fill={state.currentColor}
                    fillOpacity={previewStyle.strokeOpacity}
                    stroke="none"
                    filter={previewStyle.filter}
                  />
                )}
                {eraserPreviewPath && state.activeTool === 'eraser' && (
                  <Path
                    d={eraserPreviewPath}
                    stroke="red"
                    strokeWidth={Math.max(2, state.brushSize)}
                    strokeOpacity={0.6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {eraserPoint && state.activeTool === 'eraser' && (
                  <Circle
                    cx={eraserPoint.x}
                    cy={eraserPoint.y}
                    r={state.brushSize / 2}
                    fill="red"
                    stroke="red"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                  />
                )}
              </G>
            </Svg>
          </View>
        </ViewShot>
      </GestureDetector>

      <TopToolbar viewShotRef={viewShotRef} />
      <LeftToolbar />
      <RightToolbar />
      <BottomToolbar viewShotRef={viewShotRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
});
