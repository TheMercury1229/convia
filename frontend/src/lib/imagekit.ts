import {
  upload,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  buildSrc,
  buildTransformationString,
  type UploadOptions,
  type UploadResponse,
  type Transformation,
} from "@imagekit/next"

export interface UploadAuthParams {
  signature: string
  expire: number
  token: string
  publicKey: string
}

/**
 * Fetch one-time authentication parameters from the server API route (/api/upload-auth)
 */
export async function fetchUploadAuth(): Promise<UploadAuthParams> {
  const response = await fetch("/api/upload-auth", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upload authentication failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return {
    signature: data.signature,
    expire: data.expire,
    token: data.token,
    publicKey: data.publicKey,
  }
}

export interface ClientUploadOptions {
  file: File | Blob | string
  fileName?: string
  folder?: string
  tags?: string[] | string
  useUniqueFileName?: boolean
  isPrivateFile?: boolean
  customCoordinates?: string
  responseFields?: UploadOptions["responseFields"]
  transformation?: UploadOptions["transformation"]
  onProgress?: (event: { loaded: number; total: number }) => void
  abortSignal?: AbortSignal
}

/**
 * Upload a file directly to ImageKit from the browser with progress tracking and error handling
 */
export async function uploadToImageKit(
  options: ClientUploadOptions
): Promise<UploadResponse> {
  const {
    file,
    fileName = file instanceof File ? file.name : `upload_${Date.now()}`,
    folder,
    tags,
    useUniqueFileName = true,
    isPrivateFile = false,
    customCoordinates,
    responseFields,
    transformation,
    onProgress,
    abortSignal,
  } = options

  const auth = await fetchUploadAuth()

  const formattedTags: string[] | undefined = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
    ? tags.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined

  try {
    const response = await upload({
      file,
      fileName,
      token: auth.token,
      expire: auth.expire,
      signature: auth.signature,
      publicKey: auth.publicKey,
      folder,
      tags: formattedTags,
      useUniqueFileName,
      isPrivateFile,
      customCoordinates,
      responseFields,
      transformation,
      onProgress,
      abortSignal,
    })

    return response

  } catch (error) {
    if (error instanceof ImageKitAbortError) {
      console.warn("Upload aborted:", error.reason)
      throw error
    } else if (error instanceof ImageKitInvalidRequestError) {
      console.error("Invalid ImageKit request:", error.message)
      throw new Error(`Invalid upload request: ${error.message}`)
    } else if (error instanceof ImageKitUploadNetworkError) {
      console.error("Network error during upload:", error.message)
      throw new Error(`Network error during upload: ${error.message}`)
    } else if (error instanceof ImageKitServerError) {
      console.error("ImageKit server error:", error.message)
      throw new Error(`ImageKit server error: ${error.message}`)
    }

    throw error
  }
}

export {
  buildSrc,
  buildTransformationString,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
}
export type { UploadResponse, Transformation }
