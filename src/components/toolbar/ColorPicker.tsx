import React, { useCallback, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useCanvas } from '@/src/state/CanvasContext';
import { hexToHsb, hsbToHex } from '@/src/utils/colorUtils';

const WHEEL_SIZE = 220;
const RING_WIDTH = 40;

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
  '#1C1C1E', '#8E8E93', '#CF3721', '#B36A00', '#B58900',
  '#248A3D', '#0055B3', '#3E3C9E', '#7B3AA3', '#B3203B',
];

export function ColorPicker() {
  const { state, setColor } = useCanvas();
  const hsb = hexToHsb(state.currentColor);
  const hueRef = useRef(hsb.h);

  const updateColor = useCallback((h: number) => {
    hueRef.current = h;
    setColor(hsbToHex(h, 1, 1)); // Default to full brightness/saturation for simple picker
  }, [setColor]);

  const huePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateHueFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
      onPanResponderMove: (evt) => {
        updateHueFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
    }),
  ).current;

  const updateHueFromTouch = (lx: number, ly: number) => {
    const cx = WHEEL_SIZE / 2;
    const cy = WHEEL_SIZE / 2;
    const dx = lx - cx;
    const dy = ly - cy;
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const h = angle / (Math.PI * 2);
    updateColor(h);
  };

  const hueAngle = hueRef.current * Math.PI * 2 - Math.PI / 2;
  const cx = WHEEL_SIZE / 2;
  const cy = WHEEL_SIZE / 2;
  const knobR = (WHEEL_SIZE - RING_WIDTH) / 2;
  const hueX = cx + knobR * Math.cos(hueAngle);
  const hueY = cy + knobR * Math.sin(hueAngle);

  return (
    <View style={styles.container}>
      <View style={styles.wheelContainer} {...huePan.panHandlers}>
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
          <Defs>
            <LinearGradient id="hueGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FF0000" />
              <Stop offset="0.17" stopColor="#FFFF00" />
              <Stop offset="0.33" stopColor="#00FF00" />
              <Stop offset="0.5" stopColor="#00FFFF" />
              <Stop offset="0.67" stopColor="#0000FF" />
              <Stop offset="0.83" stopColor="#FF00FF" />
              <Stop offset="1" stopColor="#FF0000" />
            </LinearGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={knobR} fill="none" stroke="url(#hueGradient)" strokeWidth={RING_WIDTH} />
          <Circle cx={hueX} cy={hueY} r={12} fill="#FFFFFF" stroke="#000" strokeWidth={2} />
        </Svg>
      </View>
      <View style={styles.presets}>
        {PRESET_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => setColor(color)}
            style={[
              styles.presetSwatch,
              { backgroundColor: color },
              state.currentColor.toUpperCase() === color.toUpperCase() && styles.presetActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 24, paddingVertical: 12 },
  wheelContainer: { width: WHEEL_SIZE, height: WHEEL_SIZE },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingHorizontal: 16 },
  presetSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  presetActive: { borderColor: '#FFFFFF', borderWidth: 3 },
});