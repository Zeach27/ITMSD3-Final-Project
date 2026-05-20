import { Layer, UserPreferences } from '@/src/state/types';

export interface ArtworkRecord {
  id: string;
  title: string;
  thumbnail: string;
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultBrushSize: 10,
  defaultColor: '#5856D6',
  theme: 'dark',
  pressureSensitivity: 0.5,
  autoSaveInterval: 30,
};

export const STORAGE_KEYS = {
  ARTWORKS_LIST: 'artworks:list',
  ARTWORK_PREFIX: 'artworks:',
  PREFERENCES: 'settings:preferences',
} as const;
