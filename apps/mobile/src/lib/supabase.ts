import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Configurez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

const CHUNK_SIZE = 1800;
const CHUNK_PREFIX = '__chunks:';
const memoryFallback = new Map<string, string>();

async function canUseSecureStore(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function clearChunks(key: string, headerValue: string | null): Promise<void> {
  if (!headerValue?.startsWith(CHUNK_PREFIX)) return;
  const count = Number.parseInt(headerValue.slice(CHUNK_PREFIX.length), 10);
  if (!Number.isFinite(count) || count <= 0) return;
  for (let i = 0; i < count; i += 1) {
    try {
      await SecureStore.deleteItemAsync(`${key}.__chunk_${i}`);
    } catch {
      // Ignore cleanup errors on already-removed chunks.
    }
  }
}

const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (await canUseSecureStore()) {
        const raw = await SecureStore.getItemAsync(key);
        if (!raw) return null;
        if (!raw.startsWith(CHUNK_PREFIX)) return raw;
        const count = Number.parseInt(raw.slice(CHUNK_PREFIX.length), 10);
        if (!Number.isFinite(count) || count <= 0) return null;
        const parts: string[] = [];
        for (let i = 0; i < count; i += 1) {
          const part = await SecureStore.getItemAsync(`${key}.__chunk_${i}`);
          if (part === null) return null;
          parts.push(part);
        }
        return parts.join('');
      }
    } catch {
      return null;
    }
    return memoryFallback.get(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (await canUseSecureStore()) {
        const previous = await SecureStore.getItemAsync(key);
        await clearChunks(key, previous);
        if (value.length <= CHUNK_SIZE) {
          await SecureStore.setItemAsync(key, value);
          memoryFallback.delete(key);
          return;
        }
        const chunks: string[] = [];
        for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
          chunks.push(value.slice(offset, offset + CHUNK_SIZE));
        }
        for (let i = 0; i < chunks.length; i += 1) {
          await SecureStore.setItemAsync(`${key}.__chunk_${i}`, chunks[i]);
        }
        await SecureStore.setItemAsync(key, `${CHUNK_PREFIX}${chunks.length}`);
        memoryFallback.delete(key);
        return;
      }
    } catch {
      // Fall back to in-memory storage if native keystore write fails.
    }
    memoryFallback.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (await canUseSecureStore()) {
        const previous = await SecureStore.getItemAsync(key);
        await clearChunks(key, previous);
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // Ignore native keystore removal errors and ensure in-memory fallback is cleared.
    } finally {
      memoryFallback.delete(key);
    }
  },
};

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
