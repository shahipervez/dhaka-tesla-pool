import { Router } from "express";
import { Area, PaymentMethod, Role } from '../enums.js';
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { quoteFare } from "../domain/fare.js";
import { createRideRequest } from "../services/pool.js";
import { cancelRide } from "../services/ride.js";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";

export const ridesRouter = Router();

ridesRouter.use(requireAuth, requireRole(Role.PASSENGER));

const rideSchema = z.object({
  pickupArea: z.nativeEnum(Area),
  destinationArea: z.nativeEnum(Area),
  seats: z.coerce.number().int().min(1).max(3),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH)
});

ridesRouter.post("/estimate", (req, res) => {
  const input = rideSchema.pick({ pickupArea: true, destinationArea: true }).parse(req.body);
  if (input.pickupArea === input.destinationArea) {
    throw new AppError(400, "Pickup and destination must differ", "SAME_AREA");
  }
  res.json({ quote: quoteFare(input.pickupArea, input.destinationArea) });
});

ridesRouter.post("/", async (req, res) => {
  const input = rideSchema.parse(req.body);
  const ride = await createRideRequest({
    passengerId: req.auth!.userId,
    ...input
  });
  res.status(201).json({ ride });
});

ridesRouter.get("/me", async (req, res) => {
  const rides = await prisma.rideRequest.findMany({
    where: { passengerId: req.auth!.userId },
    include: {
      pool: { include: { vehicle: { select: { id: true, name: true } } } },
      events: { orderBy: { createdAt: "asc" } }
    },
    orderBy: { createdAt: "desc" }
  });
  res.json({ rides });
});

ridesRouter.get("/:id", async (req, res) => {
  const ride = await prisma.rideRequest.findFirst({
    where: { id: req.params.id, passengerId: req.auth!.userId },
    include: {
      pool: { include: { vehicle: { select: { id: true, name: true } } } },
      events: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!ride) throw new AppError(404, "Ride not found", "RIDE_NOT_FOUND");
  res.json({ ride });
});

ridesRouter.post("/:id/cancel", async (req, res) => {
  const input = z.object({ reason: z.string().max(200).optional() }).parse(req.body ?? {});
  const ride = await cancelRide(req.auth!.userId, req.params.id, input.reason);
  res.json({ ride });
});
