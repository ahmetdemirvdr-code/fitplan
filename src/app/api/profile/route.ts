import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
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
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = profileSchema.parse(body);

    const profileData = {
      ...validated,
      bodyFatPercentage: validated.bodyFatPercentage ?? null,
      targetWeight: validated.targetWeight ?? null,
      targetDuration: validated.targetDuration ?? null,
      injuries: validated.injuries ?? null,
    };

    // Upsert: onboarding retry / plan regenerate after first save
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...profileData,
      },
      update: profileData,
    });

    return Response.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Geçersiz veri", details: error }, { status: 400 });
    }
    console.error("Profile creation error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
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
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
