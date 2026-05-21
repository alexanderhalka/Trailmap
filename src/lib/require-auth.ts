import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function requireAuthUserId(): Promise<string | Response> {
  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  return userId;
}
