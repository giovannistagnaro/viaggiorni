import '@testing-library/jest-dom/vitest'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {
      // Mock implementation
    }
    unobserve(): void {
      // Mock implementation
    }
    disconnect(): void {
      // Mock implementation
    }
  } as unknown as typeof ResizeObserver
}
