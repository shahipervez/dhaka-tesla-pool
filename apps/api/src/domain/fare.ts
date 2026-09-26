import { Area } from '../enums.js';
import { distanceMeters } from "./geography.js";

export const BASE_FARE_POYSHA = 5_000; // ৳50
export const PER_KM_POYSHA = 1_500; // ৳15/km
export const POOL_DISCOUNT_BPS = 1_500; // 15%

export type FareQuote = {
  distanceM: number;
  soloFarePoysha: number;
  pooledFarePoysha: number;
};

export function quoteFare(pickup: Area, destination: Area): FareQuote {
  const distanceM = distanceMeters(pickup, destination);
  const distanceCharge = Math.round((distanceM * PER_KM_POYSHA) / 1000);
  const soloFarePoysha = BASE_FARE_POYSHA + distanceCharge;
  const pooledFarePoysha =
    soloFarePoysha - Math.round((soloFarePoysha * POOL_DISCOUNT_BPS) / 10_000);

  return { distanceM, soloFarePoysha, pooledFarePoysha };
}

export function formatBdt(poysha: number): string {
  return `৳${(poysha / 100).toFixed(2)}`;
}
