import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { ApiError, fail } from "./lib/http";
import { adminRouter } from "./routes/admin";
import { adsRouter } from "./routes/ads";
import { authRouter } from "./routes/auth";
import { billingRouter, reconcileHostedPayments } from "./routes/billing";
import { PAYMENT_SECRETS } from "./lib/payments";
import { catalogRouter } from "./routes/catalog";
import { jobsRouter } from "./routes/jobs";
import { socialRouter } from "./routes/social";
import { expireStale } from "./jobs/scheduled";

setGlobalOptions({ region: "us-central1", maxInstances: 20 });

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Served both at /api/v1/* (Hosting rewrite) and /v1/* (direct function URL).
const v1 = express.Router();
v1.use("/auth", authRouter);
v1.use("/admin", adminRouter);
v1.use(catalogRouter);
v1.use(adsRouter);
v1.use(socialRouter);
v1.use(billingRouter);
v1.use(jobsRouter);
v1.use((_req, res) => fail(res, "Not found.", 404));

app.use(["/api/v1", "/v1"], v1);
app.use((_req, res) => fail(res, "Not found.", 404));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) return fail(res, err.message, err.status, err.errors);
  if (err instanceof SyntaxError) return fail(res, "Malformed JSON body.", 400);
  logger.error("Unhandled API error", err);
  fail(res, "Server error.", 500);
});

export const api = onRequest({ memory: "512MiB", timeoutSeconds: 120, concurrency: 40, invoker: "public", secrets: PAYMENT_SECRETS }, app);

/** Hourly housekeeping: expire ads / featured flags / subscriptions past their end date, settle hosted payments. */
export const housekeeping = onSchedule({ schedule: "every 60 minutes", timeoutSeconds: 300, secrets: PAYMENT_SECRETS }, async () => {
  await expireStale();
  const settled = await reconcileHostedPayments();
  if (settled) logger.info(`housekeeping: settled ${settled} hosted payment(s)`);
});
