/**
 * Delivery fee calculation based on distance between store and customer.
 * Uses the Haversine formula (no external API needed).
 */

// ── Pricing tiers ────────────────────────────────────────────────────────────

export const DELIVERY_TIERS = [
  { maxKm: 5, fee: 1000, label: "0–5 km" },
  { maxKm: 15, fee: 2500, label: "5–15 km" },
  { maxKm: 30, fee: 5000, label: "15–30 km" },
  { maxKm: 50, fee: 7500, label: "30–50 km" },
  { maxKm: Infinity, fee: 10000, label: "50+ km" },
] as const;

// ── Haversine distance ───────────────────────────────────────────────────────

/**
 * Calculate the straight-line distance in km between two GPS coordinates.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Fee calculation ──────────────────────────────────────────────────────────

/**
 * Get the delivery fee for a given distance in km.
 */
export function getDeliveryFeeForDistance(distanceKm: number): number {
  for (const tier of DELIVERY_TIERS) {
    if (distanceKm <= tier.maxKm) return tier.fee;
  }
  return DELIVERY_TIERS[DELIVERY_TIERS.length - 1].fee;
}

/**
 * Calculate delivery fee between a store and customer location.
 * Store coordinates are [longitude, latitude] (GeoJSON format).
 * Customer coordinates are { lat, lng }.
 */
export function calculateDeliveryFee(
  storeCoords: [number, number], // [lng, lat] — GeoJSON
  customerLat: number,
  customerLng: number
): { distanceKm: number; fee: number; tierLabel: string } {
  const [storeLng, storeLat] = storeCoords;
  const distanceKm = haversineDistanceKm(
    storeLat,
    storeLng,
    customerLat,
    customerLng
  );

  const fee = getDeliveryFeeForDistance(distanceKm);
  const tier = DELIVERY_TIERS.find((t) => distanceKm <= t.maxKm)!;

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    fee,
    tierLabel: tier.label,
  };
}

/**
 * For multi-store orders: calculate fee for each store, return the highest.
 */
export function calculateMaxDeliveryFee(
  stores: Array<{ coordinates: [number, number] }>,
  customerLat: number,
  customerLng: number
): { distanceKm: number; fee: number; tierLabel: string } {
  if (stores.length === 0) {
    return { distanceKm: 0, fee: 0, tierLabel: "N/A" };
  }

  let maxResult = calculateDeliveryFee(
    stores[0].coordinates,
    customerLat,
    customerLng
  );

  for (let i = 1; i < stores.length; i++) {
    const result = calculateDeliveryFee(
      stores[i].coordinates,
      customerLat,
      customerLng
    );
    if (result.fee > maxResult.fee) {
      maxResult = result;
    }
  }

  return maxResult;
}
