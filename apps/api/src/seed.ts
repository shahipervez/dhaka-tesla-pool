import { Role } from './enums.js';
import { prisma } from "./db.js";
import { hashPassword } from "./auth.js";

async function upsertUser(name: string, email: string, password: string, role: Role) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role },
    create: { name, email, passwordHash, role }
  });
}

async function main() {
  const jashim = await upsertUser("Jashim", "jashim@demo.local", "Driver123!", Role.DRIVER);
  await Promise.all([
    upsertUser("Nusrat", "nusrat@demo.local", "Pass123!", Role.PASSENGER),
    upsertUser("Rafiq", "rafiq@demo.local", "Pass123!", Role.PASSENGER),
    upsertUser("Shirin", "shirin@demo.local", "Pass123!", Role.PASSENGER)
  ]);

  await prisma.vehicle.upsert({
    where: { driverId: jashim.id },
    update: { name: "Bullet", plate: "DHAKA-BULLET-001", capacity: 3, isOnline: true },
    create: {
      driverId: jashim.id,
      name: "Bullet",
      plate: "DHAKA-BULLET-001",
      capacity: 3,
      isOnline: true
    }
  });

  console.log("Seeded Jashim/Bullet + Nusrat/Rafiq/Shirin");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
