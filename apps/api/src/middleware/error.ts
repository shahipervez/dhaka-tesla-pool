import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request", details: err.flatten() }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details }
    });
  }

  req.log?.error?.({ err }, "unhandled error");
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" }
  });
};
