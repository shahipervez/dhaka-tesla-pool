import { describe, expect, it } from "vitest";

const dbDescribe = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

dbDescribe("passenger ownership", () => {
  it("does not expose another passenger's ride", async () => {
    const [{ app }, { prisma }, { signToken }, { Role, Area, PaymentMethod }] = await Promise.all([
      import("../app.js"),
      import("../db.js"),
      import("../auth.js"),
      import("../enums.js")
    ]);
    const request = (await import("supertest")).default;

    await prisma.rideEvent.deleteMany();
    await prisma.rideRequest.deleteMany();
    await prisma.ridePool.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    const owner = await prisma.user.create({
      data: {
        name: "Nusrat",
        email: "owner@demo.local",
        passwordHash: "unused",
        role: Role.PASSENGER
      }
    });
    const other = await prisma.user.create({
      data: {
        name: "Rafiq",
        email: "other@demo.local",
        passwordHash: "unused",
        role: Role.PASSENGER
      }
    });

    const ride = await prisma.rideRequest.create({
      data: {
        passengerId: owner.id,
        pickupArea: Area.BANANI,
        destinationArea: Area.MOHAKHALI,
        seats: 1,
        distanceM: 3000,
        soloFarePoysha: 9500,
        farePoysha: 9500,
        paymentMethod: PaymentMethod.CASH
      }
    });

    const token = signToken({ sub: other.id, role: other.role, name: other.name });
    const response = await request(app)
      .get(`/api/rides/${ride.id}`)
      .set("Cookie", [`dtp_token=${token}`]);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("RIDE_NOT_FOUND");

    const cancelResponse = await request(app)
      .post(`/api/rides/${ride.id}/cancel`)
      .set("Cookie", [`dtp_token=${token}`])
      .send({ reason: "not mine" });

    expect(cancelResponse.status).toBe(404);
    expect(cancelResponse.body.error.code).toBe("RIDE_NOT_FOUND");

    const unchanged = await prisma.rideRequest.findUniqueOrThrow({ where: { id: ride.id } });
    expect(unchanged.status).toBe("REQUESTED");

    await prisma.$disconnect();
  });
});
