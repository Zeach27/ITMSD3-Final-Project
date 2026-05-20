import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

import { useCanvas } from '@/src/state/CanvasContext';
import { AddLayerCommand } from '@/src/engine/commands/AddLayerCommand';
import { DeleteLayerCommand } from '@/src/engine/commands/DeleteLayerCommand';
import { MoveLayerCommand } from '@/src/engine/commands/MoveLayerCommand';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LayerManagerModal() {
  const router = useRouter();
  const {
    state,
    addLayer,
    deleteLayer,
    reorderLayers,
    renameLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    setActiveLayer,
    setLayersOrder,
    executeCommand,
  } = useCanvas();
  const [titleEdits, setTitleEdits] = useState<Record<string, string>>({});
  const slide = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [slide]);

  const layerItems = useMemo(
    () => [...state.layers].sort((a, b) => b.order - a.order),
    [state.layers],
  );

  const createLayer = () => {
    const nextLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${state.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal' as const,
      strokes: [],
      order: state.layers.length,
    };
    const command = new AddLayerCommand(nextLayer, addLayer, deleteLayer);
    executeCommand(command);
    setActiveLayer(nextLayer.id); // Explicitly set as active
  };

  const removeLayer = (layerId: string) => {
    if (state.layers.length <= 1) return;
    const layer = state.layers.find((item) => item.id === layerId);
    if (!layer) return;
    const command = new DeleteLayerCommand(layer, deleteLayer, addLayer);
    executeCommand(command);
  };

  const renderLayer = ({ item, drag, isActive }: RenderItemParams<typeof state.layers[number]>) => {
    const isSelected = state.activeLayerId === item.id;
    return (
      <View style={[styles.layerRow, isSelected && styles.layerRowActive, isActive && styles.layerRowDragging]}>
        <View style={styles.layerMain}>
           <Pressable onPressIn={drag} style={styles.dragHandle}>
             <MaterialCommunityIcons name="drag" size={24} color={isSelected ? "#FFFFFF" : "#555"} />
           </Pressable>
           <Pressable onPress={() => setActiveLayer(item.id)} style={{flex: 1, paddingHorizontal: 8}}>
            <TextInput
              style={[styles.nameInput, isSelected && styles.nameInputActive]}
              value={titleEdits[item.id] ?? item.name}
              onChangeText={(text) => setTitleEdits((current) => ({ ...current, [item.id]: text }))}
              onBlur={() => {
                const name = titleEdits[item.id]?.trim();
                if (name) renameLayer(item.id, name);
              }}
              placeholder="Layer Name"
              placeholderTextColor={isSelected ? "#FFFFFF" : "#555"}
            />
           </Pressable>
        </View>
        <View style={styles.buttonRow}>
          <Pressable onPress={() => toggleLayerVisibility(item.id)} style={styles.actionButton}>
            <MaterialCommunityIcons name={item.visible ? "eye-outline" : "eye-off-outline"} size={22} color={isSelected ? "#FFFFFF" : "#8E8E93"} />
          </Pressable>
          <Pressable onPress={() => toggleLayerLock(item.id)} style={styles.actionButton}>
            <MaterialCommunityIcons name={item.locked ? "lock" : "lock-open-variant-outline"} size={22} color={isSelected ? "#FFFFFF" : "#8E8E93"} />
          </Pressable>
          <Pressable onPress={() => removeLayer(item.id)} style={[styles.actionButton, styles.deleteButton]}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF453A" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.modalWrapper}>
      <Animated.View style={[styles.modalContent, { transform: [{ translateY: slide }] }]}> 
        <View style={styles.titleRow}>
          <ThemedText style={styles.title}>Layers</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        <Pressable onPress={createLayer} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          <ThemedText style={styles.addButtonText}>Add New Layer</ThemedText>
        </Pressable>
        <DraggableFlatList
          data={layerItems}
          keyExtractor={(item) => item.id}
          renderItem={renderLayer}
          onDragEnd={({ data }) => {
             // Map data (top-to-bottom) to internal order
             const reorderedLayers = data.map((item, index) => ({
               ...item,
               order: data.length - 1 - index,
             }));
             setLayersOrder(reorderedLayers);

             // If the layer is moved to the top (index 0), make it active
             if (reorderedLayers[0]) {
               setActiveLayer(reorderedLayers[0].id);
             }
          }}
          contentContainerStyle={styles.list}
        />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalWrapper: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    height: '70%', padding: 20,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    backgroundColor: '#1C1C1E',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  closeButton: { padding: 4, backgroundColor: '#3A3A3C', borderRadius: 12 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 20, padding: 14, borderRadius: 16, backgroundColor: '#5856D6',
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  list: { gap: 12 },
  layerRow: {
    padding: 12, borderRadius: 16, backgroundColor: '#2C2C2E',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  layerRowActive: { borderWidth: 2, borderColor: '#5856D6', backgroundColor: '#3A3A3C' },
  layerRowDragging: { backgroundColor: '#3A3A3C', opacity: 0.8 },
  layerMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dragHandle: { paddingRight: 8 },
  nameInput: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  nameInputActive: { fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 4 },
  actionButton: { padding: 10, borderRadius: 12, backgroundColor: '#3A3A3C' },
  deleteButton: { backgroundColor: 'transparent' },
});
