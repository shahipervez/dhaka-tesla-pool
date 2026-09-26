import { describe, expect, it } from "vitest";

const dbDescribe = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

dbDescribe("pool concurrency", () => {
  it("does not let two concurrent requests claim one final seat", async () => {
    const [{ prisma }, { createRideRequest }, { Area, PaymentMethod, Role, RideStatus }] = await Promise.all([
      import("../db.js"),
      import("../services/pool.js"),
      import("../enums.js")
    ]);

    await prisma.rideEvent.deleteMany();
    await prisma.rideRequest.deleteMany();
    await prisma.ridePool.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    const driver = await prisma.user.create({
      data: {
        name: "Jashim",
        email: "jashim-concurrency@demo.local",
        passwordHash: "unused",
        role: Role.DRIVER
      }
    });
    await prisma.vehicle.create({
      data: {
        driverId: driver.id,
        name: "Bullet",
        plate: "TEST-BULLET-1",
        capacity: 1,
        isOnline: true
      }
    });
    const [nusrat, shirin] = await Promise.all([
      prisma.user.create({
        data: { name: "Nusrat", email: "nusrat-c@demo.local", passwordHash: "unused", role: Role.PASSENGER }
      }),
      prisma.user.create({
        data: { name: "Shirin", email: "shirin-c@demo.local", passwordHash: "unused", role: Role.PASSENGER }
      })
    ]);

    const results = await Promise.all([
      createRideRequest({
        passengerId: nusrat.id,
        pickupArea: Area.BANANI,
        destinationArea: Area.MOHAKHALI,
        seats: 1,
        paymentMethod: PaymentMethod.CASH
      }),
      createRideRequest({
        passengerId: shirin.id,
        pickupArea: Area.BANANI,
        destinationArea: Area.GULSHAN_1,
        seats: 1,
        paymentMethod: PaymentMethod.CASH
      })
    ]);

    const assigned = results.filter((r) => r.status === RideStatus.MATCHED);
    const waiting = results.filter((r) => r.status === RideStatus.REQUESTED);
    expect(assigned).toHaveLength(1);
    expect(waiting).toHaveLength(1);

    const pool = await prisma.ridePool.findFirstOrThrow();
    expect(pool.occupiedSeats).toBe(1);

    await prisma.$disconnect();
  });
});
