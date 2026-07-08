import type { Coordinates } from './location';
import { getCurrentPosition, getCurrentPositionFast } from './location';
import { checkForegroundLocation } from './permissions';

let cached: Coordinates | undefined;
let warmPromise: Promise<Coordinates | undefined> | undefined;

export const getCachedLocation = (): Coordinates | undefined => cached;

export const setCachedLocation = (coords: Coordinates): void => {
  cached = coords;
};

/** Resolve a position quickly, using cache when GPS is slow. */
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
        const position = await getCurrentPositionFast();
        cached = position;
        return position;
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
