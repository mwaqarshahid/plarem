import type { Coordinates } from './location';
import { getCurrentPosition, getCurrentPositionFast } from './location';
import { checkForegroundLocation } from './permissions';

let cached: Coordinates | undefined;
let warmPromise: Promise<Coordinates | undefined> | undefined;

export const getCachedLocation = (): Coordinates | undefined => cached;

export const setCachedLocation = (coords: Coordinates): void => {
  cached = coords;
};

/**
 * Resolve a position quickly for map centering / nearby hints.
 * Fast/network fixes are returned but NOT written to the shared cache — only
 * a fresh high-accuracy fix may update it, so "current location" never
 * inherits a stale preload from splash or a previous city.
 */
export const warmUpLocation = async (): Promise<Coordinates | undefined> => {
  if (warmPromise) {
    return warmPromise;
  }

  warmPromise = (async () => {
    try {
      if ((await checkForegroundLocation()) !== 'granted') {
        return cached;
      }

      try {
        return await getCurrentPositionFast();
      } catch {
        try {
          const position = await getCurrentPosition(true);
          cached = position;
          return position;
        } catch {
          return cached;
        }
      }
    } finally {
      warmPromise = undefined;
    }
  })();

  return warmPromise;
};
