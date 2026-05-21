import React, { useCallback, useRef } from 'react';
import { PanResponder, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface SliderKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  vertical?: boolean;
}

export function SliderKnob({ value, min, max, onChange, label, vertical }: SliderKnobProps) {
  const trackRef = useRef<View>(null);
  const trackLayout = useRef({ x: 0, y: 0, width: 1, height: 1 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    trackLayout.current = { ...trackLayout.current, width, height };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateFromTouch(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateFromTouch(locationX, locationY);
      },
    }),
  ).current;

  const updateFromTouch = (locationX: number, locationY: number) => {
    const { width, height } = trackLayout.current;
    if (vertical) {
      const ratio = Math.max(0, Math.min(1, 1 - locationY / height));
      const newValue = min + ratio * (max - min);
      onChange(Math.round(newValue));
    } else {
      const ratio = Math.max(0, Math.min(1, locationX / width));
      const newValue = min + ratio * (max - min);
      onChange(Math.round(newValue));
    }
  };

  const ratio = (value - min) / (max - min);

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <View
        ref={trackRef}
        onLayout={onLayout}
        style={[styles.track, vertical ? styles.trackVertical : styles.trackHorizontal]}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.fill,
            vertical
              ? { height: `${ratio * 100}%`, alignSelf: 'flex-end' }
              : { width: `${ratio * 100}%` },
          ]}
        />
        <View
          style={[
            styles.knob,
            vertical
              ? { bottom: `${ratio * 100}%` }
              : { left: `${ratio * 100}%` },
          ]}
        />
      </View>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  label: { fontSize: 9, color: '#8E8E93', fontWeight: 'bold' },
  track: { backgroundColor: '#3A3A3C', borderRadius: 4, position: 'relative', overflow: 'visible' },
  trackHorizontal: { width: '100%', height: 6 },
  trackVertical: { width: 6, height: 80 },
  fill: { backgroundColor: '#2F70F2', borderRadius: 4, position: 'absolute', bottom: 0 },
  knob: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FFFFFF', marginLeft: -7, marginTop: -7, top: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    elevation: 4,
  },
  value: { fontSize: 10, color: '#FFFFFF' },
});
