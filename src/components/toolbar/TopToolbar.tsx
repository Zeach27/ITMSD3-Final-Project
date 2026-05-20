import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pressable, StyleSheet, View, TextInput, Alert } from 'react-native';
import { useCanvas } from '@/src/state/CanvasContext';
import { ThemedText } from '@/components/themed-text';

import { AsyncStorageService } from '@/src/storage/AsyncStorageService';
import { ArtworkRecord } from '@/src/storage/schema';

type ViewShotRef = React.RefObject<any>;

interface TopToolbarProps {
  viewShotRef?: ViewShotRef;
}

export function TopToolbar({ viewShotRef }: TopToolbarProps) {
  const { state, setTitle } = useCanvas();
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(state.title);
  const stateRef = useRef(state);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTempTitle(state.title);
  }, [state.title]);

  // Always keep ref updated with latest state to avoid stale closures
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const generateThumbnail = async (): Promise<string> => {
    if (!viewShotRef?.current?.capture) {
      console.warn('ViewShot not available for thumbnail generation');
      return '';
    }
    try {
      const uri = await viewShotRef.current.capture({
        format: 'jpg',
        quality: 0.6,
      });
      console.log('✓ Thumbnail generated:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return '';
    }
  };

  const handleTitleSubmit = useCallback(() => {
    const newTitle = tempTitle || 'Untitled';
    setTitle(newTitle);
    setIsEditing(false);
    
    Alert.alert(
      "Save Artwork",
      "Do you want to save this artwork to your gallery?",
      [
        { text: "Later", style: "cancel" },
        { 
          text: "Save", 
          onPress: async () => {
            if (isSaving) return;
            setIsSaving(true);
            
            try {
              // Generate thumbnail
              const thumbnail = await generateThumbnail();
              
              // Use ref to get current state instead of stale closure
              const currentState = stateRef.current;
              const record: ArtworkRecord = {
                id: currentState.id,
                title: newTitle,
                layers: currentState.layers,
                canvasWidth: currentState.canvasWidth,
                canvasHeight: currentState.canvasHeight,
                thumbnail: thumbnail,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              await AsyncStorageService.saveArtwork(record);
              console.log('✓ Artwork saved successfully with thumbnail:', record.id);
              Alert.alert('Success', 'Artwork saved to gallery!');
            } catch (error) {
              console.error('Failed to save artwork:', error);
              Alert.alert('Error', 'Failed to save artwork to gallery.');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  }, [tempTitle, isSaving]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.toolbar}>
        <View style={styles.titleContainer}>
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={tempTitle}
              onChangeText={setTempTitle}
              onBlur={handleTitleSubmit}
              onSubmitEditing={handleTitleSubmit}
              autoFocus
              selectTextOnFocus
              maxLength={30}
            />
          ) : (
            <Pressable onPress={() => setIsEditing(true)}>
              <ThemedText style={styles.title} numberOfLines={1}>
                {state.title}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 30, left: 0, right: 0, zIndex: 100 },
  toolbar: {
    marginHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(36, 36, 38, 0.95)',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  titleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  title: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  titleInput: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFFFFF', 
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  button: { padding: 4 },
  iconButton: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  rightGroup: { flexDirection: 'row', gap: 10, marginRight: 4 },
  disabled: { opacity: 0.2 },
});
