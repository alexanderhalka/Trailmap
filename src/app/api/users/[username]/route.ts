import { getUserProfileByUsername } from "@/lib/user-profile";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;

  try {
    const profile = await getUserProfileByUsername(decodeURIComponent(username));
    if (!profile) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    return Response.json(profile);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
