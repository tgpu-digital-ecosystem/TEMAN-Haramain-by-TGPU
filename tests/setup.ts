if (typeof window !== 'undefined' && !window.localStorage) {
  const values = new Map<string, string>();
  const localStorage = {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, String(value)),
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: localStorage });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: localStorage });
}
