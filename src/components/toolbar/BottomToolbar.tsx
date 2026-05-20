import React, { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

import { useCanvas } from '@/src/state/CanvasContext';
import { ThemedText } from '@/components/themed-text';
import { AsyncStorageService } from '@/src/storage/AsyncStorageService';
import { ArtworkRecord } from '@/src/storage/schema';

type ViewShotRef = React.RefObject<any>;

interface BottomToolbarProps {
  viewShotRef: ViewShotRef;
}

export function BottomToolbar({ viewShotRef }: BottomToolbarProps) {
  const router = useRouter();
  const { state, undo, redo, resetCanvas } = useCanvas();
  const layerCount = state.layers.length;
  const stateRef = useRef(state);

  // Keep ref updated with latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const exportToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is needed to save your drawing.');
        return;
      }
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture({
          format: 'jpg',
          quality: 0.8,
        });
        await MediaLibrary.saveToLibraryAsync(uri);

        // Use ref to get current state
        const currentState = stateRef.current;
        const record: ArtworkRecord = {
          id: currentState.id,
          title: currentState.title,
          layers: currentState.layers,
          canvasWidth: currentState.canvasWidth,
          canvasHeight: currentState.canvasHeight,
          thumbnail: uri, // Save thumbnail URI
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorageService.saveArtwork(record);

        Alert.alert('Success', 'Drawing saved to your gallery!');
      }
    } catch (e) {
      console.error('Export failed:', e);
      Alert.alert('Error', 'Failed to save the image.');
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.toolbar}>
        <View style={styles.group}>
          <Pressable onPress={undo} disabled={!state.canUndo} style={[styles.button, !state.canUndo && styles.disabled]}>
            <MaterialCommunityIcons name="undo" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={redo} disabled={!state.canRedo} style={[styles.button, !state.canRedo && styles.disabled]}>
            <MaterialCommunityIcons name="redo" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.group}>
          <Pressable onPress={() => router.push('/modal')} style={styles.layersButton}>
            <MaterialCommunityIcons name="layers-outline" size={24} color="#FFFFFF" />
            <View style={styles.badge}>
              <ThemedText style={styles.layersCount}>{layerCount}</ThemedText>
            </View>
          </Pressable>
        </View>
        <View style={styles.group}>
          <Pressable onPress={() => Alert.alert(
            'New Canvas',
            'Start a new canvas? This will clear the current drawing.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'New Canvas', style: 'destructive', onPress: resetCanvas },
            ],
          )} style={styles.button}>
            <MaterialCommunityIcons name="file-plus-outline" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={exportToGallery} style={[styles.button, styles.exportButton]}>
            <MaterialCommunityIcons name="download-circle-outline" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 100, alignItems: 'center' },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(36, 36, 38, 0.95)',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  group: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  button: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  exportButton: {
    width: 45,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  disabled: { opacity: 0.2 },
  layersButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  badge: {
    backgroundColor: '#5856D6',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  layersCount: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
});
