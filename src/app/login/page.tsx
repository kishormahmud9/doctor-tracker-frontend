"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    setErrorMessage(null);
    setFieldErrors({});

    const trimmedEmail = email.trim();
    const newFieldErrors: Record<string, string> = {};

    if (!trimmedEmail) {
      newFieldErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newFieldErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newFieldErrors.password = "Password is required";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: trimmedEmail, password });
      router.replace("/dashboard");
    } catch (err: unknown) {
      setIsSubmitting(false);

      if (err instanceof ApiClientError) {
        if (err.errors && err.errors.length > 0) {
          const apiFieldErrors: Record<string, string> = {};
          for (const item of err.errors) {
            apiFieldErrors[item.field] = item.message;
          }
          setFieldErrors(apiFieldErrors);
          setErrorMessage(err.message || "Validation failed. Please review the form fields.");
        } else if (err.isUnauthorized) {
          setErrorMessage("Invalid email or password. Please try again.");
        } else if (err.isNetworkError) {
          setErrorMessage("Unable to connect to the server. Please verify the backend is running.");
        } else {
          setErrorMessage(err.message || "An unexpected error occurred during login.");
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected authentication error occurred.");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
            role="status"
            aria-label="Checking session"
          />
          <p className="text-sm font-medium text-slate-400">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <main className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
        {/* Brand / Logo Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/30">
            DT
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Doctor Tracker
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Administrator Portal — Sign in to manage doctors and patients
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 leading-relaxed"
          >
            <div className="flex items-center space-x-2 font-semibold text-red-400">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <span>Authentication Error</span>
            </div>
            <p className="mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Admin Email
            </label>
            <div className="mt-1.5">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.email;
                      return updated;
                    });
                  }
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                placeholder="admin@example.com"
                className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                    : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p id="email-error" className="mt-1.5 text-xs text-red-400">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Password
            </label>
            <div className="mt-1.5">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.password;
                      return updated;
                    });
                  }
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                    : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-red-400">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span>Sign in to Dashboard</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="border-t border-slate-800/80 pt-4 text-center text-xs text-slate-500">
          Doctor Tracker Admin Authentication • JWT Session Protected
        </div>
      </main>
    </div>
  );
}
