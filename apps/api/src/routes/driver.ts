import { Router } from "express";
import { PoolStatus, RideStatus, Role } from '../enums.js';
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { actionToStatus, transitionPool } from "../services/driver.js";
import { acceptWaitingRequest } from "../services/pool.js";

export const driverRouter = Router();
driverRouter.use(requireAuth, requireRole(Role.DRIVER));

driverRouter.get("/dashboard", async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { driverId: req.auth!.userId }
  });
  if (!vehicle) throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");

  const activePool = await prisma.ridePool.findFirst({
    where: {
      vehicleId: vehicle.id,
      status: { in: [PoolStatus.OPEN, PoolStatus.ACCEPTED, PoolStatus.DRIVER_ARRIVED, PoolStatus.STARTED] }
    },
    include: {
      rides: {
        where: { status: { not: RideStatus.CANCELLED } },
        select: {
          id: true,
          pickupArea: true,
          destinationArea: true,
          seats: true,
          status: true,
          passenger: { select: { id: true, name: true } }
          // Fare intentionally omitted from driver passenger list.
        }
      }
    }
  });

  const waitingRequests = await prisma.rideRequest.findMany({
    where: { status: RideStatus.REQUESTED, poolId: null },
    select: {
      id: true,
      pickupArea: true,
      destinationArea: true,
      seats: true,
      createdAt: true,
      passenger: { select: { name: true } }
    },
    orderBy: { createdAt: "asc" },
    take: 20
  });

  const history = await prisma.ridePool.findMany({
    where: { vehicleId: vehicle.id, status: { in: [PoolStatus.COMPLETED, PoolStatus.CANCELLED] } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      pickupArea: true,
      status: true,
      occupiedSeats: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({ vehicle, activePool, waitingRequests, history });
});

driverRouter.patch("/vehicle/online", async (req, res) => {
  const input = z.object({ isOnline: z.boolean() }).parse(req.body);
  const vehicle = await prisma.vehicle.findUnique({ where: { driverId: req.auth!.userId } });
  if (!vehicle) throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");

  if (!input.isOnline) {
    const active = await prisma.ridePool.count({
      where: {
        vehicleId: vehicle.id,
        status: { in: [PoolStatus.OPEN, PoolStatus.ACCEPTED, PoolStatus.DRIVER_ARRIVED, PoolStatus.STARTED] }
      }
    });
    if (active) throw new AppError(409, "Cannot go offline while a pool is active", "ACTIVE_RIDE");
  }

  const updated = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { isOnline: input.isOnline }
  });
  res.json({ vehicle: updated });
});

driverRouter.post("/pools/:id/transition", async (req, res) => {
  const input = z.object({ action: z.enum(["accept", "arrived", "start", "complete"]) }).parse(req.body);
  const pool = await transitionPool(req.auth!.userId, req.params.id, actionToStatus[input.action]);
  res.json({ pool });
});

driverRouter.post("/requests/:id/accept", async (req, res) => {
  const pool = await acceptWaitingRequest(req.auth!.userId, req.params.id);
  res.status(201).json({ pool });
});
