import { SubmitButton } from "@/components/SubmitButton";
import { addBook } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewBookPage() {
  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/books"
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Add a book</h1>
      </div>

      <form action={addBook} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. Atomic Habits"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="author">
            Author
          </label>
          <input
            id="author"
            name="author"
            placeholder="e.g. James Clear"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="genre">
            Genre
          </label>
          <input
            id="genre"
            name="genre"
            placeholder="e.g. self-help"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="reading"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
          >
            <option value="reading">Currently reading</option>
            <option value="finished">Finished</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        <div className="pt-2">
          <SubmitButton loadingText="Adding…">Add book</SubmitButton>
        </div>
      </form>
    </div>
  );
}
