import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return Response.json({ error: "Profil bulunamadi" }, { status: 404 });
  }

  return Response.json(profile);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = profileSchema.parse(body);

    // Check if profile already exists
    const existing = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return Response.json(
        { error: "Profil zaten mevcut. Guncellemek icin PUT kullanin." },
        { status: 400 }
      );
    }

    const profile = await prisma.userProfile.create({
      data: {
        userId: session.user.id,
        ...validated,
        bodyFatPercentage: validated.bodyFatPercentage ?? null,
        targetWeight: validated.targetWeight ?? null,
        targetDuration: validated.targetDuration ?? null,
        injuries: validated.injuries ?? null,
      },
    });

    return Response.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Gecersiz veri", details: error }, { status: 400 });
    }
    console.error("Profile creation error:", error);
    return Response.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = profileSchema.parse(body);

    const profile = await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: {
        ...validated,
        bodyFatPercentage: validated.bodyFatPercentage ?? null,
        targetWeight: validated.targetWeight ?? null,
        targetDuration: validated.targetDuration ?? null,
        injuries: validated.injuries ?? null,
      },
    });

    return Response.json(profile);
  } catch (error) {
    console.error("Profile update error:", error);
    return Response.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}
