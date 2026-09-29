import { getUploadAuthParams } from "@imagekit/next/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY

    if (!privateKey || !publicKey) {
      return NextResponse.json(
        {
          error:
            "Missing ImageKit credentials. Please ensure IMAGEKIT_PRIVATE_KEY and NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY are set.",
        },
        { status: 500 }
      )
    }

    const { token, expire, signature } = getUploadAuthParams({
      privateKey,
      publicKey,
    })

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
    })
  } catch (error) {
    console.error("Error generating ImageKit upload credentials:", error)
    return NextResponse.json(
      { error: "Failed to generate upload authentication parameters." },
      { status: 500 }
    )
  }
}
