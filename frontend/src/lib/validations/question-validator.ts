import { z } from "zod";
import type { Question } from "@/types/builder";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a single question's answer against its type, required flag,
 * and any custom rules configured in question.validation.
 */
export function validateQuestionAnswer(
  question: Question,
  value: unknown
): ValidationResult {
  const { type, validation = {} } = question;

  // Display-only heading element never fails validation
  if (type === "heading") {
    return { isValid: true };
  }

  // Defensively resolve required flag across all possible naming conventions & shapes
  const isRequired = Boolean(
    question.required === true ||
    (question as any).required === 1 ||
    (question as any).required === "true" ||
    (question as any).isRequired === true ||
    (question as any).isRequired === 1 ||
    (question as any).isRequired === "true" ||
    (question.validation as any)?.required === true
  );

  // Filter out any DOM or React synthetic event objects accidentally passed as answers
  const isEvent = Boolean(
    value &&
    typeof value === "object" &&
    ("nativeEvent" in value || "preventDefault" in value || "_reactName" in value)
  );

  // Check emptiness
  const isEmpty =
    isEvent ||
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "number" && isNaN(value)) ||
    (typeof value === "object" &&
      !isEvent &&
      !(value instanceof File) &&
      !(value instanceof Date) &&
      Object.keys(value as object).length === 0);

  if (isRequired && isEmpty) {
    return {
      isValid: false,
      error: validation.customError || "This question is required.",
    };
  }

  // If optional and untouched/empty, it's valid
  if (!isRequired && isEmpty) {
    return { isValid: true };
  }

  const strVal = typeof value === "string" ? value.trim() : "";

  switch (type) {
    case "text":
    case "textarea":
    case "paragraph": {
      if (validation.minLength && strVal.length < validation.minLength) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Must be at least ${validation.minLength} character${
              validation.minLength > 1 ? "s" : ""
            }.`,
        };
      }
      if (validation.maxLength && strVal.length > validation.maxLength) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Must be at most ${validation.maxLength} character${
              validation.maxLength > 1 ? "s" : ""
            }.`,
        };
      }
      if (validation.minWords) {
        const words = strVal ? strVal.split(/\s+/).filter(Boolean).length : 0;
        if (words < validation.minWords) {
          return {
            isValid: false,
            error:
              validation.customError ||
              `Must contain at least ${validation.minWords} word${
                validation.minWords > 1 ? "s" : ""
              }.`,
          };
        }
      }
      if (validation.maxWords) {
        const words = strVal ? strVal.split(/\s+/).filter(Boolean).length : 0;
        if (words > validation.maxWords) {
          return {
            isValid: false,
            error:
              validation.customError ||
              `Must contain at most ${validation.maxWords} word${
                validation.maxWords > 1 ? "s" : ""
              }.`,
          };
        }
      }
      if (validation.pattern) {
        try {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(strVal)) {
            return {
              isValid: false,
              error:
                validation.customError ||
                "Answer does not match the required format.",
            };
          }
        } catch {
          // ignore invalid pattern from custom input
        }
      }
      return { isValid: true };
    }

    case "email": {
      const emailResult = z
        .string()
        .email("Please enter a valid email address.")
        .safeParse(strVal);

      if (!emailResult.success) {
        return {
          isValid: false,
          error:
            validation.customError ||
            emailResult.error.issues[0]?.message ||
            "Please enter a valid email address.",
        };
      }

      if (validation.disallowFreeEmails) {
        const freeDomains = [
          "gmail.com",
          "yahoo.com",
          "hotmail.com",
          "outlook.com",
          "aol.com",
          "icloud.com",
          "protonmail.com",
        ];
        const domain = strVal.split("@")[1]?.toLowerCase();
        if (domain && freeDomains.includes(domain)) {
          return {
            isValid: false,
            error:
              validation.customError ||
              "Please enter a company / work email. Free domains are not allowed.",
          };
        }
      }

      if (validation.allowedDomains) {
        const allowed = validation.allowedDomains
          .split(",")
          .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
          .filter(Boolean);
        const domain = strVal.split("@")[1]?.toLowerCase();
        if (allowed.length > 0 && domain && !allowed.includes(domain)) {
          return {
            isValid: false,
            error:
              validation.customError ||
              `Email domain must be one of: ${allowed.join(", ")}`,
          };
        }
      }
      return { isValid: true };
    }

    case "phone": {
      // General phone validation allowing optional country code and delimiters
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
      if (!phoneRegex.test(strVal)) {
        return {
          isValid: false,
          error:
            validation.customError ||
            "Please enter a valid phone number (e.g. +1 555-0199).",
        };
      }
      return { isValid: true };
    }

    case "url": {
      const urlResult = z
        .string()
        .url("Please enter a valid URL (e.g. https://example.com).")
        .safeParse(strVal);

      if (!urlResult.success) {
        return {
          isValid: false,
          error:
            validation.customError ||
            urlResult.error.issues[0]?.message ||
            "Please enter a valid URL.",
        };
      }

      if (validation.requireHttps && !strVal.startsWith("https://")) {
        return {
          isValid: false,
          error: validation.customError || "URL must start with https://",
        };
      }

      if (validation.allowedUrlDomains) {
        try {
          const parsed = new URL(strVal);
          const allowed = validation.allowedUrlDomains
            .split(",")
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean);
          if (
            allowed.length > 0 &&
            !allowed.some((d) => parsed.hostname.toLowerCase().includes(d))
          ) {
            return {
              isValid: false,
              error:
                validation.customError ||
                `Website domain must be one of: ${allowed.join(", ")}`,
            };
          }
        } catch {
          return { isValid: false, error: "Invalid URL." };
        }
      }
      return { isValid: true };
    }

    case "number": {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          isValid: false,
          error: validation.customError || "Please enter a valid number.",
        };
      }
      if (validation.integerOnly && !Number.isInteger(num)) {
        return {
          isValid: false,
          error: validation.customError || "Value must be a whole integer.",
        };
      }
      if (validation.min !== undefined && num < validation.min) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Value must be at least ${validation.min}.`,
        };
      }
      if (validation.max !== undefined && num > validation.max) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Value must be at most ${validation.max}.`,
        };
      }
      return { isValid: true };
    }

    case "date":
    case "datetime": {
      const dateVal = new Date(strVal);
      if (isNaN(dateVal.getTime())) {
        return { isValid: false, error: "Please select a valid date." };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (validation.disablePastDates && dateVal < today) {
        return {
          isValid: false,
          error: validation.customError || "Past dates are not allowed.",
        };
      }
      if (validation.disableFutureDates && dateVal > today) {
        return {
          isValid: false,
          error: validation.customError || "Future dates are not allowed.",
        };
      }
      if (validation.minDate && dateVal < new Date(validation.minDate)) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Date must be on or after ${validation.minDate}.`,
        };
      }
      if (validation.maxDate && dateVal > new Date(validation.maxDate)) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Date must be on or before ${validation.maxDate}.`,
        };
      }
      return { isValid: true };
    }

    case "time": {
      if (!strVal) {
        return { isValid: false, error: "Please enter a time." };
      }
      return { isValid: true };
    }

    case "select":
    case "radio": {
      if (isRequired && (!strVal || isEmpty)) {
        return {
          isValid: false,
          error: validation.customError || "Please select an option.",
        };
      }
      return { isValid: true };
    }

    case "multi_select":
    case "checkbox": {
      const arr = Array.isArray(value) ? value : [];
      if (isRequired && (isEmpty || arr.length === 0)) {
        return {
          isValid: false,
          error: validation.customError || "Please select at least one option.",
        };
      }
      if (validation.minSelections && arr.length < validation.minSelections) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Please select at least ${validation.minSelections} option${
              validation.minSelections > 1 ? "s" : ""
            }.`,
        };
      }
      if (validation.maxSelections && arr.length > validation.maxSelections) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Please select at most ${validation.maxSelections} option${
              validation.maxSelections > 1 ? "s" : ""
            }.`,
        };
      }
      if (
        validation.exactSelections &&
        arr.length !== validation.exactSelections
      ) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Please select exactly ${validation.exactSelections} option${
              validation.exactSelections > 1 ? "s" : ""
            }.`,
        };
      }
      return { isValid: true };
    }

    case "rating": {
      const num = Number(value);
      if (isRequired && (isEmpty || value === undefined || value === null || isNaN(num) || num <= 0)) {
        return {
          isValid: false,
          error: validation.customError || "Please provide a rating.",
        };
      }
      if (validation.minRating && num < validation.minRating) {
        return {
          isValid: false,
          error:
            validation.customError ||
            `Rating must be at least ${validation.minRating}.`,
        };
      }
      return { isValid: true };
    }

    case "scale": {
      const num = Number(value);
      if (isRequired && (isEmpty || value === undefined || value === null || value === "" || isNaN(num))) {
        return {
          isValid: false,
          error: validation.customError || "Please select a value on the scale.",
        };
      }
      return { isValid: true };
    }

    case "yes_no": {
      if (isRequired && (!strVal || isEmpty)) {
        return {
          isValid: false,
          error: validation.customError || "Please select Yes or No.",
        };
      }
      if (validation.mustBeYes && strVal !== "yes") {
        return {
          isValid: false,
          error:
            validation.customError || "You must select Yes to proceed.",
        };
      }
      return { isValid: true };
    }

    case "file": {
      if (isRequired && (isEmpty || !value)) {
        return {
          isValid: false,
          error: validation.customError || "Please upload a file.",
        };
      }
      return { isValid: true };
    }

    default:
      return { isValid: true };
  }
}
