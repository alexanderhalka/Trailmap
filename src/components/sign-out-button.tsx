"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 hover:bg-zinc-50"
    >
      Sign out
    </button>
  );
}
