"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth.schema";

export function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    try {
      const { error } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message ?? "Sign up failed. Please try again.");
      } else {
        toast.success("Account created! Welcome to Convia.");
        router.push("/home");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form
      id="signup-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
    >
      <Field>
        <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
        <Input
          id="signup-name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          {...register("name")}
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
          className="h-10"
        />
        {errors.name?.message && (
          <FieldError>{errors.name.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="signup-email">Email</FieldLabel>
        <Input
          id="signup-email"
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
        <FieldLabel htmlFor="signup-password">Password</FieldLabel>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
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

      <Field>
        <FieldLabel htmlFor="signup-confirm-password">Confirm password</FieldLabel>
        <Input
          id="signup-confirm-password"
          type={showPassword ? "text" : "password"}
          placeholder="Repeat your password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          disabled={isSubmitting}
          aria-invalid={!!errors.confirmPassword}
          className="h-10"
        />
        {errors.confirmPassword?.message && (
          <FieldError>{errors.confirmPassword.message}</FieldError>
        )}
      </Field>

      <Button
        id="signup-submit-btn"
        type="submit"
        className="w-full h-10 font-medium cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
