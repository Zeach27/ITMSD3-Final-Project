import 'react-native-reanimated';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CanvasProvider } from '@/src/state/CanvasContext';
import { PreferencesProvider } from '@/src/state/PreferencesContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <CanvasProvider>
          <ThemeProvider value={DarkTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Layers' }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </CanvasProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}
