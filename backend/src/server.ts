import express, { Request, Response } from "express";
import { errorHandler } from "./middlewares/error-handler";
import formRouter from "./modules/form/form.router";
import responseRouter from "./modules/response/response.router";
import analyticsRouter from "./modules/analytics/analytics.router";
import aiRouter from "./modules/ai/ai.router";
import billingRouter from "./modules/billing/billing.router";
import cors from "cors";
import ENV_CONFIG from "./config/env.config";
const app = express();

// CORS configuration
if (ENV_CONFIG.CLIENT_URL) {
  app.use(cors({
    origin: ENV_CONFIG.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
} else {
  console.warn("WARNING: CLIENT_URL is not defined in .env");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

// Routes
app.use("/api/forms", formRouter);
app.use("/api/responses", responseRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/billing", billingRouter);

app.use(errorHandler);

export default app;
