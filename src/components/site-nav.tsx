import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { buttonClass } from "./ui";

export async function SiteNav() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/login" className={buttonClass("ghost", "sm")}>Log in</Link>
        <Link href="/signup" className={buttonClass("primary", "sm")}>Sign up</Link>
      </nav>
    );
  }
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <Link href="/dashboard" className={buttonClass("ghost", "sm")}>My resumes</Link>
      <Link href="/account" className={buttonClass("ghost", "sm")}>Account</Link>
      <form action={signOut}>
        <button type="submit" className={buttonClass("ghost", "sm")}>Log out</button>
      </form>
    </nav>
  );
}
