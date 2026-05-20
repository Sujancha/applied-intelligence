"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  loadingText,
  className,
}: {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      }
    >
      {pending ? (loadingText ?? "Saving…") : children}
    </button>
  );
}
