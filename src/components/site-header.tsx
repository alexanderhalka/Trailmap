import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-sm font-semibold text-zinc-950">
          TrailMap
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-800">
          <Link href="/plans" className="hover:text-zinc-950">
            Saved trails
          </Link>
          {session?.user ? (
            <>
              <Link
                href={`/users/${encodeURIComponent(session.user.username)}`}
                className="text-zinc-600 hover:text-zinc-950"
              >
                Hi, <span className="text-zinc-900">{session.user.username}</span>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-zinc-950">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
