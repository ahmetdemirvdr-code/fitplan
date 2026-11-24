import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return Response.json(
        { error: "E-posta ve şifre gerekli" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return Response.json({ error: "Giriş başarısız" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Giriş başarısız" }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      hasProfile: !!user.profile,
      role: (user.role === "ADMIN" ? "ADMIN" : "USER") as "USER" | "ADMIN",
    };

    const token = signMobileToken(sessionUser);

    return Response.json({
      token,
      user: sessionUser,
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
