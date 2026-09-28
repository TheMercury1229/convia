import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

/**
 * Mirror of the backend permissions.ts — must be kept in sync.
 *
 * This file is imported by auth-client.ts so the client knows about
 * the three roles and can use checkRolePermission() without a round-trip.
 */

export const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

/** Full control – can delete org and transfer ownership. */
export const owner = ac.newRole({
  ...ownerAc.statements,
});

/** Can update the org and manage members / invitations, but cannot delete. */
export const editor = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

/** Read-only – cannot mutate any org resource. */
export const viewer = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
});
