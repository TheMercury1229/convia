"use client"

import * as React from "react"
import { uploadToImageKit, type UploadResponse, type ClientUploadOptions } from "@/lib/imagekit"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { UploadCloud, X, Loader2, CheckCircle2, FileImage } from "lucide-react"

export interface IKUploadProps {
  folder?: string
  tags?: string[] | string
  accept?: string
  maxSizeMB?: number
  useUniqueFileName?: boolean
  className?: string
  label?: string
  description?: string
  onSuccess?: (response: UploadResponse) => void
  onError?: (error: Error) => void
  onProgressChange?: (progress: number) => void
}

export function IKUpload({
  folder = "/uploads",
  tags,
  accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
  maxSizeMB = 10,
  useUniqueFileName = true,
  className,
  label = "Upload image",
  description = "Drag & drop your image here, or click to browse",
  onSuccess,
  onError,
  onProgressChange,
}: IKUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [dragActive, setDragActive] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [uploadedResult, setUploadedResult] = React.useState<UploadResponse | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files (PNG, JPG, WebP, GIF, SVG) are allowed")
      return false
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`Image size exceeds maximum limit of ${maxSizeMB}MB`)
      return false
    }
    return true
  }


  const startUpload = async (file: File) => {
    if (!validateFile(file)) return

    // Show local preview if image
    if (file.type.startsWith("image/")) {
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
    } else {
      setPreviewUrl(null)
    }

    setIsUploading(true)
    setProgress(0)
    setUploadedResult(null)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const uploadOptions: ClientUploadOptions = {
        file,
        fileName: file.name,
        folder,
        tags,
        useUniqueFileName,
        abortSignal: abortController.signal,
        onProgress: (event) => {
          if (event.total > 0) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setProgress(percent)
            onProgressChange?.(percent)
          }
        },
      }

      const response = await uploadToImageKit(uploadOptions)
      setUploadedResult(response)
      toast.success("File uploaded successfully!")
      onSuccess?.(response)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Upload failed")
      if (error.name === "ImageKitAbortError" || error.message.includes("aborted")) {
        toast.info("Upload cancelled")
      } else {
        console.error("Upload error:", error)
        toast.error(error.message || "Failed to upload file")
        onError?.(error)
      }
    } finally {
      setIsUploading(false)
      abortControllerRef.current = null
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      startUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startUpload(e.target.files[0])
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleReset = () => {
    setPreviewUrl(null)
    setUploadedResult(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer text-center",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/40",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        {previewUrl ? (
          <div className="relative mb-3 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Upload preview"
              className="h-32 w-32 rounded-lg object-cover shadow-sm border border-border"
            />
            {uploadedResult && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow">
                <CheckCircle2 className="size-4" />
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
            {isUploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : uploadedResult ? (
              <CheckCircle2 className="size-6 text-green-500" />
            ) : (
              <UploadCloud className="size-6" />
            )}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <p className="text-[11px] text-muted-foreground/70">
            Max size: {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* Progress & Cancel/Reset Controls */}
      {isUploading && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Uploading...
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                handleCancel()
              }}
            >
              <X className="size-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Uploaded state indicator */}
      {uploadedResult && !isUploading && (
        <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-xs">
          <div className="flex items-center gap-2 truncate text-green-700 dark:text-green-300">
            <FileImage className="size-4 shrink-0" />
            <span className="truncate font-medium">{uploadedResult.name}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}
