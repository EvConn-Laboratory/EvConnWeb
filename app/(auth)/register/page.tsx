"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerGuestAction } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerGuestAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Create an Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register as a Guest Student
        </p>
      </div>

      {state && "error" in state && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            required
            disabled={pending}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            required
            disabled={pending}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={pending}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              disabled={pending}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          By registering, you agree to our{" "}
          <Link href="/about" className="text-primary hover:underline">
            terms and conditions
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create Account
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-3 rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Computer Engineering student?</span>{" "}
        Your account has been automatically created by an assistant. Use your NIM as
        your username and initial password.
      </p>
    </>
  );
}
