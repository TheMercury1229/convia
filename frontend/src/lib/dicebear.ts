import { Avatar, Style, type StyleDefinition } from "@dicebear/core"
import glassJson from "@dicebear/styles/glass.json"

const glassStyle = new Style(glassJson as unknown as StyleDefinition)

/**
 * Returns a data:image/svg+xml URI generated client-side.
 */
export function getGlassAvatarDataUri(seed: string): string {
  try {
    const avatar = new Avatar(glassStyle, { seed })
    return avatar.toDataUri()
  } catch {
    return `https://api.dicebear.com/10.x/glass/svg?seed=${encodeURIComponent(seed)}`
  }
}

/**
 * Returns the image URL for saving to the organization logo.
 */
export function getGlassAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/glass/svg?seed=${encodeURIComponent(seed)}`
}

/**
 * 6 curated avatar presets.
 */
export const AVATAR_PRESETS = [
  { id: "preset-1", seed: "Aurora" },
  { id: "preset-2", seed: "Cosmos" },
  { id: "preset-3", seed: "Prism" },
  { id: "preset-4", seed: "Sol" },
  { id: "preset-5", seed: "Vortex" },
  { id: "preset-6", seed: "Horizon" },
] as const
