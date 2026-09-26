import { Area } from '../enums.js';

export const AREAS = [
  Area.BANANI,
  Area.GULSHAN_1,
  Area.MOHAKHALI,
  Area.DHANMONDI,
  Area.MIRPUR,
  Area.UTTARA,
  Area.FARMGATE,
  Area.BASHUNDHARA
] as const;

const corridorByDestination: Record<Area, string> = {
  BANANI: "NORTH_CENTRAL",
  GULSHAN_1: "NORTH_CENTRAL",
  MOHAKHALI: "NORTH_CENTRAL",
  FARMGATE: "CENTRAL_WEST",
  DHANMONDI: "CENTRAL_WEST",
  MIRPUR: "NORTH_WEST",
  UTTARA: "NORTH_EAST",
  BASHUNDHARA: "NORTH_EAST"
};

const routeKm: Partial<Record<`${Area}:${Area}`, number>> = {
  "BANANI:MOHAKHALI": 3.0,
  "MOHAKHALI:BANANI": 3.0,
  "BANANI:GULSHAN_1": 2.4,
  "GULSHAN_1:BANANI": 2.4,
  "BANANI:FARMGATE": 5.8,
  "FARMGATE:BANANI": 5.8,
  "BANANI:DHANMONDI": 8.2,
  "DHANMONDI:BANANI": 8.2,
  "BANANI:BASHUNDHARA": 6.0,
  "BASHUNDHARA:BANANI": 6.0,
  "BANANI:UTTARA": 11.5,
  "UTTARA:BANANI": 11.5,
  "BANANI:MIRPUR": 10.0,
  "MIRPUR:BANANI": 10.0,
  "GULSHAN_1:MOHAKHALI": 2.7,
  "MOHAKHALI:GULSHAN_1": 2.7,
  "GULSHAN_1:BASHUNDHARA": 4.7,
  "BASHUNDHARA:GULSHAN_1": 4.7,
  "MOHAKHALI:FARMGATE": 4.0,
  "FARMGATE:MOHAKHALI": 4.0,
  "FARMGATE:DHANMONDI": 4.5,
  "DHANMONDI:FARMGATE": 4.5,
  "MIRPUR:UTTARA": 12.0,
  "UTTARA:MIRPUR": 12.0
};

export function corridorFor(destination: Area): string {
  return corridorByDestination[destination];
}

export function distanceMeters(pickup: Area, destination: Area): number {
  if (pickup === destination) {
    throw new Error("Pickup and destination must differ");
  }
  const exact = routeKm[`${pickup}:${destination}` as `${Area}:${Area}`];
  if (exact) return Math.round(exact * 1000);

  // Deterministic fallback for the small predefined-zone MVP.
  const a = AREAS.indexOf(pickup);
  const b = AREAS.indexOf(destination);
  return (4 + Math.abs(a - b) * 1.4) * 1000;
}

export function compatibleRoute(
  poolPickup: Area,
  poolCorridor: string,
  requestPickup: Area,
  requestDestination: Area
): boolean {
  return poolPickup === requestPickup && poolCorridor === corridorFor(requestDestination);
}
