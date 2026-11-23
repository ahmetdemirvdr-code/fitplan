import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { dailyStepTarget: true },
  });

  if (!profile) {
    return Response.json({ error: "Profil bulunamadı" }, { status: 404 });
  }

  return Response.json({ target: profile.dailyStepTarget });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { target?: number };
    const target = Math.round(Number(body.target));

    if (!Number.isFinite(target) || target < 1000 || target > 30000) {
      return Response.json(
        { error: "Hedef 1000–30000 arasında olmalı" },
        { status: 400 }
      );
    }

    const profile = await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: { dailyStepTarget: target },
      select: { dailyStepTarget: true },
    });

    return Response.json({ target: profile.dailyStepTarget });
  } catch (error) {
    console.error("Step target update error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
