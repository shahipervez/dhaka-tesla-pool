import type { NextFunction, Request, Response } from "express";
import { Role } from '../enums.js';
import { verifyToken } from "../auth.js";
import { AppError } from "../errors.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.dtp_token ?? bearer;

  if (!token) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));

  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired session", "INVALID_SESSION"));
  }
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
    if (req.auth.role !== role) return next(new AppError(403, "Forbidden", "FORBIDDEN"));
    next();
  };
}
