import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { SocialAuth } from "@/components/auth/social-auth";
import { AuthDivider } from "@/components/auth/auth-divider";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create an Account - Convia",
  description: "Start building intelligent conversational forms with Convia today",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const callbackUrl =
    typeof resolvedParams.callbackUrl === "string"
      ? resolvedParams.callbackUrl
      : null;
  const signInHref = callbackUrl
    ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-in";

  return (
    <div className="w-full space-y-6">
      <AuthHeader
        title="Create an account"
        description="Start building intelligent conversational forms today"
      />

      <SocialAuth />

      <AuthDivider />

      <SignUpForm />

      <div className="text-center text-sm text-muted-foreground pt-1">
        Already have an account?{" "}
        <Link
          href={signInHref}
          className="text-primary font-semibold underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
