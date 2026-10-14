"use client"

import * as React from "react"
import { authClient } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { X, Loader2 } from "lucide-react"

interface InviteMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  isOwner?: boolean
  onSuccess?: () => void
}

type Role = "owner" | "editor" | "viewer"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function InviteMembersDialog({
  open,
  onOpenChange,
  organizationId,
  isOwner = false,
  onSuccess,
}: InviteMembersDialogProps) {
  const [emails, setEmails] = React.useState<string[]>([])
  const [textValue, setTextValue] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState<Role>("viewer")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset state on close
  React.useEffect(() => {
    if (!open) {
      setEmails([])
      setTextValue("")
      setSelectedRole("viewer")
      setIsSubmitting(false)
    }
  }, [open])

  // Extract valid emails from text and add as capsules
  const processInputText = (text: string, forceAll = false) => {
    // If not forcing all tokens, check if delimiter exists
    if (!forceAll && !text.includes(",") && !text.includes("\n")) {
      setTextValue(text)
      return
    }

    const tokens = text.split(/[\r\n,]+/)
    const validToAdd: string[] = []
    let leftover = ""

    tokens.forEach((token, index) => {
      const trimmed = token.trim()
      const isLast = index === tokens.length - 1

      // If it's the last token and we are typing (not ending with comma/newline), keep in textarea
      if (isLast && !forceAll && !text.endsWith(",") && !text.endsWith("\n")) {
        leftover = token
        return
      }

      if (trimmed) {
        if (EMAIL_REGEX.test(trimmed)) {
          if (!emails.includes(trimmed) && !validToAdd.includes(trimmed)) {
            validToAdd.push(trimmed)
          }
        } else if (forceAll) {
          toast.error(`"${trimmed}" is not a valid email address`)
          leftover = trimmed
        }
      }
    })

    if (validToAdd.length > 0) {
      setEmails((prev) => [...prev, ...validToAdd])
    }
    setTextValue(leftover)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (textValue.trim()) {
        processInputText(textValue + ",", true)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    if (pasted) {
      const combined = textValue ? `${textValue}\n${pasted}` : pasted
      processInputText(combined, true)
    }
  }

  const handleBlur = () => {
    if (textValue.trim()) {
      processInputText(textValue, true)
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails((prev) => prev.filter((e) => e !== emailToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const allEmails = [...emails]
    if (textValue.trim()) {
      const trimmed = textValue.trim()
      if (EMAIL_REGEX.test(trimmed)) {
        if (!allEmails.includes(trimmed)) {
          allEmails.push(trimmed)
          setEmails((prev) => [...prev, trimmed])
          setTextValue("")
        }
      } else {
        toast.error(`"${trimmed}" is not a valid email address`)
        return
      }
    }

    if (allEmails.length === 0) {
      toast.error("Please add at least one email address")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(
      `Sending ${allEmails.length} invitation${allEmails.length > 1 ? "s" : ""}...`
    )

    try {
      const results = await Promise.allSettled(
        allEmails.map((email) =>
          authClient.organization.inviteMember({
            email,
            role: selectedRole,
            organizationId,
          })
        )
      )

      let successCount = 0
      const errors: string[] = []

      results.forEach((res, index) => {
        const targetEmail = allEmails[index]
        if (res.status === "fulfilled") {
          const data = res.value
          if (data?.error) {
            errors.push(`${targetEmail}: ${data.error.message || "Failed"}`)
          } else {
            successCount++
          }
        } else {
          errors.push(`${targetEmail}: ${res.reason?.message || "Failed"}`)
        }
      })

      if (successCount > 0 && errors.length === 0) {
        toast.success(
          successCount === 1
            ? "Invitation sent successfully!"
            : `All ${successCount} invitations sent successfully!`,
          { id: toastId }
        )
        onOpenChange(false)
        onSuccess?.()
      } else if (successCount > 0 && errors.length > 0) {
        toast.warning(
          `Sent ${successCount} invitation${successCount > 1 ? "s" : ""}, ${errors.length} failed.`,
          {
            id: toastId,
            description: errors.slice(0, 3).join("; "),
          }
        )
        const failedEmails = allEmails.filter(
          (_, idx) =>
            results[idx].status === "rejected" ||
            (results[idx] as any).value?.error
        )
        setEmails(failedEmails)
        onSuccess?.()
      } else {
        toast.error("Failed to send invitations", {
          id: toastId,
          description: errors.slice(0, 3).join("; "),
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite members"
      toast.error(message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6 w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Invite Members</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Invite colleagues to join your organisation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Email Textarea */}
          <div className="space-y-2">
            <Label htmlFor="email-textarea" className="text-sm font-medium">
              Email Addresses
            </Label>
            <Textarea
              id="email-textarea"
              rows={3}
              placeholder="alex@company.com, sarah@company.com"
              value={textValue}
              onChange={(e) => processInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className="resize-none text-sm"
            />

            {/* Email Capsules */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                {emails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1 py-1 px-2.5 text-xs font-normal"
                  >
                    <span className="truncate max-w-[200px]">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-muted-foreground hover:text-foreground rounded-full ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Role - aligned in same line */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <Label htmlFor="role-select" className="text-sm font-medium">
              Assigned Role
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as Role)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role-select" className="w-32 sm:w-36 h-9 text-sm">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                {isOwner && <SelectItem value="owner">Owner</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-sm h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (emails.length === 0 && !textValue.trim())}
              className="w-full sm:w-auto text-sm h-10 gap-2 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send Invitation${emails.length > 1 ? `s (${emails.length})` : ""}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
