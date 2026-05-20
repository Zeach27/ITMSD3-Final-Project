import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCanvas } from '@/src/state/CanvasContext';
import { ColorPicker } from '@/src/components/toolbar/ColorPicker';
import { SliderKnob } from '@/src/components/ui/SliderKnob';
import { ThemedText } from '@/components/themed-text';

type Panel = 'color' | 'size' | 'none';

export function RightToolbar() {
  const { state, setBrushSize, setBrushOpacity } = useCanvas();
  const [activePanel, setActivePanel] = useState<Panel>('none');

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.toolbar}>
        <Pressable onPress={() => setActivePanel(activePanel === 'color' ? 'none' : 'color')} style={styles.swatchButton}>
          <View style={[styles.swatch, { backgroundColor: state.currentColor, borderColor: activePanel === 'color' ? '#5856D6' : '#555' }]} />
        </Pressable>
        <Pressable onPress={() => setActivePanel(activePanel === 'size' ? 'none' : 'size')} style={[styles.sizeButton, activePanel === 'size' && styles.sizeButtonActive]}>
          <MaterialCommunityIcons name="format-size" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      {activePanel === 'color' && (
        <View style={styles.panel}>
          <ColorPicker />
        </View>
      )}
      {activePanel === 'size' && (
        <View style={styles.panel}>
          <ThemedText style={styles.panelTitle}>Brush Settings</ThemedText>
          <View style={styles.sliderGroup}>
            <ThemedText style={styles.sliderLabel}>Size: {state.brushSize}px</ThemedText>
            <SliderKnob value={state.brushSize} min={2} max={100} onChange={setBrushSize} />
          </View>
          <View style={styles.sliderGroup}>
            <ThemedText style={styles.sliderLabel}>Opacity: {Math.round(state.brushOpacity * 100)}%</ThemedText>
            <SliderKnob value={Math.round(state.brushOpacity * 100)} min={5} max={100} onChange={(v) => setBrushOpacity(v / 100)} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', right: 10, top: 80, zIndex: 100, alignItems: 'flex-end' },
  toolbar: {
    backgroundColor: 'rgba(36, 36, 38, 0.95)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 16,
    width: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  swatchButton: { padding: 4 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
  sizeButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center',
  },
  sizeButtonActive: { backgroundColor: '#5856D6' },
  panelTitle: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  panel: {
    marginTop: 10,
    backgroundColor: 'rgba(36, 36, 38, 0.98)',
    borderRadius: 20,
    padding: 16,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sliderGroup: { marginBottom: 12 },
  sliderLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 6, fontWeight: '600' },
});
