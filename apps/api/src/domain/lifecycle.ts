import { PoolStatus, RideStatus } from '../enums.js';
import { AppError } from "../errors.js";

const rideTransitions: Record<RideStatus, RideStatus[]> = {
  REQUESTED: [RideStatus.MATCHED, RideStatus.CANCELLED],
  MATCHED: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
  ACCEPTED: [RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED],
  DRIVER_ARRIVED: [RideStatus.STARTED, RideStatus.CANCELLED],
  STARTED: [RideStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: []
};

const poolTransitions: Record<PoolStatus, PoolStatus[]> = {
  OPEN: [PoolStatus.ACCEPTED, PoolStatus.CANCELLED],
  ACCEPTED: [PoolStatus.DRIVER_ARRIVED, PoolStatus.CANCELLED],
  DRIVER_ARRIVED: [PoolStatus.STARTED, PoolStatus.CANCELLED],
  STARTED: [PoolStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: []
};

export function assertRideTransition(from: RideStatus, to: RideStatus) {
  if (!rideTransitions[from].includes(to)) {
    throw new AppError(409, `Invalid ride transition: ${from} → ${to}`, "INVALID_RIDE_TRANSITION");
  }
}

export function assertPoolTransition(from: PoolStatus, to: PoolStatus) {
  if (!poolTransitions[from].includes(to)) {
    throw new AppError(409, `Invalid pool transition: ${from} → ${to}`, "INVALID_POOL_TRANSITION");
  }
}

export function rideStatusForPool(status: PoolStatus): RideStatus {
  const map: Record<PoolStatus, RideStatus> = {
    OPEN: RideStatus.MATCHED,
    ACCEPTED: RideStatus.ACCEPTED,
    DRIVER_ARRIVED: RideStatus.DRIVER_ARRIVED,
    STARTED: RideStatus.STARTED,
    COMPLETED: RideStatus.COMPLETED,
    CANCELLED: RideStatus.CANCELLED
  };
  return map[status];
}
