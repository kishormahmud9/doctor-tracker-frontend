"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <main className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/30">
          DT
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Doctor Tracker</h1>
        <p className="mt-1 text-xs text-slate-400">Healthcare Management Portal</p>

        <div className="mt-6 flex flex-col items-center justify-center space-y-3">
          <div
            className="h-7 w-7 animate-spin rounded-full border-3 border-blue-500 border-t-transparent"
            role="status"
            aria-label="Checking authentication status"
          />
          <p className="text-xs text-slate-400">
            {isLoading ? "Checking authentication..." : "Redirecting..."}
          </p>
        </div>

        <noscript>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-block cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Go to Login
            </Link>
          </div>
        </noscript>
      </main>
    </div>
  );
}
