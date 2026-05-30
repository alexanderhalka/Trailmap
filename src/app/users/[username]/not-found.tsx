import Link from "next/link";

export default function UserNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 text-zinc-900">
      <h1 className="text-2xl font-bold text-zinc-950">User not found</h1>
      <p className="text-sm text-zinc-800">No account exists with that username.</p>
      <Link href="/" className="text-sm font-medium underline">
        Back to search
      </Link>
    </main>
  );
}
