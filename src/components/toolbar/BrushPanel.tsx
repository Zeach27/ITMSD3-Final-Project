import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path, Defs, Filter, FeTurbulence, FeGaussianBlur, FeDisplacementMap } from 'react-native-svg';
import { useCanvas } from '@/src/state/CanvasContext';
import { BrushEngine } from '@/src/engine/brushes/BrushEngine';
import { getBrushRenderConfig } from '@/src/engine/brushes/brushStyles';
import { BrushType, Point } from '@/src/state/types';
import { SliderKnob } from '@/src/components/ui/SliderKnob';
import { ThemedText } from '@/components/themed-text';

const BRUSH_OPTIONS: { type: BrushType; displayName: string; label: string }[] = [
  { type: 'syrup', displayName: 'Syrup', label: 'Syrup' },
  { type: 'thylacine', displayName: 'Thylacine', label: 'Thylacine' },
  { type: 'fineTip', displayName: 'Fine Tip', label: 'Fine Tip' },
  { type: 'technicalPen', displayName: 'Technical Pen', label: 'Technical Pen' },
  { type: 'gelPen', displayName: 'Gel Pen', label: 'Gel Pen' },
  { type: 'inkBleed', displayName: 'Ink Bleed', label: 'Ink Bleed' },
  { type: 'studioPen', displayName: 'Studio Pen', label: 'Studio Pen' },
  { type: 'dryInk', displayName: 'Dry Ink', label: 'Dry Ink' },
  { type: 'gesinskiInk', displayName: 'Gesinski Ink', label: 'Gesinski Ink' },
  { type: 'marker', displayName: 'Marker', label: 'Marker' },
];

// Beautiful unified master S-curve point sequence matching the Procreate brush library look exactly
const MASTER_PREVIEW_SHAPE: Point[] = [
  { x: 15, y: 22, time: 0 },
  { x: 45, y: 24, time: 30 },
  { x: 75, y: 22, time: 60 },
  { x: 105, y: 18, time: 90 },
  { x: 135, y: 13, time: 120 },
  { x: 165, y: 12, time: 150 },
  { x: 195, y: 15, time: 180 },
  { x: 215, y: 14, time: 210 },
];

const PREVIEW_SHAPES: Record<BrushType, Point[]> = {
  pencil: MASTER_PREVIEW_SHAPE,
  ink: MASTER_PREVIEW_SHAPE,
  watercolor: MASTER_PREVIEW_SHAPE,
  marker: MASTER_PREVIEW_SHAPE,
  syrup: MASTER_PREVIEW_SHAPE,
  thylacine: MASTER_PREVIEW_SHAPE,
  fineTip: MASTER_PREVIEW_SHAPE,
  technicalPen: MASTER_PREVIEW_SHAPE,
  gelPen: MASTER_PREVIEW_SHAPE,
  inkBleed: MASTER_PREVIEW_SHAPE,
  studioPen: MASTER_PREVIEW_SHAPE,
  dryInk: MASTER_PREVIEW_SHAPE,
  gesinskiInk: MASTER_PREVIEW_SHAPE,
};

interface BrushPanelProps {
  onSelect?: () => void;
}

export function BrushPanel({ onSelect }: BrushPanelProps) {
  const { state, setBrushType, setBrushSize, setBrushOpacity } = useCanvas();

  const brushPreviews = useMemo(
    () => BRUSH_OPTIONS.reduce<Record<BrushType, { pathString: string; points: Point[] }>>((map, option) => {
      // Set distinct preview sizes so that thin brushes are fine and thick ones are robust
      let previewSize = 8;
      if (option.type === 'marker') previewSize = 13;
      else if (option.type === 'syrup') previewSize = 10;
      else if (option.type === 'studioPen') previewSize = 10;
      else if (option.type === 'gesinskiInk') previewSize = 11;
      else if (option.type === 'fineTip') previewSize = 6;
      else if (option.type === 'gelPen') previewSize = 8;

      map[option.type] = BrushEngine.generateStroke(PREVIEW_SHAPES[option.type], option.type, previewSize);
      return map;
    }, {} as Record<BrushType, { pathString: string; points: Point[] }>),
    [],
  );

  const handleSelect = (type: BrushType) => {
    setBrushType(type);
    onSelect?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Brush Library</ThemedText>
      </View>
      <ScrollView style={styles.brushListContainer} contentContainerStyle={styles.brushListContent} showsVerticalScrollIndicator={false}>
        {BRUSH_OPTIONS.map((option) => {
          const preview = brushPreviews[option.type];
          const previewStyle = getBrushRenderConfig(option.type, 5, 0.85, preview.points);
          const isSelected = state.brushType === option.type;

          return (
            <Pressable
              key={option.type}
              onPress={() => handleSelect(option.type)}
              style={[styles.brushOption, isSelected && styles.brushOptionActive]}
            >
              <ThemedText style={[styles.brushName, isSelected && styles.brushNameActive]}>
                {option.displayName}
              </ThemedText>
              <View style={styles.previewContainer}>
                <Svg width={220} height={38} viewBox="0 0 220 38">
                  <Defs>
                    <Filter id="pencilTexture" x="-10%" y="-10%" width="120%" height="120%">
                      <FeTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" result="noise" />
                      <FeDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
                    </Filter>
                    <Filter id="watercolorSoft" x="-20%" y="-20%" width="140%" height="140%">
                      <FeGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
                    </Filter>
                  </Defs>
                  <Path
                    d={preview.pathString}
                    fill="#FFFFFF"
                    fillOpacity={previewStyle.strokeOpacity}
                    stroke="none"
                    filter={previewStyle.filter}
                  />
                </Svg>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.sliderSection}>
        <ThemedText style={styles.sliderLabel}>Size: {state.brushSize}px</ThemedText>
        <SliderKnob value={state.brushSize} min={2} max={100} onChange={setBrushSize} />
      </View>
      <View style={styles.sliderSection}>
        <ThemedText style={styles.sliderLabel}>Opacity: {Math.round(state.brushOpacity * 100)}%</ThemedText>
        <SliderKnob value={Math.round(state.brushOpacity * 100)} min={5} max={100} onChange={(v) => setBrushOpacity(v / 100)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151517', // Match Procreate elegant dark theme
    borderRadius: 20,
    padding: 16,
    width: 270, // Slightly wider to support elegant previews
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '800', color: '#E5E5EA', letterSpacing: 0.6 },
  brushListContainer: { maxHeight: 420, marginBottom: 16 }, // Taller scroll window
  brushListContent: { paddingBottom: 8 },
  brushOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#222224', // Elegant charcoal inactive background
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8, // Tighter margin like the screenshot
    height: 80, // Taller cards
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  brushOptionActive: { 
    backgroundColor: '#2F70F2', // Gorgeous Procreate blue highlight
    shadowColor: '#2F70F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  brushName: { fontSize: 13, color: '#D1D1D6', fontWeight: '600' },
  brushNameActive: { color: '#FFFFFF', fontWeight: '700' },
  previewContainer: { 
    width: '100%', 
    height: 38, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 2,
  },
  sliderSection: { marginBottom: 14 },
  sliderLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 8, fontWeight: '700', letterSpacing: 0.3 },
});
