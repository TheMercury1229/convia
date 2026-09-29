"use client"

import * as React from "react"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AVATAR_PRESETS, getGlassAvatarDataUri, getGlassAvatarUrl } from "@/lib/dicebear"

interface OrgAvatarPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLogo?: string | null
  onSelectLogo: (logoUrl: string | null) => void
}

export function DicebearGlassPicker({
  open,
  onOpenChange,
  currentLogo,
  onSelectLogo,
}: OrgAvatarPickerProps) {
  const [selectedSeed, setSelectedSeed] = React.useState<string>(AVATAR_PRESETS[0].seed)

  React.useEffect(() => {
    if (open) {
      if (currentLogo && currentLogo.includes("seed=")) {
        try {
          const url = new URL(currentLogo)
          const seedParam = url.searchParams.get("seed")
          if (seedParam) {
            setSelectedSeed(seedParam)
            return
          }
        } catch {
          // ignore
        }
      }
      setSelectedSeed(AVATAR_PRESETS[0].seed)
    }
  }, [open, currentLogo])

  const handleConfirm = () => {
    const url = getGlassAvatarUrl(selectedSeed)
    onSelectLogo(url)
    onOpenChange(false)
  }

  const handleRemove = () => {
    onSelectLogo(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6 w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Choose Avatar</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select an avatar for your organisation.
          </DialogDescription>
        </DialogHeader>

        {/* Clean 6-option grid: 3 columns, 2 rows */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 py-3 sm:py-4">
          {AVATAR_PRESETS.map((preset) => {
            const uri = getGlassAvatarDataUri(preset.seed)
            const isSelected = selectedSeed.toLowerCase() === preset.seed.toLowerCase()

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedSeed(preset.seed)}
                className={`relative aspect-square rounded-xl p-2 border-2 transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
                }`}
              >
                <img
                  src={uri}
                  alt={preset.seed}
                  className="size-full rounded-lg object-cover"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          {currentLogo ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-xs text-muted-foreground hover:text-destructive h-9 px-2 w-full sm:w-auto"
            >
              Remove
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-sm h-9 flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="text-sm h-9 px-4 flex-1 sm:flex-initial"
            >
              Select
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
