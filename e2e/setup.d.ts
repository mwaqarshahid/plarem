/// <reference types="detox/globals" />

declare global {
  function describe(name: string, fn: () => void): void;
  namespace describe {
    function skip(name: string, fn: () => void): void;
  }
  function it(name: string, fn: () => void | Promise<void>): void;
  namespace it {
    function skip(name: string, fn: () => void | Promise<void>): void;
  }
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
}

export {};
