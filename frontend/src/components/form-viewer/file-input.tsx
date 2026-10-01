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
          className="flex items-center justify-between rounded-xl border p-3.5 shadow-xs sm:p-4"
          style={{
            backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 8%, transparent)`,
            borderColor: theme.colors.primary,
          }}
        >
          <div className="mr-3 flex items-center gap-3 truncate">
            <FileIcon className="size-5 shrink-0" style={{ color: theme.colors.primary }} />
            <span className="truncate text-sm font-medium" style={{ color: theme.colors.cardText }}>
              {fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: theme.colors.cardMuted }}
            aria-label="Remove uploaded file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={`file-upload-${question.id}`}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all duration-150 hover:bg-black/2 dark:hover:bg-white/2"
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
          }}
        >
          <Upload className="mb-2 size-6 opacity-70" style={{ color: theme.colors.primary }} />
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
        <p className="mt-2 text-xs text-destructive" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
