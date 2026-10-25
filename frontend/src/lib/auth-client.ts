
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { dodopaymentsClient } from "@dodopayments/better-auth/client";
import { ac, owner, editor, viewer } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000",
  plugins: [
    organizationClient({
      /**
       * Passing ac + roles lets the client resolve permissions synchronously
       * via checkRolePermission() without a server round-trip.
       *
       * Roles:
       *   owner  – full control
       *   editor – can update / manage members & invitations
       *   viewer – read-only
       */
      ac,
      roles: {
        owner,
        editor,
        viewer,
      },
    }),
    dodopaymentsClient(),
  ],
});
