"use client";

import React, { useEffect } from "react";
import { CloseIcon } from "@/components/layout/NavIcons";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isDestructive?: boolean;
  errorMessage?: string | null;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isConfirming = false,
  onConfirm,
  onClose,
  isDestructive = true,
  errorMessage,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isConfirming) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isConfirming]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={() => !isConfirming && onClose()}
        aria-hidden="true"
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {isDestructive && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            )}
            <h3 id="confirm-dialog-title" className="text-base font-bold text-white">
              {title}
            </h3>
          </div>

          <button
            type="button"
            disabled={isConfirming}
            onClick={onClose}
            aria-label="Cancel and close dialog"
            className="cursor-pointer text-slate-400 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CloseIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">{message}</p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
          >
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            disabled={isConfirming}
            onClick={onClose}
            className="cursor-pointer disabled:cursor-not-allowed rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
            className={`flex cursor-pointer disabled:cursor-not-allowed items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-500 shadow-red-600/20"
                : "bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-500 shadow-blue-600/20"
            }`}
          >
            {isConfirming ? (
              <div className="flex items-center space-x-1.5">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
