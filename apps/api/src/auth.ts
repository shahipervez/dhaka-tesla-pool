import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Role } from './enums.js';
import { env } from "./config.js";

export type AuthToken = { sub: string; role: Role; name: string };

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthToken) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): AuthToken {
  return jwt.verify(token, env.JWT_SECRET) as AuthToken;
}
