import { PoolStatus, RideStatus } from '../enums.js';
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import {
  assertPoolTransition,
  assertRideTransition,
  rideStatusForPool
} from "../domain/lifecycle.js";

export async function transitionPool(
  driverId: string,
  poolId: string,
  toStatus: PoolStatus
) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.ridePool.findFirst({
      where: { id: poolId, vehicle: { driverId } },
      include: { rides: { where: { status: { not: RideStatus.CANCELLED } } } }
    });
    if (!pool) throw new AppError(404, "Pool not found", "POOL_NOT_FOUND");

    assertPoolTransition(pool.status, toStatus);
    const rideTo = rideStatusForPool(toStatus);

    for (const ride of pool.rides) {
      assertRideTransition(ride.status, rideTo);
    }

    const changed = await tx.ridePool.updateMany({
      where: { id: pool.id, status: pool.status },
      data: { status: toStatus }
    });
    if (changed.count !== 1) {
      throw new AppError(409, "Pool changed before this action could be applied", "POOL_CHANGED");
    }

    await tx.rideEvent.create({
      data: {
        poolId: pool.id,
        actorId: driverId,
        fromStatus: pool.status,
        toStatus,
        note: "Driver advanced pool lifecycle"
      }
    });

    for (const ride of pool.rides) {
      await tx.rideRequest.update({
        where: { id: ride.id },
        data: { status: rideTo }
      });
      await tx.rideEvent.create({
        data: {
          rideRequestId: ride.id,
          poolId: pool.id,
          actorId: driverId,
          fromStatus: ride.status,
          toStatus: rideTo,
          note: "Updated with pool lifecycle"
        }
      });
    }

    return tx.ridePool.findUniqueOrThrow({
      where: { id: pool.id },
      include: {
        vehicle: true,
        rides: { include: { passenger: { select: { id: true, name: true } } } }
      }
    });
  });
}

export const actionToStatus = {
  accept: PoolStatus.ACCEPTED,
  arrived: PoolStatus.DRIVER_ARRIVED,
  start: PoolStatus.STARTED,
  complete: PoolStatus.COMPLETED
} as const;
