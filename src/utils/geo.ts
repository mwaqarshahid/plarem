const EARTH_RADIUS_M = 6371000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Haversine distance between two coordinates, in meters. */
export const distanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
};

export const formatRadius = (meters: number): string =>
  meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
