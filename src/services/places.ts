import { GOOGLE_MAPS_API_KEY } from '@constants';

export interface PlaceSuggestion {
  id: string;
  primaryText: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
}

interface TextSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
}

/**
 * Searches places and addresses using the Places Text Search API.
 * A single endpoint covers both "search by address" and "search by place".
 */
export const searchPlaces = async (
  query: string,
  near?: { latitude: number; longitude: number },
): Promise<PlaceSuggestion[]> => {
  const params = new URLSearchParams({
    query,
    key: GOOGLE_MAPS_API_KEY,
  });
  if (near) {
    params.set('location', `${near.latitude},${near.longitude}`);
    params.set('radius', '50000');
  }
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Places search failed (${response.status})`);
  }
  const json = (await response.json()) as { status: string; results?: TextSearchResult[] };
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places search failed (${json.status})`);
  }
  return (json.results ?? []).slice(0, 10).map(result => ({
    id: result.place_id,
    primaryText: result.name,
    secondaryText: result.formatted_address,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
  }));
};

interface GeocodeResult {
  formatted_address: string;
}

const GEOCODE_TIMEOUT_MS = 8000;

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/** Reverse-geocodes coordinates to a human-readable address. */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: GOOGLE_MAPS_API_KEY,
    });
    const response = await fetchWithTimeout(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      GEOCODE_TIMEOUT_MS,
    );
    const json = (await response.json()) as { status: string; results?: GeocodeResult[] };
    if (json.status === 'OK' && json.results && json.results.length > 0) {
      return json.results[0].formatted_address;
    }
  } catch {
    // Fall through to the coordinate fallback below.
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};
