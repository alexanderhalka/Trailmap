import { prisma } from "@/lib/db";
import { requireAuthUserId } from "@/lib/require-auth";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userIdOrResponse = await requireAuthUserId();
  if (userIdOrResponse instanceof Response) {
    return userIdOrResponse;
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.review.findFirst({
      where: { id, userId: userIdOrResponse },
    });

    if (!existing) {
      return Response.json({ error: "Review not found." }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Database unavailable. Is Postgres running and DATABASE_URL set?" },
      { status: 503 },
    );
  }
}
