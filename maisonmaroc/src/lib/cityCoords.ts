/** Map center coordinates for Oriental region cities. */
export const cityCoords: Record<string, { lat: number; lng: number }> = {
  oujda: { lat: 34.6814, lng: -1.9086 },
  berkane: { lat: 34.9213, lng: -2.3197 },
  nador: { lat: 35.1681, lng: -2.9335 },
  taourirt: { lat: 34.4073, lng: -2.8974 },
  jerada: { lat: 34.311, lng: -2.159 },
  ahfir: { lat: 34.953, lng: -2.101 },
  saidia: { lat: 35.088, lng: -2.488 },
  figuig: { lat: 32.109, lng: -1.228 },
  guercif: { lat: 34.225, lng: -3.354 },
};

/** OpenStreetMap embed bbox query segment for a city or the whole Oriental region. */
export function mapEmbedBbox(cityId?: string): string {
  if (cityId && cityCoords[cityId]) {
    const { lat, lng } = cityCoords[cityId];
    const d = 0.09;
    return `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  }
  return `-3.6%2C31.4%2C-0.4%2C35.2`;
}
