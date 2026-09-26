import { describe, expect, it } from "vitest";

const dbDescribe = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

dbDescribe("story pooling", () => {
  it("pools Nusrat and Rafiq and gives each their own deterministic fare", async () => {
    const [{ prisma }, { createRideRequest }, { Area, PaymentMethod, Role }] = await Promise.all([
      import("../db.js"),
      import("../services/pool.js"),
      import("../enums.js")
    ]);

    await prisma.rideEvent.deleteMany();
    await prisma.rideRequest.deleteMany();
    await prisma.ridePool.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    const jashim = await prisma.user.create({
      data: {
        name: "Jashim",
        email: "jashim-pool@demo.local",
        passwordHash: "unused",
        role: Role.DRIVER
      }
    });
    await prisma.vehicle.create({
      data: {
        driverId: jashim.id,
        name: "Bullet",
        plate: "TEST-BULLET-POOL",
        capacity: 3,
        isOnline: true
      }
    });
    const [nusrat, rafiq] = await Promise.all([
      prisma.user.create({
        data: { name: "Nusrat", email: "nusrat-pool@demo.local", passwordHash: "unused", role: Role.PASSENGER }
      }),
      prisma.user.create({
        data: { name: "Rafiq", email: "rafiq-pool@demo.local", passwordHash: "unused", role: Role.PASSENGER }
      })
    ]);

    const nusratRide = await createRideRequest({
      passengerId: nusrat.id,
      pickupArea: Area.BANANI,
      destinationArea: Area.MOHAKHALI,
      seats: 1,
      paymentMethod: PaymentMethod.CASH
    });
    const rafiqRide = await createRideRequest({
      passengerId: rafiq.id,
      pickupArea: Area.BANANI,
      destinationArea: Area.GULSHAN_1,
      seats: 1,
      paymentMethod: PaymentMethod.CASH
    });

    expect(rafiqRide.poolId).toBe(nusratRide.poolId);

    const [freshNusrat, freshRafiq, pool] = await Promise.all([
      prisma.rideRequest.findUniqueOrThrow({ where: { id: nusratRide.id } }),
      prisma.rideRequest.findUniqueOrThrow({ where: { id: rafiqRide.id } }),
      prisma.ridePool.findUniqueOrThrow({ where: { id: nusratRide.poolId! } })
    ]);

    expect(freshNusrat.pooled).toBe(true);
    expect(freshRafiq.pooled).toBe(true);
    expect(freshNusrat.farePoysha).toBe(8075);
    expect(freshRafiq.farePoysha).toBe(7310);
    expect(pool.occupiedSeats).toBe(2);

    await prisma.$disconnect();
  });
});
