import { PoolStatus, RideStatus } from '../enums.js';
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { assertRideTransition } from "../domain/lifecycle.js";

export async function cancelRide(passengerId: string, rideId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const ride = await tx.rideRequest.findFirst({
      where: { id: rideId, passengerId }
    });

    // 404 rather than 403 avoids leaking another passenger's ride existence.
    if (!ride) throw new AppError(404, "Ride not found", "RIDE_NOT_FOUND");

    assertRideTransition(ride.status, RideStatus.CANCELLED);

    const cancellationReason = reason?.slice(0, 200) || "Cancelled by passenger";
    const changed = await tx.rideRequest.updateMany({
      where: { id: ride.id, passengerId, status: ride.status },
      data: {
        status: RideStatus.CANCELLED,
        cancellationReason
      }
    });
    if (changed.count !== 1) {
      throw new AppError(409, "Ride changed before cancellation could be applied", "RIDE_CHANGED");
    }

    const cancelled = await tx.rideRequest.findUniqueOrThrow({ where: { id: ride.id } });

    await tx.rideEvent.create({
      data: {
        rideRequestId: ride.id,
        poolId: ride.poolId,
        actorId: passengerId,
        fromStatus: ride.status,
        toStatus: RideStatus.CANCELLED,
        note: cancelled.cancellationReason
      }
    });

    if (ride.poolId) {
      await tx.ridePool.update({
        where: { id: ride.poolId },
        data: { occupiedSeats: { decrement: ride.seats } }
      });

      const remaining = await tx.rideRequest.count({
        where: { poolId: ride.poolId, status: { not: RideStatus.CANCELLED } }
      });

      if (remaining === 0) {
        const pool = await tx.ridePool.findUniqueOrThrow({ where: { id: ride.poolId } });
        if (![PoolStatus.COMPLETED, PoolStatus.CANCELLED].includes(pool.status)) {
          await tx.ridePool.update({
            where: { id: ride.poolId },
            data: { status: PoolStatus.CANCELLED }
          });
          await tx.rideEvent.create({
            data: {
              poolId: ride.poolId,
              actorId: passengerId,
              fromStatus: pool.status,
              toStatus: PoolStatus.CANCELLED,
              note: "Last passenger cancelled"
            }
          });
        }
      }
    }

    return cancelled;
  });
}
