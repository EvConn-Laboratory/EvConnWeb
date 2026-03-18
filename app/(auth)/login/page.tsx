"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Loader2, Eye, EyeOff, LogIn, CheckCircle2 } from "lucide-react";
import { loginAction } from "@/lib/auth/actions";

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Welcome Back
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to access the platform
        </p>
      </div>

      {registered && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/8 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
          <p className="text-sm text-green-400">
            Account created successfully — please sign in.
          </p>
        </div>
      )}

      {state && "error" in state && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="text-sm font-medium text-foreground"
          >
            Username / NIM
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your NIM or username"
            autoComplete="username"
            autoFocus
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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={pending}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="relative my-5 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="mx-3 text-xs text-muted-foreground">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Register as Guest
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Computer Engineering student? Use your{" "}
        <span className="font-medium text-foreground">NIM</span> as your
        username and initial password.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}
    >
      <LoginForm />
    </Suspense>
  );
}
