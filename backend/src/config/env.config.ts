import dotenv from "dotenv";
dotenv.config();

const ENV_CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || "notifications@convia.app",
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || "Convia",
  AI_BACKEND_URL: process.env.AI_BACKEND_URL || "http://localhost:8080",
  DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
  DODO_PAYMENTS_WEBHOOK_SECRET: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
  DODO_PRODUCT_BUILDER: process.env.DODO_PRODUCT_BUILDER,
  DODO_PRODUCT_PRO: process.env.DODO_PRODUCT_PRO,
};
Object.freeze(ENV_CONFIG);

export default ENV_CONFIG;
