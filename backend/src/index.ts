import { toNodeHandler } from "better-auth/node";
import ENV_CONFIG from "./config/env.config";
import { auth } from "./lib/auth";
import app from "./server";

const PORT = ENV_CONFIG.PORT;
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
