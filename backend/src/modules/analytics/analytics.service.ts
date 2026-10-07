import { ApiError } from "../../utils/api-error";
import * as analyticsRepo from "./analytics.repository";
import { isAnsweredValue } from "../response/response-calculations";
import type {
  RecordViewInput,
  StartSessionInput,
  UpdateSessionInput,
  CompleteSessionInput,
} from "./analytics.schema";

const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "n/a",
  "na",
  "null",
  "none",
]);

// ---------------------------------------------------------------------------
// Ingestion services (Public — called from Form Viewer)
// ---------------------------------------------------------------------------

export const recordView = async (formId: string, input: RecordViewInput) => {
  const formRow = await analyticsRepo.findFormById(formId);
  if (!formRow) throw ApiError.notFound("Form not found");
  await analyticsRepo.recordFormView(formId, input.sessionId);
  return { recorded: true };
};

export const startSession = async (
  formId: string,
  input: StartSessionInput,
) => {
  const formRow = await analyticsRepo.findFormById(formId);
  if (!formRow) throw ApiError.notFound("Form not found");
  await analyticsRepo.startFormSession(formId, input.sessionId);
  return { started: true };
};

export const updateSession = async (
  formId: string,
  input: UpdateSessionInput,
) => {
  await analyticsRepo.updateFormSessionProgress(
    formId,
    input.sessionId,
    input.lastQuestionIndex,
  );
  return { updated: true };
};

export const completeSession = async (
  formId: string,
  input: CompleteSessionInput,
) => {
  await analyticsRepo.completeFormSession(
    formId,
    input.sessionId,
    input.responseId,
  );
  return { completed: true };
};

// ---------------------------------------------------------------------------
// Form Analytics Aggregation (Authenticated — Org Members)
// ---------------------------------------------------------------------------

export const getFormAnalytics = async (formIdOrSlug: string, orgId: string) => {
  // 1. Resolve form by ID or slug
  let formRow = await analyticsRepo.findFormById(formIdOrSlug);
  if (!formRow) {
    formRow = await analyticsRepo.findFormBySlug(formIdOrSlug, orgId);
  }
  if (!formRow) throw ApiError.notFound("Form not found");
  if (formRow.orgId !== orgId) throw ApiError.forbidden("Access denied");

  const formId = formRow.id;

  // 2. Fetch all raw datasets in parallel
  const [questions, views, sessions, responses, answers] = await Promise.all([
    analyticsRepo.findQuestionsByFormId(formId),
    analyticsRepo.findFormViewsByFormId(formId),
    analyticsRepo.findFormSessionsByFormId(formId),
    analyticsRepo.findResponsesByFormId(formId),
    analyticsRepo.findAnswersByFormId(formId),
  ]);

  // 3. Compute Summary Metrics
  const answerableQuestions = questions.filter((q) => q.type !== "heading");
  const totalAnswerable = answerableQuestions.length;

  const answersByResponse = new Map<string, typeof answers>();
  answers.forEach((ans) => {
    const list = answersByResponse.get(ans.responseId) ?? [];
    list.push(ans);
    answersByResponse.set(ans.responseId, list);
  });

  let completedSubmissions = 0;
  let partialSubmissions = 0;
  const responseCompletionMap = new Map<string, { answeredCount: number; isCompleted: boolean }>();

  responses.forEach((r) => {
    const rAnswers = answersByResponse.get(r.id) ?? [];
    let answeredCount = 0;
    for (const a of rAnswers) {
      if (isAnsweredValue(a.value)) answeredCount++;
    }

    const isCompleted = totalAnswerable === 0 || answeredCount >= totalAnswerable;
    responseCompletionMap.set(r.id, { answeredCount, isCompleted });

    if (isCompleted) {
      completedSubmissions++;
    } else {
      partialSubmissions++;
    }
  });

  const totalSubmissions = responses.length;
  // Submissions require starting; ensure consistency even if adblockers prevented client beacons
  const totalStarts = Math.max(sessions.length, responses.length);
  const totalViews = Math.max(views.length, totalStarts);
  const uniqueVisitorSet = new Set(views.map((v) => v.sessionId));
  const uniqueVisitors = Math.max(uniqueVisitorSet.size, totalStarts > 0 ? 1 : 0);

  // Industry-Standard Form Metrics:
  // Engagement Rate = (Total Starts / Total Views) * 100
  const engagementRate =
    totalViews > 0
      ? Math.min(100, Number(((totalStarts / totalViews) * 100).toFixed(1)))
      : 0;

  // Completion Rate = (Completed Submissions / Total Starts) * 100 (partials excluded from numerator)
  const completionRate =
    totalStarts > 0
      ? Math.min(100, Number(((completedSubmissions / totalStarts) * 100).toFixed(1)))
      : 0;

  // Drop-off Rate = 100 - Completion Rate
  const dropoffRate =
    totalStarts > 0
      ? Math.max(0, Number((100 - completionRate).toFixed(1)))
      : 0;

  // Visit-to-Completion (Overall Conversion) Rate = (Completed Submissions / Total Views) * 100
  const visitToSubmissionRate =
    totalViews > 0
      ? Math.min(100, Number(((completedSubmissions / totalViews) * 100).toFixed(1)))
      : 0;

  const startToSubmissionRate = completionRate;

  const lastSubmissionAt =
    responses.length > 0
      ? new Date(responses[responses.length - 1].submittedAt).toISOString()
      : null;

  // 4. Compute Submissions & Views Over Time (Date aggregation)
  const dateMap = new Map<string, { views: number; submissions: number }>();

  // Ensure recent 7 days exist with zero counts if empty
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dateMap.set(key, { views: 0, submissions: 0 });
  }

  views.forEach((v) => {
    const key = new Date(v.viewedAt).toISOString().split("T")[0];
    const cur = dateMap.get(key) ?? { views: 0, submissions: 0 };
    cur.views += 1;
    dateMap.set(key, cur);
  });

  responses.forEach((r) => {
    const isCompleted = responseCompletionMap.get(r.id)?.isCompleted ?? true;
    if (isCompleted) {
      const key = new Date(r.submittedAt).toISOString().split("T")[0];
      const cur = dateMap.get(key) ?? { views: 0, submissions: 0 };
      cur.submissions += 1;
      dateMap.set(key, cur);
    }
  });

  const viewsAndSubmissionsOverTime = Array.from(dateMap.entries())
    .map(([date, counts]) => ({
      date,
      views: counts.views,
      submissions: counts.submissions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 5. Drop-off Funnel
  const funnelSteps: {
    step: string;
    label: string;
    count: number;
    dropoffRate: number;
    percentOfTotal: number;
  }[] = [];

  const initialCount = Math.max(totalViews, totalStarts, completedSubmissions);
  const baseline = initialCount > 0 ? initialCount : 1;

  // Step 1: Form Loaded
  funnelSteps.push({
    step: "views",
    label: "Opened Form",
    count: totalViews,
    dropoffRate: 0,
    percentOfTotal: totalViews > 0 ? 100 : 0,
  });

  // Step 2: Form Started
  const startDrop =
    totalViews > 0
      ? Number((((totalViews - totalStarts) / totalViews) * 100).toFixed(1))
      : 0;
  funnelSteps.push({
    step: "started",
    label: "Started Filling",
    count: totalStarts,
    dropoffRate: Math.max(0, startDrop),
    percentOfTotal: Number(((totalStarts / baseline) * 100).toFixed(1)),
  });

  // Question steps
  let previousStepCount = totalStarts;
  answerableQuestions.forEach((q, idx) => {
    const sessionReached = sessions.filter(
      (s) => s.lastQuestionIndex >= idx || s.completedAt !== null,
    ).length;

    const responsesReached = responses.filter((r) => {
      const isCompleted = responseCompletionMap.get(r.id)?.isCompleted;
      if (isCompleted) return true;
      const rAns = answersByResponse.get(r.id) ?? [];
      return rAns.some((a) => {
        if (!isAnsweredValue(a.value)) return false;
        const targetQIdx = answerableQuestions.findIndex((aq) => aq.id === a.questionId);
        return targetQIdx >= idx;
      });
    }).length;

    const reachedCount = Math.max(sessionReached, responsesReached, completedSubmissions);
    const effectiveCount = Math.min(previousStepCount, reachedCount);

    const stepDrop =
      previousStepCount > 0
        ? Number(
            (
              ((previousStepCount - effectiveCount) / previousStepCount) *
              100
            ).toFixed(1),
          )
        : 0;

    const qText = q.label || `Question ${idx + 1}`;
    funnelSteps.push({
      step: `q_${q.id}`,
      label: `Q${idx + 1}: ${qText.length > 25 ? qText.slice(0, 25) + "…" : qText}`,
      count: effectiveCount,
      dropoffRate: Math.max(0, stepDrop),
      percentOfTotal: Number(((effectiveCount / baseline) * 100).toFixed(1)),
    });

    previousStepCount = effectiveCount;
  });

  // Step Final: Completed
  const finalDrop =
    previousStepCount > 0
      ? Number(
          (
            ((previousStepCount - completedSubmissions) / previousStepCount) *
            100
          ).toFixed(1),
        )
      : 0;
  funnelSteps.push({
    step: "submitted",
    label: "Completed",
    count: completedSubmissions,
    dropoffRate: Math.max(0, finalDrop),
    percentOfTotal: Number(((completedSubmissions / baseline) * 100).toFixed(1)),
  });

  // 6. Per-Question Answer Distributions & Insights
  const answersByQuestion = new Map<string, typeof answers>();
  answers.forEach((ans) => {
    const list = answersByQuestion.get(ans.questionId) ?? [];
    list.push(ans);
    answersByQuestion.set(ans.questionId, list);
  });

  const questionInsights = answerableQuestions.map((q) => {
    const qAnswers = answersByQuestion.get(q.id) ?? [];

    // Count valid answers
    const validAnswers = qAnswers.filter((a) => isAnsweredValue(a.value));

    const totalAnswered = validAnswers.length;
    const totalSkipped = Math.max(0, totalSubmissions - totalAnswered);
    const answerRate =
      totalSubmissions > 0
        ? Number(((totalAnswered / totalSubmissions) * 100).toFixed(1))
        : 0;

    let distribution: { label: string; count: number; percent: number }[] = [];
    let averageScore: number | null = null;
    let npsScore: number | null = null;
    let topWords: { word: string; count: number }[] = [];

    // Parse options if available
    let optionLabels: string[] = [];
    if (q.options) {
      if (Array.isArray(q.options)) {
        optionLabels = q.options.map((opt) =>
          typeof opt === "string"
            ? opt
            : String((opt as any)?.label ?? (opt as any)?.value ?? opt),
        );
      } else if (typeof q.options === "string") {
        try {
          const parsed = JSON.parse(q.options);
          if (Array.isArray(parsed)) {
            optionLabels = parsed.map((opt) =>
              typeof opt === "string"
                ? opt
                : String(opt?.label ?? opt?.value ?? opt),
            );
          }
        } catch {}
      }
    }

    // 6a. Choice & Multi-select & Radio
    if (["radio", "select", "checkbox", "multi_select"].includes(q.type)) {
      const counts = new Map<string, number>();
      optionLabels.forEach((lbl) => counts.set(lbl, 0));

      validAnswers.forEach((a) => {
        if (Array.isArray(a.value)) {
          a.value.forEach((v) => {
            const strVal = String(v);
            counts.set(strVal, (counts.get(strVal) ?? 0) + 1);
          });
        } else if (a.value !== null && a.value !== undefined) {
          const strVal = String(a.value);
          counts.set(strVal, (counts.get(strVal) ?? 0) + 1);
        }
      });

      distribution = Array.from(counts.entries()).map(([label, count]) => ({
        label,
        count,
        percent:
          totalAnswered > 0
            ? Number(((count / totalAnswered) * 100).toFixed(1))
            : 0,
      }));
    }

    // 6b. Yes / No
    else if (q.type === "yes_no") {
      let yesCount = 0;
      let noCount = 0;

      validAnswers.forEach((a) => {
        const val = String(a.value).toLowerCase();
        if (val === "yes" || val === "true" || val === "1") yesCount++;
        else if (val === "no" || val === "false" || val === "0") noCount++;
      });

      distribution = [
        {
          label: "Yes",
          count: yesCount,
          percent:
            totalAnswered > 0
              ? Number(((yesCount / totalAnswered) * 100).toFixed(1))
              : 0,
        },
        {
          label: "No",
          count: noCount,
          percent:
            totalAnswered > 0
              ? Number(((noCount / totalAnswered) * 100).toFixed(1))
              : 0,
        },
      ];
    }

    // 6c. Rating (1-5)
    else if (q.type === "rating") {
      const counts = new Map<number, number>([
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
      ]);
      let sum = 0;

      validAnswers.forEach((a) => {
        const num = Number(a.value);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          counts.set(num, (counts.get(num) ?? 0) + 1);
          sum += num;
        }
      });

      distribution = Array.from(counts.entries()).map(([rating, count]) => ({
        label: `${rating} ★`,
        count,
        percent:
          totalAnswered > 0
            ? Number(((count / totalAnswered) * 100).toFixed(1))
            : 0,
      }));

      averageScore =
        totalAnswered > 0 ? Number((sum / totalAnswered).toFixed(2)) : null;
    }

    // 6d. Scale / NPS (0-10)
    else if (q.type === "scale") {
      const counts = new Map<number, number>();
      for (let i = 0; i <= 10; i++) counts.set(i, 0);

      let sum = 0;
      let promoters = 0; // 9-10
      let passives = 0; // 7-8
      let detractors = 0; // 0-6

      validAnswers.forEach((a) => {
        const num = Number(a.value);
        if (!isNaN(num) && num >= 0 && num <= 10) {
          counts.set(num, (counts.get(num) ?? 0) + 1);
          sum += num;
          if (num >= 9) promoters++;
          else if (num >= 7) passives++;
          else detractors++;
        }
      });

      distribution = Array.from(counts.entries()).map(([score, count]) => ({
        label: String(score),
        count,
        percent:
          totalAnswered > 0
            ? Number(((count / totalAnswered) * 100).toFixed(1))
            : 0,
      }));

      averageScore =
        totalAnswered > 0 ? Number((sum / totalAnswered).toFixed(2)) : null;

      npsScore =
        totalAnswered > 0
          ? Math.round(((promoters - detractors) / totalAnswered) * 100)
          : null;
    }

    // 6e. Text & Textarea (Differentiator 2: Top Keywords / Phrases)
    else if (["text", "textarea", "paragraph"].includes(q.type)) {
      const wordCounts = new Map<string, number>();

      validAnswers.forEach((a) => {
        if (typeof a.value === "string") {
          const cleaned = a.value
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/);

          cleaned.forEach((w) => {
            if (w.length > 2 && !STOP_WORDS.has(w)) {
              wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
            }
          });
        }
      });

      topWords = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
    }

    return {
      questionId: q.id,
      label: q.label || `Question ${q.position + 1}`,
      type: q.type,
      position: q.position,
      isRequired: q.isRequired,
      totalAnswered,
      totalSkipped,
      answerRate,
      distribution,
      averageScore,
      npsScore,
      topWords,
    };
  });

  // 7. Activity Heatmap (Differentiator 1: Day of Week × Hour of Day)
  // Grid of 7 days × 24 hours
  const heatmapMatrix: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0),
  );

  responses.forEach((r) => {
    const d = new Date(r.submittedAt);
    const dow = d.getDay(); // 0 = Sunday, 6 = Saturday
    const hr = d.getHours(); // 0..23
    heatmapMatrix[dow][hr] += 1;
  });

  const activityHeatmap: { dayOfWeek: number; hour: number; count: number }[] =
    [];
  let maxHeatCount = 0;

  for (let dow = 0; dow < 7; dow++) {
    for (let hr = 0; hr < 24; hr++) {
      const count = heatmapMatrix[dow][hr];
      if (count > maxHeatCount) maxHeatCount = count;
      activityHeatmap.push({ dayOfWeek: dow, hour: hr, count });
    }
  }

  return {
    form: {
      id: formRow.id,
      title: formRow.title,
      slug: formRow.slug,
      isPublished: formRow.isPublished,
      createdAt: formRow.createdAt,
    },
    summary: {
      totalViews,
      uniqueVisitors,
      totalStarts,
      totalSubmissions,
      completedSubmissions,
      partialSubmissions,
      engagementRate,
      completionRate,
      dropoffRate,
      visitToSubmissionRate,
      startToSubmissionRate,
      lastSubmissionAt,
    },
    viewsAndSubmissionsOverTime,
    funnel: funnelSteps,
    questionInsights,
    activityHeatmap: {
      data: activityHeatmap,
      maxCount: maxHeatCount,
    },
  };
};

// ---------------------------------------------------------------------------
// Organisation Forms Analytics Overview
// ---------------------------------------------------------------------------

export const getOrgFormsAnalyticsOverview = async (orgId: string) => {
  const forms = await analyticsRepo.findOrgFormsWithCounts(orgId);

  const overviewList = await Promise.all(
    forms.map(async (f) => {
      const [questions, views, sessions, responses, answers] = await Promise.all([
        analyticsRepo.findQuestionsByFormId(f.id),
        analyticsRepo.findFormViewsByFormId(f.id),
        analyticsRepo.findFormSessionsByFormId(f.id),
        analyticsRepo.findResponsesByFormId(f.id),
        analyticsRepo.findAnswersByFormId(f.id),
      ]);

      const answerableQuestions = questions.filter((q) => q.type !== "heading");
      const totalAnswerable = answerableQuestions.length;

      const answersByResponse = new Map<string, typeof answers>();
      answers.forEach((ans) => {
        const list = answersByResponse.get(ans.responseId) ?? [];
        list.push(ans);
        answersByResponse.set(ans.responseId, list);
      });

      let completedSubmissions = 0;
      let partialSubmissions = 0;
      responses.forEach((r) => {
        const rAnswers = answersByResponse.get(r.id) ?? [];
        let answeredCount = 0;
        for (const a of rAnswers) {
          if (isAnsweredValue(a.value)) answeredCount++;
        }
        if (totalAnswerable === 0 || answeredCount >= totalAnswerable) {
          completedSubmissions++;
        } else {
          partialSubmissions++;
        }
      });

      const totalSubmissions = responses.length;
      const totalStarts = Math.max(sessions.length, responses.length);
      const totalViews = Math.max(views.length, totalStarts);

      const conversionRate =
        totalViews > 0
          ? Math.min(100, Number(((completedSubmissions / totalViews) * 100).toFixed(1)))
          : 0;

      const completionRate =
        totalStarts > 0
          ? Math.min(100, Number(((completedSubmissions / totalStarts) * 100).toFixed(1)))
          : 0;

      const engagementRate =
        totalViews > 0
          ? Math.min(100, Number(((totalStarts / totalViews) * 100).toFixed(1)))
          : 0;

      const lastSubmissionAt =
        responses.length > 0
          ? new Date(responses[responses.length - 1].submittedAt).toISOString()
          : null;

      return {
        id: f.id,
        title: f.title,
        slug: f.slug,
        isPublished: f.isPublished,
        createdAt: f.createdAt,
        totalViews,
        totalStarts,
        totalSubmissions,
        completedSubmissions,
        partialSubmissions,
        conversionRate,
        completionRate,
        engagementRate,
        lastSubmissionAt,
      };
    }),
  );

  return overviewList;
};
