import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AVATAR_ID, isValidAvatarId } from "@/lib/avatars";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarId: true },
  });

  return Response.json({ avatarId: dbUser?.avatarId ?? DEFAULT_AVATAR_ID });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { avatarId?: string };
    const avatarId = body.avatarId?.trim();

    if (!avatarId || !isValidAvatarId(avatarId)) {
      return Response.json({ error: "Geçersiz avatar" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarId },
      select: { id: true, avatarId: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Avatar update error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
