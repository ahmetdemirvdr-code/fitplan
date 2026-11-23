import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AVATAR_ID, isValidAvatarId } from "@/lib/avatars";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarId: true },
  });

  return Response.json({ avatarId: user?.avatarId ?? DEFAULT_AVATAR_ID });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { avatarId?: string };
    const avatarId = body.avatarId?.trim();

    if (!avatarId || !isValidAvatarId(avatarId)) {
      return Response.json({ error: "Geçersiz avatar" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarId },
      select: { id: true, avatarId: true },
    });

    return Response.json(user);
  } catch (error) {
    console.error("Avatar update error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
