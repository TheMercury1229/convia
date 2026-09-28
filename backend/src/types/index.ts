import type { Request } from "express";
import type { InferSelectModel } from "drizzle-orm";
import type {
  form,
  section,
  question,
} from "../db/schema/form-schema";
import type { response, answer } from "../db/schema/response-schema";

// ---------------------------------------------------------------------------
// Drizzle inferred row types
// ---------------------------------------------------------------------------

export type Form = InferSelectModel<typeof form>;
export type Section = InferSelectModel<typeof section>;
export type Question = InferSelectModel<typeof question>;
export type Response = InferSelectModel<typeof response>;
export type Answer = InferSelectModel<typeof answer>;

export type QuestionWithAnswers = Question & {
  answers: Answer[];
};

export type SectionWithQuestions = Section & {
  questions: Question[];
};

export type FormWithSections = Form & {
  sections: SectionWithQuestions[];
};

export type ResponseWithAnswers = Response & {
  answers: Answer[];
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface AuthSession {
  /** The organisation the user is currently working in (null = personal context). */
  activeOrganizationId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  /** Populated by requireAuth middleware. */
  session: AuthSession;
  /**
   * Populated by requireOrgMember middleware.
   * The resolved organisation ID for the current request.
   */
  orgId?: string;
  /**
   * Populated by requireOrgMember middleware.
   * The member's role in the current organisation (e.g. "owner", "editor", "viewer").
   */
  orgRole?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
