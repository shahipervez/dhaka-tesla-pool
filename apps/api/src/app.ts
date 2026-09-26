import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { ridesRouter } from "./routes/rides.js";
import { driverRouter } from "./routes/driver.js";
import { metaRouter } from "./routes/meta.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();

app.disable("x-powered-by");
app.use(pinoHttp());
app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

app.use("/api", (req, res, next) => {
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const origin = req.headers.origin;
  if (mutating && origin && origin !== env.WEB_ORIGIN) {
    return res.status(403).json({
      error: { code: "ORIGIN_REJECTED", message: "Request origin is not allowed" }
    });
  }
  next();
});

app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "dhaka-tesla-pool-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/meta", metaRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/driver", driverRouter);

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use(errorHandler);
