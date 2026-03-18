"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Loader2, Eye, EyeOff, ShieldCheck, KeyRound, Check } from "lucide-react";
import { changePasswordAction } from "@/lib/auth/actions";

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;

  const color =
    score <= 1
      ? "bg-destructive"
      : score === 2
        ? "bg-amber-500"
        : score === 3
          ? "bg-blue-500"
          : "bg-green-500";

  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? color : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength:{" "}
        <span
          className={
            score <= 1
              ? "text-destructive"
              : score === 2
                ? "text-amber-400"
                : score === 3
                  ? "text-blue-400"
                  : "text-green-400"
          }
        >
          {label}
        </span>
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div
            key={c.label}
            className={`flex items-center gap-1 text-xs ${
              c.pass ? "text-green-400" : "text-muted-foreground"
            }`}
          >
            <Check
              className={`h-3 w-3 shrink-0 ${c.pass ? "opacity-100" : "opacity-30"}`}
            />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Set a New Password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your default password
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/8 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <p className="text-xs text-blue-300">
          Your default password is your NIM. Please set a new password now
          to secure your account.
        </p>
      </div>

      {state && "error" in state && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              disabled={pending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <PasswordStrength password={password} />
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
              placeholder="Repeat your new password"
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

        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Save New Password
            </>
          )}
        </button>
      </form>
    </>
  );
}
