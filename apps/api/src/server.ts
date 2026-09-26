import { app } from "./app.js";
import { env } from "./config.js";
import { prisma } from "./db.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Dhaka Tesla Pool API listening on :${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
