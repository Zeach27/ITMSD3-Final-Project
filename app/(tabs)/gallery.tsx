import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View, Dimensions, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncStorageService } from '@/src/storage/AsyncStorageService';
import { ArtworkRecord } from '@/src/storage/schema';
import { useCanvas } from '@/src/state/CanvasContext';

const { width } = Dimensions.get('window');
const COLUMNS = 3;
const ITEM_SIZE = (width - 48) / COLUMNS;

export default function GalleryScreen() {
  const router = useRouter();
  const { loadArtwork } = useCanvas();
  const [artworks, setArtworks] = useState<ArtworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageWarning, setStorageWarning] = useState(false);

  const loadArtworks = async () => {
    try {
      setLoading(true);
      const records = await AsyncStorageService.getAllArtworks();
      console.log('Artworks fetched in gallery:', records.length, 'items');
      records.forEach((record, index) => {
        console.log(`  [${index}] ${record.id}: "${record.title}" (${record.layers.length} layers, ${record.layers.reduce((sum, l) => sum + l.strokes.length, 0)} strokes)`);
      });
      setArtworks(records);
      // Check if we're using fallback storage
      if (records.length > 0) {
        setStorageWarning(true); // Will be set only if AsyncStorage failed
      }
    } catch (error) {
      console.error('Failed to load artworks:', error);
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Small timeout to wait for pending auto-saves to finish
      const timeout = setTimeout(loadArtworks, 500);
      return () => clearTimeout(timeout);
    }, [])
  );

  const deleteArtwork = async (id: string) => {
    await AsyncStorageService.deleteArtwork(id);
    loadArtworks();
  };

  const handleOpenArtwork = (item: ArtworkRecord) => {
    loadArtwork(item);
    router.push('/(tabs)');
  };

  const buildStrokePath = (stroke: ArtworkRecord['layers'][number]['strokes'][number]) => {
    if (stroke.smoothedPath && stroke.smoothedPath.length > 0) return stroke.smoothedPath;
    if (!stroke.points || stroke.points.length < 2) return '';
    return stroke.points.reduce(
      (path, point, index) =>
        index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`,
      '',
    );
  };

  const computeArtworkBounds = (item: ArtworkRecord) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    item.layers.forEach((layer) => {
      layer.strokes.forEach((stroke) => {
        stroke.points.forEach((point) => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });
    });

    const padding = 28;
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      return {
        x: 0,
        y: 0,
        width: Math.max(ITEM_SIZE, item.canvasWidth || 2048),
        height: Math.max(ITEM_SIZE, item.canvasHeight || 2048),
      };
    }

    const width = Math.max(1, maxX - minX + padding * 2);
    const height = Math.max(1, maxY - minY + padding * 2);

    return {
      x: minX - padding,
      y: minY - padding,
      width,
      height,
    };
  };

  const renderStrokePreview = (stroke: ArtworkRecord['layers'][number]['strokes'][number], viewBoxWidth: number) => {
    if (!stroke.points || stroke.points.length === 0) return null;

    const strokeWidth = Math.max(2, (stroke.brushSize || 1) * (ITEM_SIZE / viewBoxWidth) * 3);
    const strokeOpacity = stroke.opacity === undefined ? 1 : Math.max(0.75, stroke.opacity);

    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      return (
        <Circle
          key={stroke.id}
          cx={point.x}
          cy={point.y}
          r={strokeWidth}
          fill={stroke.color || '#000'}
          fillOpacity={strokeOpacity}
        />
      );
    }

    const d = buildStrokePath(stroke);
    if (!d) return null;

    return (
      <Path
        key={stroke.id}
        d={d}
        stroke={stroke.color || '#000000'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeOpacity={strokeOpacity}
      />
    );
  };

  const renderArtworkPreview = (item: ArtworkRecord) => {
    if (item.thumbnail) {
      return <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
    }

    const bounds = computeArtworkBounds(item);

    return (
      <Svg
        width={ITEM_SIZE - 8}
        height={ITEM_SIZE - 8}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="#FFFFFF" />
        <Rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="none" stroke="#E5E5EA" strokeWidth={2} />

        {item.layers.map((layer) =>
          layer.strokes.map((stroke) => renderStrokePreview(stroke, bounds.width)),
        )}
      </Svg>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Gallery</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <ThemedText style={styles.closeText}>Close</ThemedText>
        </Pressable>
      </View>
      {loading ? (
        <ThemedText style={styles.emptyText}>Loading...</ThemedText>
      ) : artworks.length === 0 ? (
        <ThemedText style={styles.emptyText}>No saved artworks yet.</ThemedText>
      ) : (
        <FlatList
          data={artworks}
          numColumns={COLUMNS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.artworkItem}>
              <Pressable
                onPress={() => handleOpenArtwork(item)}
                style={styles.thumbnail}
              >
                {renderArtworkPreview(item)}
              </Pressable>
              <ThemedText style={styles.artworkTitle} numberOfLines={1}>{item.title}</ThemedText>
              <Pressable onPress={() => deleteArtwork(item.id)} style={styles.deleteButton}>
                <ThemedText style={styles.deleteText}>Delete</ThemedText>
              </Pressable>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E', paddingTop: 50 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  closeButton: { padding: 8 },
  closeText: { color: '#5856D6', fontSize: 16 },
  emptyText: { color: '#8E8E93', textAlign: 'center', marginTop: 60, fontSize: 16 },
  grid: { padding: 12, gap: 12 },
  artworkItem: { width: ITEM_SIZE, marginBottom: 16, alignItems: 'center', gap: 4 },
  thumbnail: {
    width: ITEM_SIZE - 8, height: ITEM_SIZE - 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  thumbnailPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  thumbnailText: { fontSize: 32, color: '#8E8E93', fontWeight: 'bold' },
  artworkTitle: { color: '#FFFFFF', fontSize: 12, textAlign: 'center' },
  deleteButton: { padding: 4 },
  deleteText: { color: '#FF453A', fontSize: 11 },
});
