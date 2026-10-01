import { api } from "@/lib/api";

export interface FormAnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalStarts: number;
  totalSubmissions: number;
  visitToSubmissionRate: number;
  startToSubmissionRate: number;
  lastSubmissionAt: string | null;
}

export interface ViewsAndSubmissionsOverTime {
  date: string;
  views: number;
  submissions: number;
}

export interface FunnelStep {
  step: string;
  label: string;
  count: number;
  dropoffRate: number;
  percentOfTotal: number;
}

export interface QuestionInsight {
  questionId: string;
  label: string;
  type: string;
  position: number;
  isRequired: boolean;
  totalAnswered: number;
  totalSkipped: number;
  answerRate: number;
  distribution: { label: string; count: number; percent: number }[];
  averageScore: number | null;
  npsScore: number | null;
  topWords: { word: string; count: number }[];
}

export interface ActivityHeatmapData {
  data: { dayOfWeek: number; hour: number; count: number }[];
  maxCount: number;
}

export interface FormAnalyticsData {
  form: {
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    createdAt: string;
  };
  summary: FormAnalyticsSummary;
  viewsAndSubmissionsOverTime: ViewsAndSubmissionsOverTime[];
  funnel: FunnelStep[];
  questionInsights: QuestionInsight[];
  activityHeatmap: ActivityHeatmapData;
}

export interface OrgFormAnalyticsSummary {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  totalViews: number;
  totalStarts: number;
  totalSubmissions: number;
  conversionRate: number;
  lastSubmissionAt: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Client Tracking Utilities (Public / Respondent)
// ---------------------------------------------------------------------------

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

/**
 * Returns a stable UUID sessionId stored in sessionStorage for the given form.
 */
export function getOrCreateSessionId(formId: string): string {
  if (typeof window === "undefined") return "";
  const key = `convia_session_${formId}`;
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

/**
 * Track form page view (silent beacon on mount).
 */
export async function trackFormView(formId: string, sessionId: string): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/analytics/${formId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch (err) {
    // Non-blocking telemetry
    console.debug("Analytics view beacon failed:", err);
  }
}

/**
 * Track when respondent starts interacting with the form.
 */
export async function trackFormStart(formId: string, sessionId: string): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/analytics/${formId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch (err) {
    console.debug("Analytics start beacon failed:", err);
  }
}

/**
 * Track last question reached as the respondent progresses.
 * Uses sendBeacon with keepalive fetch fallback for guaranteed delivery even on tab close.
 */
export function trackFormProgress(
  formId: string,
  sessionId: string,
  lastQuestionIndex: number,
): void {
  if (typeof window === "undefined" || !sessionId) return;
  const payload = JSON.stringify({ sessionId, lastQuestionIndex });
  const url = `${BACKEND_URL}/api/analytics/${formId}/session/progress`;

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    const success = navigator.sendBeacon(url, blob);
    if (success) return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Organisation Analytics API Methods (Auth Required)
// ---------------------------------------------------------------------------

/**
 * Get detailed analytics for a specific form by ID or slug.
 */
export async function getFormAnalytics(
  formId: string,
): Promise<FormAnalyticsData> {
  const res = await api.get<ApiEnvelope<FormAnalyticsData>>(
    `/analytics/${formId}`,
  );
  return res.data.data;
}

/**
 * Get high-level analytics summary for all forms in the active organisation.
 */
export async function getOrgFormsAnalytics(): Promise<OrgFormAnalyticsSummary[]> {
  const res = await api.get<ApiEnvelope<OrgFormAnalyticsSummary[]>>("/analytics");
  return res.data.data;
}
