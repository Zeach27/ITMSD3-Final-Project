import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { ArtworkRecord, STORAGE_KEYS, DEFAULT_PREFERENCES } from './schema';
import { UserPreferences } from '@/src/state/types';

// In-memory fallback storage
let inMemoryStorage: Record<string, string> = {};
let useNativeStorage = true;
let useWebStorage = false;
let useFileSystem = false;
let fileSystemDir = '';

const STORAGE_FOLDER = 'drawing_app_storage';

const initStorageBackend = () => {
  if (Platform.OS === 'web') {
    useNativeStorage = false;
    try {
      if (typeof localStorage !== 'undefined') {
        useWebStorage = true;
        console.log('✓ Using localStorage for web platform');
      }
    } catch (error) {
      console.log('localStorage not available on web');
    }
    return;
  }

  if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function' || typeof AsyncStorage.setItem !== 'function') {
    useNativeStorage = false;
  }

  if (FileSystem?.documentDirectory) {
    useFileSystem = true;
    fileSystemDir = `${FileSystem.documentDirectory}${STORAGE_FOLDER}`;
    console.log('✓ Using file system fallback at', fileSystemDir);
  }
};

const getFileUri = (key: string) => `${fileSystemDir}/${encodeURIComponent(key)}.json`;

const ensureStorageDirectory = async () => {
  if (!useFileSystem || !fileSystemDir) return;
  const info = await FileSystem.getInfoAsync(fileSystemDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(fileSystemDir, { intermediates: true });
  }
};

const fileGetItem = async (key: string): Promise<string | null> => {
  await ensureStorageDirectory();
  const uri = getFileUri(key);
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return null;
  return await FileSystem.readAsStringAsync(uri);
};

const fileSetItem = async (key: string, value: string): Promise<void> => {
  await ensureStorageDirectory();
  const uri = getFileUri(key);
  await FileSystem.writeAsStringAsync(uri, value);
};

const fileRemoveItem = async (key: string): Promise<void> => {
  const uri = getFileUri(key);
  await FileSystem.deleteAsync(uri, { idempotent: true });
};

initStorageBackend();

class StorageBackend {
  async getItem(key: string): Promise<string | null> {
    try {
      if (useNativeStorage) {
        return await AsyncStorage.getItem(key);
      } else if (useWebStorage) {
        return localStorage.getItem(key);
      } else if (useFileSystem) {
        return await fileGetItem(key);
      } else {
        return inMemoryStorage[key] || null;
      }
    } catch (error) {
      if (useNativeStorage) {
        console.warn('Native storage failed, falling back to alternate storage', error);
        useNativeStorage = false;
        if (useWebStorage || useFileSystem) {
          return this.getItem(key);
        }
        return inMemoryStorage[key] || null;
      }
      if (useWebStorage) {
        console.warn('Web storage failed, falling back to in-memory storage', error);
        useWebStorage = false;
        return inMemoryStorage[key] || null;
      }
      if (useFileSystem) {
        console.warn('File system storage failed, falling back to in-memory storage', error);
        useFileSystem = false;
        return inMemoryStorage[key] || null;
      }
      throw error;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (useNativeStorage) {
        await AsyncStorage.setItem(key, value);
      } else if (useWebStorage) {
        localStorage.setItem(key, value);
      } else if (useFileSystem) {
        await fileSetItem(key, value);
      } else {
        inMemoryStorage[key] = value;
      }
    } catch (error) {
      if (useNativeStorage) {
        console.warn('Native storage failed, falling back to alternate storage', error);
        useNativeStorage = false;
        if (useWebStorage || useFileSystem) {
          return this.setItem(key, value);
        }
        inMemoryStorage[key] = value;
        return;
      }
      if (useWebStorage) {
        console.warn('Web storage failed, falling back to in-memory storage', error);
        useWebStorage = false;
        inMemoryStorage[key] = value;
        return;
      }
      if (useFileSystem) {
        console.warn('File system storage failed, falling back to in-memory storage', error);
        useFileSystem = false;
        inMemoryStorage[key] = value;
        return;
      }
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (useNativeStorage) {
        await AsyncStorage.removeItem(key);
      } else if (useWebStorage) {
        localStorage.removeItem(key);
      } else if (useFileSystem) {
        await fileRemoveItem(key);
      } else {
        delete inMemoryStorage[key];
      }
    } catch (error) {
      if (useNativeStorage) {
        console.warn('Native storage failed, falling back to alternate storage', error);
        useNativeStorage = false;
        if (useWebStorage || useFileSystem) {
          return this.removeItem(key);
        }
        delete inMemoryStorage[key];
        return;
      }
      if (useWebStorage) {
        console.warn('Web storage failed, falling back to in-memory storage', error);
        useWebStorage = false;
        delete inMemoryStorage[key];
        return;
      }
      if (useFileSystem) {
        console.warn('File system storage failed, falling back to in-memory storage', error);
        useFileSystem = false;
        delete inMemoryStorage[key];
        return;
      }
      throw error;
    }
  }
}

const storage = new StorageBackend();

export const AsyncStorageService = {
  async saveArtwork(record: ArtworkRecord): Promise<void> {
    console.log('Saving artwork record:', record.id, record.title);
    try {
      await storage.setItem(`${STORAGE_KEYS.ARTWORK_PREFIX}${record.id}`, JSON.stringify(record));
      const list = await this.getArtworkList();
      console.log('Current artwork list before update:', list);
      if (!list.includes(record.id)) {
        list.unshift(record.id);
        await storage.setItem(STORAGE_KEYS.ARTWORKS_LIST, JSON.stringify(list));
        console.log('Artwork ID added to list:', record.id);
      } else {
        console.log('Artwork ID already in list:', record.id);
      }
      console.log('✓ Artwork save completed. New list:', list);
    } catch (error) {
      console.error('❌ Failed to save artwork:', error);
      throw error;
    }
  },

  async getArtwork(id: string): Promise<ArtworkRecord | null> {
    try {
      const data = await storage.getItem(`${STORAGE_KEYS.ARTWORK_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve artwork:', error);
      return null;
    }
  },

  async getArtworkList(): Promise<string[]> {
    try {
      const data = await storage.getItem(STORAGE_KEYS.ARTWORKS_LIST);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve artwork list:', error);
      return [];
    }
  },

  async getAllArtworks(): Promise<ArtworkRecord[]> {
    try {
      const ids = await this.getArtworkList();
      console.log('Loading artworks with IDs:', ids);
      const records = await Promise.all(ids.map((id) => this.getArtwork(id)));
      const filtered = records.filter((r): r is ArtworkRecord => r !== null);
      console.log('✓ Successfully loaded', filtered.length, 'artworks');
      return filtered;
    } catch (error) {
      console.error('Failed to load all artworks:', error);
      return [];
    }
  },

  async deleteArtwork(id: string): Promise<void> {
    try {
      await storage.removeItem(`${STORAGE_KEYS.ARTWORK_PREFIX}${id}`);
      const list = await this.getArtworkList();
      const filtered = list.filter((item) => item !== id);
      await storage.setItem(STORAGE_KEYS.ARTWORKS_LIST, JSON.stringify(filtered));
      console.log('✓ Artwork deleted:', id);
    } catch (error) {
      console.error('Failed to delete artwork:', error);
      throw error;
    }
  },

  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await storage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Failed to retrieve preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  async savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      await storage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify({ ...current, ...prefs }));
      console.log('✓ Preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  },
};
