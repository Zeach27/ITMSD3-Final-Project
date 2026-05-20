import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCanvas } from '@/src/state/CanvasContext';
import { BrushType } from '@/src/state/types';
import { SliderKnob } from '@/src/components/ui/SliderKnob';
import { ThemedText } from '@/components/themed-text';

const BRUSH_OPTIONS: { type: BrushType; displayName: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { type: 'pencil', displayName: 'Precille', label: 'Pencil', icon: 'pencil' },
  { type: 'ink', displayName: 'Smooth Criminal', label: 'Ink', icon: 'fountain-pen' },
  { type: 'watercolor', displayName: 'Dreamwash', label: 'Watercolor', icon: 'water' },
  { type: 'marker', displayName: 'Neon Marker', label: 'Marker', icon: 'marker' },
];

interface BrushPanelProps {
  onSelect?: () => void;
}

export function BrushPanel({ onSelect }: BrushPanelProps) {
  const { state, setBrushType, setBrushSize, setBrushOpacity } = useCanvas();

  const handleSelect = (type: BrushType) => {
    setBrushType(type);
    onSelect?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Brush Library</ThemedText>
      </View>
      <View style={styles.brushList}>
        {BRUSH_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            onPress={() => handleSelect(option.type)}
            style={[styles.brushOption, state.brushType === option.type && styles.brushOptionActive]}
          >
            <MaterialCommunityIcons 
              name={option.icon} 
              size={22} 
              color={state.brushType === option.type ? '#FFFFFF' : '#8E8E93'} 
            />
            <ThemedText style={[styles.brushName, state.brushType === option.type && styles.brushLabelActive]}>
              {option.displayName}
            </ThemedText>
            <ThemedText style={[styles.brushLabel, state.brushType === option.type && styles.brushLabelActive]}>
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
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
    backgroundColor: 'rgba(36, 36, 38, 0.98)',
    borderRadius: 20,
    padding: 16,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.5 },
  brushList: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  brushOption: {
    padding: 10, borderRadius: 12, backgroundColor: '#2C2C2E',
    alignItems: 'center', gap: 6, width: 100,
  },
  brushOptionActive: { backgroundColor: '#5856D6' },
  brushName: { fontSize: 11, color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  brushLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '500', textAlign: 'center' },
  brushLabelActive: { color: '#FFFFFF' },
  sliderSection: { marginBottom: 12 },
  sliderLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 6, fontWeight: '600' },
});
