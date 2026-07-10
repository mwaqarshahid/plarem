/// <reference types="detox/globals" />

declare global {
  function describe(name: string, fn: () => void): void;
  namespace describe {
    function skip(name: string, fn: () => void): void;
  }
  function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  namespace it {
    function skip(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  }
  const beforeAll: (fn: () => void | Promise<void>, timeout?: number) => void;
  const beforeEach: (fn: () => void | Promise<void>, timeout?: number) => void;
  const afterAll: (fn: () => void | Promise<void>, timeout?: number) => void;
  const afterEach: (fn: () => void | Promise<void>, timeout?: number) => void;
}

export {};
