"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Type } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";

type Mode = "text" | "image";

export function ExtractForm({
  bookId,
  bookTitle,
  bookAuthor,
  defaultLanguage,
  action,
}: {
  bookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  defaultLanguage: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("text");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleModeSwitch(next: Mode) {
    setMode(next);
    if (next === "text") {
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none resize-y";

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/books/${bookId}`}
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Extract insight
          </h1>
          <p className="text-sm text-zinc-500">
            {bookTitle}
            {bookAuthor ? ` — ${bookAuthor}` : ""}
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex w-fit gap-1 rounded-lg border border-zinc-200 p-1">
        {(
          [
            { value: "text", icon: <Type size={14} />, label: "Paste text" },
            {
              value: "image",
              icon: <ImageIcon size={14} />,
              label: "Upload image",
            },
          ] as { value: Mode; icon: React.ReactNode; label: string }[]
        ).map(({ value, icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleModeSwitch(value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === value
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <form action={action} className="space-y-5">
        {/* Hidden source type */}
        <input type="hidden" name="source_type" value={mode} />

        {/* Text mode */}
        {mode === "text" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700" htmlFor="passage-text">
              Paste the passage <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-zinc-400">
              A sentence, paragraph, or any chunk of text you want to unpack.
            </p>
            <textarea
              id="passage-text"
              name="passage"
              required
              rows={8}
              placeholder="Paste the text from the book here…"
              className={inputClass}
            />
          </div>
        )}

        {/* Image mode */}
        {mode === "image" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700" htmlFor="image">
                Upload book page image <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-zinc-400">
                JPG, PNG or WEBP. Claude will extract the text, then analyse it.
              </p>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                ref={fileInputRef}
                onChange={handleImageChange}
                className="w-full text-sm text-zinc-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
              />
            </div>

            {preview && (
              <img
                src={preview}
                alt="Selected page preview"
                className="max-h-64 rounded-lg border border-zinc-200 object-contain"
              />
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700" htmlFor="passage-context">
                Additional context{" "}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="passage-context"
                name="passage"
                rows={3}
                placeholder="e.g. This is from chapter 4, about habit formation…"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Reaction note — always visible */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700" htmlFor="reaction_note">
            Why did this hit you?{" "}
            <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-zinc-400">
            Your reaction helps Claude personalise the insight to your situation.
          </p>
          <textarea
            id="reaction_note"
            name="reaction_note"
            rows={3}
            placeholder="e.g. This made me think of how I price my photography jobs…"
            className={inputClass}
          />
        </div>

        {/* Language override */}
        <fieldset className="space-y-2.5">
          <legend className="text-sm font-medium text-zinc-700">
            Output language
          </legend>
          {(
            [
              { value: "English", label: "English" },
              { value: "Nepali", label: "Nepali" },
              { value: "Both", label: "Both" },
            ] as { value: string; label: string }[]
          ).map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="output_language"
                value={value}
                defaultChecked={value === defaultLanguage}
                className="accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </fieldset>

        <SubmitButton loadingText="Extracting insight…">
          Extract insight
        </SubmitButton>
      </form>
    </div>
  );
}
