"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username, password }),
        });

        const registerBody = (await registerResponse.json()) as { error?: string };
        if (!registerResponse.ok) {
          setError(registerBody.error ?? "Registration failed.");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          mode === "login"
            ? "Invalid email or password."
            : "Account created but sign-in failed. Try logging in.",
        );
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  const title = mode === "login" ? "Sign in" : "Create account";
  const submitLabel = mode === "login" ? "Sign in" : "Register";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-6 text-zinc-900">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-950">{title}</h1>
        <p className="text-sm text-zinc-700">
          {mode === "login"
            ? "Use your email and password to access TrailMap."
            : "Register with email, username, and password."}
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </label>

        {mode === "register" ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
            Username
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </label>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Please wait…" : submitLabel}
        </button>
      </form>

      <p className="text-sm text-zinc-700">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/register" className="font-medium text-zinc-900 underline">
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-zinc-900 underline">
              Sign in
            </Link>
          </>
        )}
      </p>

      <Link href="/" className="text-sm font-medium text-zinc-800 underline">
        Back to trails
      </Link>
    </main>
  );
}
