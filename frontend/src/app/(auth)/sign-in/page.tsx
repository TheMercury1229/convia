import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { SocialAuth } from "@/components/auth/social-auth";
import { AuthDivider } from "@/components/auth/auth-divider";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In - Convia",
  description: "Sign in to your Convia account to continue building conversational forms",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const callbackUrl =
    typeof resolvedParams.callbackUrl === "string"
      ? resolvedParams.callbackUrl
      : null;
  const signUpHref = callbackUrl
    ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-up";

  return (
    <div className="w-full space-y-6">
      <AuthHeader
        title="Welcome back"
        description="Enter your credentials to access your account"
      />

      <SocialAuth />

      <AuthDivider />

      <SignInForm />

      <div className="text-center text-sm text-muted-foreground pt-1">
        Don&apos;t have an account?{" "}
        <Link
          href={signUpHref}
          className="text-primary font-semibold underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </div>
    </div>
  );
}
