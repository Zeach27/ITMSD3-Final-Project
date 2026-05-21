import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePreferences } from '@/src/state/PreferencesContext';
import { SliderKnob } from '@/src/components/ui/SliderKnob';

export default function SettingsScreen() {
  const { preferences, updatePreferences } = usePreferences();

  if (!preferences) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Settings</ThemedText>
        <ThemedText style={styles.bodyText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const updatePrefs = async (update: Partial<typeof preferences>) => {
    await updatePreferences(update);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Defaults</ThemedText>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Default Color</ThemedText>
          <View style={[styles.swatch, { backgroundColor: preferences.defaultColor }]} />
          <Pressable
            onPress={() => updatePrefs({ defaultColor: '#5856D6' })}
            style={styles.smallButton}
          ><ThemedText style={styles.smallButtonText}>Reset</ThemedText></Pressable>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Brush Size</ThemedText>
          <SliderKnob value={preferences.defaultBrushSize} min={2} max={100} onChange={(v) => updatePrefs({ defaultBrushSize: v })} />
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Pressure Sensitivity</ThemedText>
          <SliderKnob value={Math.round(preferences.pressureSensitivity * 100)} min={0} max={100} onChange={(v) => updatePrefs({ pressureSensitivity: v / 100 })} />
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Auto-save interval</ThemedText>
          <SliderKnob value={preferences.autoSaveInterval} min={10} max={300} onChange={(v) => updatePrefs({ autoSaveInterval: v })} label={`${preferences.autoSaveInterval}s`} />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  bodyText: { color: '#8E8E93', fontSize: 16 },
  section: {
    backgroundColor: '#242426', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  sectionTitle: { color: '#8E8E93', fontSize: 13, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#38383A',
  },
  label: { color: '#FFFFFF', fontSize: 14, flex: 1 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#3A3A3C' },
  smallButton: { padding: 6, borderRadius: 8, backgroundColor: '#3A3A3C', marginLeft: 8 },
  smallButtonText: { color: '#5856D6', fontSize: 11 },
});
