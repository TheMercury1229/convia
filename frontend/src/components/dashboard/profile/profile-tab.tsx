"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { uploadToImageKit } from "@/lib/imagekit"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Camera, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react"

export function ProfileTab() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const user = session?.user

  // Profile form state
  const [name, setName] = React.useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false)

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)

  // Password form state
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [revokeOthers, setRevokeOthers] = React.useState(true)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [showDeletePassword, setShowDeletePassword] = React.useState(false)

  // Delete account state
  const [deletePassword, setDeletePassword] = React.useState("")
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)


  // Sync user info into state
  React.useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }
  }, [user?.name])

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "U"

  // Handle avatar upload to ImageKit & update profile via authClient
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be under 5MB")
      return
    }

    setIsUploadingAvatar(true)
    const toastId = toast.loading("Uploading avatar to ImageKit...")

    try {
      // 1. Direct upload to ImageKit
      const uploadResult = await uploadToImageKit({
        file,
        folder: "/avatars",
        useUniqueFileName: true,
      })

      // 2. Update profile with new avatar URL via Better Auth
      const { error } = await authClient.updateUser({
        image: uploadResult.url,
      })

      if (error) {
        throw new Error(error.message || "Failed to update profile photo")
      }

      toast.success("Profile photo updated!", { id: toastId })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload avatar"
      toast.error(message, { id: toastId })
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ""
      }
    }
  }

  // Handle Name update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    setIsUpdatingProfile(true)
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
      })

      if (error) {
        throw new Error(error.message || "Failed to update profile")
      }

      toast.success("Profile updated successfully")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile"
      toast.error(message)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle Password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error("Please enter your current password")
      return
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOthers,
      })

      if (error) {
        throw new Error(error.message || "Failed to change password")
      }

      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password"
      toast.error(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle Account deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      const { error } = await authClient.deleteUser({
        password: deletePassword || undefined,
      })

      if (error) {
        throw new Error(error.message || "Failed to delete account")
      }

      toast.success("Your account has been deleted")
      await authClient.signOut()
      router.push("/sign-in")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete account"
      toast.error(message)
    } finally {
      setIsDeletingAccount(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (isSessionLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* SECTION 1: Personal Information */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update your public name and profile picture.
          </p>
        </div>

        {/* Avatar Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="relative group/avatar shrink-0">
            <Avatar className="size-20 border border-border shadow-xs">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="text-lg font-medium bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              title="Change avatar"
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Camera className="size-5" />
              )}
            </button>
          </div>

          <div className="space-y-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="w-full sm:w-auto"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Uploading...
                </>
              ) : (
                "Change photo"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WebP. Max 5MB.
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="max-w-xl space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-sm font-medium">Full Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-email" className="text-sm font-medium">Email Address</Label>
            <Input
              id="profile-email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email addresses are linked to your login credentials.
            </p>
          </div>

          <div className="pt-1">
            <Button type="submit" size="default" disabled={isUpdatingProfile} className="w-full sm:w-auto">
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* SECTION 2: Password & Security */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Password & Security</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="max-w-xl space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm focus:outline-none"
                tabIndex={-1}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm focus:outline-none"
                tabIndex={-1}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm focus:outline-none"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="revoke-others"
              checked={revokeOthers}
              onCheckedChange={(checked) => setRevokeOthers(Boolean(checked))}
            />
            <Label htmlFor="revoke-others" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Log out of all other devices after changing password
            </Label>
          </div>

          <div className="pt-2">
            <Button type="submit" size="default" disabled={isChangingPassword} className="w-full sm:w-auto">
              {isChangingPassword ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* SECTION 3: Danger Zone */}
      <section className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Permanently delete your account and all associated resources. This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5">
          <div className="space-y-0.5 min-w-0">
            <p className="text-base font-medium text-foreground">Delete Account</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Once deleted, your account and all related data will be wiped permanently.
            </p>
          </div>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full sm:w-auto shrink-0">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="size-5 shrink-0" />
                  Delete Account Confirmation
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-1.5 text-left pt-2">
                <Label htmlFor="confirm-delete-pw" className="text-sm text-foreground font-medium">
                  Confirm your password to proceed (optional if signed in via Google):
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-delete-pw"
                    type={showDeletePassword ? "text" : "password"}
                    placeholder="Your current password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm focus:outline-none"
                    tabIndex={-1}
                    aria-label={showDeletePassword ? "Hide password" : "Show password"}
                  >
                    {showDeletePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <AlertDialogFooter className="pt-2 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                <AlertDialogCancel disabled={isDeletingAccount} className="w-full sm:w-auto">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isDeletingAccount}
                  className="w-full sm:w-auto"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteAccount()
                  }}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, delete my account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>


    </div>
  )
}
