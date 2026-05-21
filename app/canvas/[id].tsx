import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DrawingCanvas } from '@/src/components/canvas/DrawingCanvas';
import { AsyncStorageService } from '@/src/storage/AsyncStorageService';
import { ArtworkRecord } from '@/src/storage/schema';

export default function ArtworkCanvasScreen() {
  const params = useLocalSearchParams();
  const canvasId = typeof params.id === 'string' ? params.id : 'new';
  const [loading, setLoading] = useState(canvasId !== 'new');
  const [artwork, setArtwork] = useState<ArtworkRecord | undefined>(undefined);

  useEffect(() => {
    if (canvasId !== 'new') {
      AsyncStorageService.getArtwork(canvasId).then((record) => {
        if (record) setArtwork(record);
        setLoading(false);
      });
    }
  }, [canvasId]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5856D6" />
        <ThemedText style={{ marginTop: 10 }}>Loading artwork...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <DrawingCanvas />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
