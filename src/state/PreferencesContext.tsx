import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AsyncStorageService } from '@/src/storage/AsyncStorageService';
import { DEFAULT_PREFERENCES } from '@/src/storage/schema';
import { UserPreferences } from './types';

interface PreferencesContextValue {
  preferences: UserPreferences | null;
  updatePreferences: (update: Partial<UserPreferences>) => Promise<void>;
  setPreferences: (preferences: UserPreferences) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(null);

  useEffect(() => {
    AsyncStorageService.getPreferences()
      .then(setPreferencesState)
      .catch((error) => {
        console.error('Failed to load user preferences:', error);
        setPreferencesState(DEFAULT_PREFERENCES);
      });
  }, []);

  const setPreferences = useCallback(async (next: UserPreferences) => {
    setPreferencesState(next);
    await AsyncStorageService.savePreferences(next);
  }, []);

  const updatePreferences = useCallback(async (update: Partial<UserPreferences>) => {
    setPreferencesState((previous) => {
      const next = { ...DEFAULT_PREFERENCES, ...(previous ?? DEFAULT_PREFERENCES), ...update };
      return next;
    });
    await AsyncStorageService.savePreferences(update);
  }, []);

  const value = useMemo(
    () => ({ preferences, updatePreferences, setPreferences }),
    [preferences, updatePreferences, setPreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}

export function usePreferencesOptional() {
  return useContext(PreferencesContext);
}
