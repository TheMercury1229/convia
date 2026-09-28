"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { signInSchema, type SignInInput } from "@/lib/validations/auth.schema";

export function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message ?? "Sign in failed. Please check your credentials.");
      } else {
        const callbackUrl =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("callbackUrl") || "/home"
            : "/home";
        router.push(callbackUrl);
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form
      id="signin-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
    >
      <Field>
        <FieldLabel htmlFor="signin-email">Email</FieldLabel>
        <Input
          id="signin-email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          {...register("email")}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          className="h-10"
        />
        {errors.email?.message && (
          <FieldError>{errors.email.message}</FieldError>
        )}
      </Field>

      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="signin-password">Password</FieldLabel>
        </div>
        <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            className="pr-10 h-10"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password?.message && (
          <FieldError>{errors.password.message}</FieldError>
        )}
      </Field>

      <Button
        id="signin-submit-btn"
        type="submit"
        className="w-full h-10 font-medium cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
