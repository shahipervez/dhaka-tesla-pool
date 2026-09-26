import { Prisma, PrismaClient } from '@prisma/client';
import { Area, PaymentMethod, PoolStatus, RideStatus } from '../enums.js';
import { prisma } from "../db.js";
import { corridorFor } from "../domain/geography.js";
import { quoteFare } from "../domain/fare.js";
import { AppError } from "../errors.js";

const ACTIVE_POOL_STATUSES: PoolStatus[] = [
  PoolStatus.OPEN,
  PoolStatus.ACCEPTED,
  PoolStatus.DRIVER_ARRIVED,
  PoolStatus.STARTED
];

type Tx = Prisma.TransactionClient;

type CreateRideInput = {
  passengerId: string;
  pickupArea: Area;
  destinationArea: Area;
  seats: number;
  paymentMethod: PaymentMethod;
};

class RetryablePoolConflict extends Error {}

function isRetryable(error: unknown): boolean {
  return (
    error instanceof RetryablePoolConflict ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2034", "P2002"].includes(error.code))
  );
}

async function serializableWithRetry<T>(
  fn: (tx: Tx) => Promise<T>,
  attempts = 4
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (error) {
      last = error;
      if (!isRetryable(error) || i === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * (i + 1)));
    }
  }
  throw last;
}

async function applyPoolingDiscount(tx: Tx, poolId: string) {
  const activeMembers = await tx.rideRequest.findMany({
    where: { poolId, status: { not: RideStatus.CANCELLED } }
  });
  if (activeMembers.length < 2) return;

  await Promise.all(
    activeMembers.map(async (ride) => {
      const quote = quoteFare(ride.pickupArea, ride.destinationArea);
      if (!ride.pooled || ride.farePoysha !== quote.pooledFarePoysha) {
        await tx.rideRequest.update({
          where: { id: ride.id },
          data: { pooled: true, farePoysha: quote.pooledFarePoysha }
        });
      }
    })
  );
}

export async function createRideRequest(input: CreateRideInput) {
  if (input.pickupArea === input.destinationArea) {
    throw new AppError(400, "Pickup and destination must be different", "SAME_AREA");
  }

  const quote = quoteFare(input.pickupArea, input.destinationArea);
  const corridor = corridorFor(input.destinationArea);

  return serializableWithRetry(async (tx) => {
    const existingActive = await tx.rideRequest.findFirst({
      where: {
        passengerId: input.passengerId,
        status: {
          in: [
            RideStatus.REQUESTED,
            RideStatus.MATCHED,
            RideStatus.ACCEPTED,
            RideStatus.DRIVER_ARRIVED,
            RideStatus.STARTED
          ]
        }
      }
    });
    if (existingActive) {
      throw new AppError(409, "You already have an active ride", "ACTIVE_RIDE_EXISTS");
    }

    const candidatePools = await tx.ridePool.findMany({
      where: {
        status: PoolStatus.OPEN,
        pickupArea: input.pickupArea,
        corridor,
        vehicle: { isOnline: true }
      },
      include: { vehicle: true },
      orderBy: { createdAt: "asc" }
    });

    const candidate = candidatePools.find(
      (pool) => pool.occupiedSeats + input.seats <= pool.vehicle.capacity
    );

    if (candidate) {
      const updated = await tx.ridePool.updateMany({
        where: {
          id: candidate.id,
          status: PoolStatus.OPEN,
          occupiedSeats: candidate.occupiedSeats
        },
        data: { occupiedSeats: { increment: input.seats } }
      });

      if (updated.count !== 1) {
        throw new RetryablePoolConflict("Pool changed concurrently");
      }

      const ride = await tx.rideRequest.create({
        data: {
          passengerId: input.passengerId,
          poolId: candidate.id,
          pickupArea: input.pickupArea,
          destinationArea: input.destinationArea,
          seats: input.seats,
          distanceM: quote.distanceM,
          soloFarePoysha: quote.soloFarePoysha,
          farePoysha: quote.soloFarePoysha,
          paymentMethod: input.paymentMethod,
          status: RideStatus.MATCHED
        }
      });

      await tx.rideEvent.create({
        data: {
          rideRequestId: ride.id,
          actorId: input.passengerId,
          fromStatus: RideStatus.REQUESTED,
          toStatus: RideStatus.MATCHED,
          note: `Joined compatible pool ${candidate.id}`
        }
      });

      await applyPoolingDiscount(tx, candidate.id);
      return tx.rideRequest.findUniqueOrThrow({
        where: { id: ride.id },
        include: { pool: { include: { vehicle: true } } }
      });
    }

    const availableVehicle = await tx.vehicle.findFirst({
      where: {
        isOnline: true,
        capacity: { gte: input.seats },
        pools: { none: { status: { in: ACTIVE_POOL_STATUSES } } }
      },
      orderBy: { createdAt: "asc" }
    });

    if (availableVehicle) {
      const pool = await tx.ridePool.create({
        data: {
          vehicleId: availableVehicle.id,
          pickupArea: input.pickupArea,
          corridor,
          occupiedSeats: input.seats,
          status: PoolStatus.OPEN
        }
      });

      const ride = await tx.rideRequest.create({
        data: {
          passengerId: input.passengerId,
          poolId: pool.id,
          pickupArea: input.pickupArea,
          destinationArea: input.destinationArea,
          seats: input.seats,
          distanceM: quote.distanceM,
          soloFarePoysha: quote.soloFarePoysha,
          farePoysha: quote.soloFarePoysha,
          paymentMethod: input.paymentMethod,
          status: RideStatus.MATCHED
        }
      });

      await tx.rideEvent.create({
        data: {
          rideRequestId: ride.id,
          actorId: input.passengerId,
          fromStatus: RideStatus.REQUESTED,
          toStatus: RideStatus.MATCHED,
          note: `Created pool ${pool.id} on ${availableVehicle.name}`
        }
      });

      return tx.rideRequest.findUniqueOrThrow({
        where: { id: ride.id },
        include: { pool: { include: { vehicle: true } } }
      });
    }

    const ride = await tx.rideRequest.create({
      data: {
        passengerId: input.passengerId,
        pickupArea: input.pickupArea,
        destinationArea: input.destinationArea,
        seats: input.seats,
        distanceM: quote.distanceM,
        soloFarePoysha: quote.soloFarePoysha,
        farePoysha: quote.soloFarePoysha,
        paymentMethod: input.paymentMethod,
        status: RideStatus.REQUESTED
      }
    });

    await tx.rideEvent.create({
      data: {
        rideRequestId: ride.id,
        actorId: input.passengerId,
        toStatus: RideStatus.REQUESTED,
        note: "Waiting for an online Tesla with capacity"
      }
    });

    return ride;
  });
}

export async function acceptWaitingRequest(driverId: string, requestId: string) {
  return serializableWithRetry(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { driverId } });
    if (!vehicle) throw new AppError(404, "Driver vehicle not found", "VEHICLE_NOT_FOUND");
    if (!vehicle.isOnline) throw new AppError(409, "Go online before accepting rides", "VEHICLE_OFFLINE");

    const ride = await tx.rideRequest.findUnique({ where: { id: requestId } });
    if (!ride || ride.status !== RideStatus.REQUESTED || ride.poolId) {
      throw new AppError(409, "Ride is no longer waiting", "RIDE_NOT_WAITING");
    }
    if (ride.seats > vehicle.capacity) {
      throw new AppError(409, "Ride requires more seats than this Tesla has", "CAPACITY_EXCEEDED");
    }

    const active = await tx.ridePool.findFirst({
      where: { vehicleId: vehicle.id, status: { in: ACTIVE_POOL_STATUSES } }
    });
    if (active) throw new AppError(409, "Finish the active pool first", "ACTIVE_POOL_EXISTS");

    const pool = await tx.ridePool.create({
      data: {
        vehicleId: vehicle.id,
        pickupArea: ride.pickupArea,
        corridor: corridorFor(ride.destinationArea),
        occupiedSeats: ride.seats,
        status: PoolStatus.ACCEPTED
      }
    });

    await tx.rideRequest.update({
      where: { id: ride.id },
      data: { poolId: pool.id, status: RideStatus.MATCHED }
    });

    await tx.rideEvent.create({
      data: {
        rideRequestId: ride.id,
        poolId: pool.id,
        actorId: driverId,
        fromStatus: RideStatus.REQUESTED,
        toStatus: RideStatus.MATCHED,
        note: "Driver assigned the waiting request to a new pool"
      }
    });

    await tx.rideRequest.update({
      where: { id: ride.id },
      data: { status: RideStatus.ACCEPTED }
    });

    await tx.rideEvent.create({
      data: {
        rideRequestId: ride.id,
        poolId: pool.id,
        actorId: driverId,
        fromStatus: RideStatus.MATCHED,
        toStatus: RideStatus.ACCEPTED,
        note: "Driver accepted the new pool"
      }
    });

    return pool;
  });
}
