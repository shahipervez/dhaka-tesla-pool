import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax")
});

export const env = envSchema.parse(process.env);
