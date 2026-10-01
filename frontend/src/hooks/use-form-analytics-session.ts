import * as React from "react";
import {
  getOrCreateSessionId,
  trackFormProgress,
  trackFormStart,
  trackFormView,
} from "@/lib/api/analytics";

interface UseFormAnalyticsSessionOptions {
  formId: string;
  isPreview: boolean;
  currentIndex: number;
  isWelcomeScreen: boolean;
  isCompleted: boolean;
}

export function useFormAnalyticsSession({
  formId,
  isPreview,
  currentIndex,
  isWelcomeScreen,
  isCompleted,
}: UseFormAnalyticsSessionOptions) {
  const sessionIdRef = React.useRef("");
  const hasStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (isPreview || typeof window === "undefined") return;

    const sessionId = getOrCreateSessionId(formId);
    sessionIdRef.current = sessionId;
    trackFormView(formId, sessionId);
  }, [formId, isPreview]);

  React.useEffect(() => {
    if (isPreview || isWelcomeScreen || !hasStartedRef.current) return;

    const sessionId = sessionIdRef.current || getOrCreateSessionId(formId);
    sessionIdRef.current = sessionId;
    trackFormProgress(formId, sessionId, currentIndex);
  }, [currentIndex, formId, isPreview, isWelcomeScreen]);

  React.useEffect(() => {
    if (isPreview || typeof window === "undefined") return;

    const handleUnload = () => {
      if (hasStartedRef.current && !isCompleted) {
        const sessionId = sessionIdRef.current || getOrCreateSessionId(formId);
        trackFormProgress(formId, sessionId, currentIndex);
      }
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentIndex, formId, isCompleted, isPreview]);

  const startSession = React.useCallback(() => {
    if (isPreview || hasStartedRef.current) return;

    hasStartedRef.current = true;
    const sessionId = sessionIdRef.current || getOrCreateSessionId(formId);
    sessionIdRef.current = sessionId;
    trackFormStart(formId, sessionId);
    trackFormProgress(formId, sessionId, 0);
  }, [formId, isPreview]);

  return { sessionIdRef, startSession };
}
