import { betterAuth } from "better-auth";
import db from "../db/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { ac, owner, editor, viewer } from "./permissions";
import * as schema from "../db/schema/index";
import ENV_CONFIG from "../config/env.config";
import { sendInvitationEmail } from "./email";

export const auth = betterAuth({
  baseURL: ENV_CONFIG.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: ENV_CONFIG.GOOGLE_CLIENT_ID!,
      clientSecret: ENV_CONFIG.GOOGLE_CLIENT_SECRET!,
    },
  },
  trustedOrigins: [ENV_CONFIG.CLIENT_URL!],
  user: {
    deleteUser: {
      enabled: true,
    }
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const orgId = crypto.randomUUID();
            const baseSlug = (user.name || "org")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "") || "org";
            const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

            await db.insert(schema.organization).values({
              id: orgId,
              name: `${user.name || "User"}'s Organisation`,
              slug,
              createdAt: new Date(),
            });

            await db.insert(schema.member).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              userId: user.id,
              role: "owner",
              createdAt: new Date(),
            });
          } catch (error) {
            console.error("Error creating default organisation on signup:", error);
          }
        },
      },
    },
  },

  plugins: [
    organization({
      /**
       * Custom access-control with three roles:
       *   owner  – full control (can delete org, manage all members)
       *   editor – can update org info and manage members / invitations
       *   viewer – read-only, cannot mutate any organisation resource
       */
      ac,
      roles: {
        owner,
        editor,
        viewer,
      },
      // The user who creates an organisation automatically becomes its owner.
      creatorRole: "owner",
      sendInvitationEmail: async (data) => {
        await sendInvitationEmail(data);
      },
    }),
  ],
});
