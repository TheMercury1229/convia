import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

/**
 * Access control statement that merges the default organization statements
 * with any app-specific resources.
 *
 * Default resources included via `defaultStatements`:
 *   - organization: ["update", "delete"]
 *   - member:       ["create", "update", "delete"]
 *   - invitation:   ["create", "cancel"]
 */
export const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

/**
 * owner — full control (mirrors the built-in owner permissions).
 * Inherits everything from ownerAc so we stay in sync with future
 * better-auth updates while still being able to extend later.
 */
export const owner = ac.newRole({
  ...ownerAc.statements,
});

/**
 * editor — can update the organization and fully manage members &
 * invitations, but cannot delete the organization or transfer ownership.
 */
export const editor = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

/**
 * viewer — read-only access.  Better-auth's permission model works by
 * explicitly granting actions, so an empty role means "can view but
 * cannot mutate anything."  The user can still call read-only endpoints
 * (listMembers, getOrganization, etc.) because those don't perform a
 * permission check on these resources.
 */
export const viewer = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
});
