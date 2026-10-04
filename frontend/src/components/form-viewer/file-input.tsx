"use client";

import * as React from "react";
import { FileIcon, Upload, X } from "lucide-react";
import type { Question } from "@/types/builder";
import type { FormThemeResolved } from "@/lib/builder-themes";
import { uploadToImageKit } from "@/lib/imagekit";

interface FileInputProps {
  question: Question;
  theme: FormThemeResolved;
  value: unknown;
  onChange: (value: unknown) => void;
  isDark?: boolean;
}

export function FileInput({
  question,
  theme,
  value,
  onChange,
  isDark = false,
}: FileInputProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileUrl = typeof value === "string" ? value : "";
  const fileName = fileUrl.split("/").pop() || fileUrl;
  const maxSizeMb = question.validation?.maxFileSizeMB ?? 10;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setUploadError(`File must be smaller than ${maxSizeMb}MB.`);
      event.target.value = "";
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      const upload = await uploadToImageKit({
        file,
        fileName: file.name,
        folder: "/convia/form-responses",
        useUniqueFileName: true,
      });
      onChange(upload.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "File upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="w-full max-w-md">
      {fileUrl ? (
        <div
          className="flex items-center justify-between rounded-xl border p-4 shadow-2xs transition-all animate-in fade-in"
          style={{
            backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 10%, ${theme.colors.cardInputBg})`,
            borderColor: theme.colors.cardBorderSelected || theme.colors.primary,
            boxShadow: `0 0 0 1px color-mix(in oklch, ${theme.colors.primary} 30%, transparent)`,
          }}
        >
          <div className="mr-3 flex items-center gap-3 truncate">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 15%, transparent)`,
              }}
            >
              <FileIcon className="size-5 shrink-0" style={{ color: theme.colors.primary }} />
            </div>
            <span
              className="truncate text-sm font-semibold"
              style={{ color: theme.colors.cardText }}
            >
              {fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 transition-colors hover:opacity-80"
            style={{
              color: theme.colors.cardMuted,
              backgroundColor: "transparent",
            }}
            aria-label="Remove uploaded file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={`file-upload-${question.id}`}
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-7 text-center transition-all duration-200"
          style={{
            backgroundColor: theme.colors.cardInputBg,
            borderColor: theme.colors.cardInputBorder,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.cardBorderSelected || theme.colors.primary;
            e.currentTarget.style.backgroundColor = `color-mix(in oklch, ${theme.colors.primary} 6%, ${theme.colors.cardInputBg})`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.cardInputBorder;
            e.currentTarget.style.backgroundColor = theme.colors.cardInputBg;
          }}
        >
          <div
            className="mb-3 flex size-12 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105"
            style={{
              backgroundColor: theme.colors.badgeBg,
              borderColor: theme.colors.cardInputBorder,
            }}
          >
            <Upload className="size-6 transition-colors" style={{ color: theme.colors.primary }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: theme.colors.cardText }}>
            {isUploading ? "Uploading file..." : "Click to choose a file or drag & drop"}
          </p>
          <p className="mt-1 text-xs" style={{ color: theme.colors.cardMuted }}>
            {question.validation?.allowedExtensions
              ? `Supported: ${question.validation.allowedExtensions}`
              : `PDF, DOC, PNG, JPG up to ${maxSizeMb}MB`}
          </p>
          <input
            id={`file-upload-${question.id}`}
            type="file"
            className="sr-only"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>
      )}
      {uploadError && (
        <p className="mt-2 text-xs font-medium text-destructive" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
