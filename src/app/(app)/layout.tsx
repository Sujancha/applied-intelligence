import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { BookOpen } from "lucide-react";
import type { Profile } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link
            href="/books"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-900"
          >
            <BookOpen size={16} className="text-zinc-500" />
            Applied Intelligence
          </Link>
          <div className="flex items-center gap-4">
            {profile && (
              <span className="text-sm text-zinc-500">{profile.display_name}</span>
            )}
            <Link
              href="/settings/profile"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {profile && <ProfileCompletionBanner profile={profile} />}

      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
