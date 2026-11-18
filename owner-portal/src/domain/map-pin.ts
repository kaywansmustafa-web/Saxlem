/** A latitude/longitude pair. */
export type MapPin = Readonly<{ latitude: number; longitude: number }>;

const valid = (latitude: number, longitude: number): MapPin | null =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180 &&
  !(latitude === 0 && longitude === 0)
    ? { latitude, longitude }
    : null;

/**
 * Reads a map position from what an owner pastes: plain coordinates
 * ("36.8669, 42.9886") or a Google Maps link ("…/@36.86,42.98,17z",
 * "…?q=36.86,42.98", "…!3d36.86!4d42.98"). Short links (maps.app.goo.gl)
 * hide the position, so they return null.
 */
export function parseMapPin(text: string): MapPin | null {
  const value = decodeURIComponent(text.trim());
  if (!value) return null;
  const number = String.raw`(-?\d{1,3}(?:\.\d+)?)`;
  const patterns = [
    new RegExp(String.raw`!3d${number}!4d${number}`),
    new RegExp(String.raw`@${number},\s*${number}`),
    new RegExp(String.raw`[?&](?:q|query|ll|destination)=${number},\s*${number}`),
    new RegExp(String.raw`^${number}\s*[,\s]\s*${number}$`),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(value);
    if (match) return valid(Number(match[1]), Number(match[2]));
  }
  return null;
}
