import { Router } from "express";
import { Role } from '../enums.js';
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword, signToken, verifyPassword } from "../auth.js";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const credentials = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(100)
});

const cookieOptions = {
  httpOnly: true,
  sameSite: env.COOKIE_SAMESITE,
  secure: env.COOKIE_SECURE,
  maxAge: 8 * 60 * 60 * 1000,
  path: "/"
};

authRouter.post("/register", async (req, res) => {
  const input = credentials.extend({ name: z.string().min(2).max(80) }).parse(req.body);

  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new AppError(409, "Email is already registered", "EMAIL_EXISTS");

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: Role.PASSENGER
    },
    select: { id: true, name: true, email: true, role: true }
  });

  res.cookie("dtp_token", signToken({ sub: user.id, role: user.role, name: user.name }), cookieOptions);
  res.status(201).json({ user });
});

authRouter.post("/login", async (req, res) => {
  const input = credentials.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  res.cookie("dtp_token", signToken({ sub: user.id, role: user.role, name: user.name }), cookieOptions);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("dtp_token", { ...cookieOptions, maxAge: undefined });
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, name: true, email: true, role: true }
  });
  if (!user) throw new AppError(401, "Session user no longer exists", "INVALID_SESSION");
  res.json({ user });
});
