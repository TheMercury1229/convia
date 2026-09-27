import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import ENV_CONFIG from "./src/config/env.config";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: ENV_CONFIG.DATABASE_URL!,
  },
});
