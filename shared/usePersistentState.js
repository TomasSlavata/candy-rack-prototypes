import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'candy-rack-prototypes:';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function read(storageKey, initialValue) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return initialValue;
    const parsed = JSON.parse(stored);
    // Fill in settings added to the defaults after the value was saved.
    return isPlainObject(initialValue) && isPlainObject(parsed) ? { ...initialValue, ...parsed } : parsed;
  } catch {
    return initialValue;
  }
}

// Like useState, but the value survives page reloads (stored in the browser's localStorage).
// Each viewer has their own copy – nothing is shared between people.
// Other open tabs of the same browser update live, so an admin part and a storefront part stay in sync.
export function usePersistentState(key, initialValue) {
  const storageKey = PREFIX + key;
  const [value, setValue] = useState(() => read(storageKey, initialValue));

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === storageKey) setValue(read(storageKey, initialValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey, initialValue]);

  const save = useCallback(
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private window) – keep the in-memory value.
      }
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    setValue(initialValue);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey, initialValue]);

  return [value, save, reset];
}

// The feature folder this page belongs to, read from the URL: /reward-bar/admin-slide-cart/ → "reward-bar".
function currentFeature() {
  const segments = window.location.pathname.split('/').filter((s) => s && s !== 'index.html');
  return segments.at(-2) ?? 'unknown';
}

// Settings shared by all parts of one feature (admin saves them, storefront reads them).
// Keep `defaults` in the feature's settings.js and import it from every part.
export function useFeatureSettings(defaults) {
  return usePersistentState(`${currentFeature()}:settings`, defaults);
}
