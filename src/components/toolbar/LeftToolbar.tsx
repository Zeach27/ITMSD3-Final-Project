import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCanvas } from '@/src/state/CanvasContext';
import { Tool, BrushType } from '@/src/state/types';
import { BrushPanel } from '@/src/components/toolbar/BrushPanel';

interface ToolItem {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  tool: Tool;
  brushType?: BrushType;
}

const TOOLS: ToolItem[] = [
  { id: 'brush', icon: 'brush', label: 'Brush Library', tool: 'brush' },
  { id: 'pencil', icon: 'pencil', label: 'Pencil', tool: 'brush', brushType: 'pencil' },
  { id: 'eraser', icon: 'eraser', label: 'Eraser', tool: 'eraser' },
  { id: 'selection', icon: 'selection-drag', label: 'Select', tool: 'selection' },
  { id: 'move', icon: 'hand-back-right', label: 'Move', tool: 'move' },
];

export function LeftToolbar() {
  const { state, setTool, setBrushType } = useCanvas();

  const [showBrushPanel, setShowBrushPanel] = useState(false);

  const isActive = (item: ToolItem) => {
    if (item.id === 'pencil') {
      return state.activeTool === 'brush' && state.brushType === 'pencil';
    }
    if (item.id === 'brush') {
      return state.activeTool === 'brush' && state.brushType !== 'pencil';
    }
    return state.activeTool === item.tool;
  };

  const handlePress = (item: ToolItem) => {
    if (item.id === 'brush') {
      setTool('brush');
      setShowBrushPanel((prev) => !prev);
      return;
    }

    setShowBrushPanel(false);
    setTool(item.tool);
    if (item.brushType) {
      setBrushType(item.brushType);
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.panelRow}>
        <View style={styles.toolbar}>
          {TOOLS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handlePress(item)}
              style={[styles.toolButton, isActive(item) && styles.toolButtonActive]}
            >
              <MaterialCommunityIcons 
                name={item.icon} 
                size={24} 
                color={isActive(item) ? '#FFFFFF' : '#8E8E93'} 
              />
            </Pressable>
          ))}
        </View>
        {showBrushPanel && (
          <View style={styles.brushPanelContainer}>
            <BrushPanel onSelect={() => setShowBrushPanel(false)} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 10, top: 80, zIndex: 100 },
  panelRow: { flexDirection: 'row', alignItems: 'flex-start' },
  toolbar: {
    backgroundColor: 'rgba(36, 36, 38, 0.95)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  brushPanelContainer: {
    marginLeft: 10,
    marginTop: 6,
  },
  toolButton: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  toolButtonActive: { backgroundColor: '#5856D6' },
});
