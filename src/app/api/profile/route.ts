import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  const [profile, dbUser] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarId: true },
    }),
  ]);

  if (!profile) {
    return Response.json({ error: "Profil bulunamadi" }, { status: 404 });
  }

  return Response.json({
    ...profile,
    avatarId: dbUser?.avatarId ?? "spark",
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
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
      where: { userId: user.id },
      create: {
        userId: user.id,
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
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = profileSchema.parse(body);

    const profile = await prisma.userProfile.update({
      where: { userId: user.id },
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
