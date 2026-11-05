import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { buttonClass } from "./ui";

function WhatsNewLink() {
  return (
    <Link href="/whats-new" className={`${buttonClass("ghost", "sm")} whitespace-nowrap`}>
      What&apos;s new
      <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
    </Link>
  );
}

export async function SiteNav() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <nav className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-2">
        <WhatsNewLink />
        <Link href="/login" className={`${buttonClass("ghost", "sm")} whitespace-nowrap`}>Log in</Link>
        <Link href="/signup" className={`${buttonClass("primary", "sm")} whitespace-nowrap`}>Sign up</Link>
      </nav>
    );
  }
  return (
    <nav className="flex flex-wrap items-center gap-0.5 sm:flex-nowrap sm:gap-2">
      <WhatsNewLink />
      <Link href="/dashboard" className={`${buttonClass("ghost", "sm")} whitespace-nowrap`}>My resumes</Link>
      <Link href="/account" className={`${buttonClass("ghost", "sm")} whitespace-nowrap`}>Account</Link>
      <form action={signOut}>
        <button type="submit" className={`${buttonClass("ghost", "sm")} whitespace-nowrap`}>Log out</button>
      </form>
    </nav>
  );
}
