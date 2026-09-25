import { useCallback, useState } from 'react';

// Like useState, but the value survives page reloads (stored in the browser's localStorage).
// Each viewer has their own copy – nothing is shared between people.
export function usePersistentState(key, initialValue) {
  const storageKey = `candy-rack-prototypes:${key}`;

  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

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
