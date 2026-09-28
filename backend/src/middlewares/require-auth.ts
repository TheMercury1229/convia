import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { ApiError } from "../utils/api-error";
import type { AuthenticatedRequest } from "../types/index";

/**
 * requireAuth
 *
 * Verifies the better-auth session cookie / bearer token attached to the
 * request and attaches the authenticated user (+ active organisation) to
 * `req.user` and `req.session`.
 *
 * Throws 401 if there is no valid session.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    // Attach to request so downstream handlers can read it
    (req as AuthenticatedRequest).user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    };
    (req as AuthenticatedRequest).session = {
      activeOrganizationId: (session.session as any).activeOrganizationId ?? null,
    };

    return next();
  } catch {
    return next(ApiError.unauthorized("Authentication required"));
  }
};

/**
 * requireOrgMember
 *
 * Must be used **after** `requireAuth`.
 *
 * Ensures the authenticated user is an active member of the organisation
 * identified by `req.params.orgId` (or `req.session.activeOrganizationId`
 * when no param is present).
 *
 * Attaches `req.orgId` so downstream handlers don't need to re-derive it.
 *
 * Usage (router):
 *   router.get("/", requireAuth, requireOrgMember, controller.listForms)
 */
export const requireOrgMember = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Prefer explicit param, fall back to session's active org
    const orgId =
      (req.params.orgId as string | undefined) ??
      authReq.session?.activeOrganizationId ??
      null;

    if (!orgId) {
      return next(
        ApiError.badRequest(
          "No active organisation – set one with POST /api/auth/organization/set-active",
        ),
      );
    }

    // Verify membership via better-auth API
    const member = await auth.api.getActiveMember({
      headers: fromNodeHeaders(req.headers),
    });

    if (!member) {
      return next(
        ApiError.forbidden("You are not a member of this organisation"),
      );
    }

    authReq.orgId = orgId;
    authReq.orgRole = (member as any).role as string;

    return next();
  } catch {
    return next(
      ApiError.forbidden("You are not a member of this organisation"),
    );
  }
};
