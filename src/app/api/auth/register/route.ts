import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  isValidEmail,
  normalizeEmail,
  normalizeUsername,
  validateUsername,
} from "@/lib/user-input";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      username?: string;
      password?: string;
    };

    if (
      typeof body.email !== "string" ||
      typeof body.username !== "string" ||
      typeof body.password !== "string"
    ) {
      return Response.json({ error: "Email, username, and password are required." }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    const username = normalizeUsername(body.username);
    const password = body.password;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return Response.json({ error: usernameError }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      if (existing.email === email) {
        return Response.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      return Response.json({ error: "This username is already taken." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not create account. Is the database running?" },
      { status: 503 },
    );
  }
}
