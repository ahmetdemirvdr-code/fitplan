import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateExerciseGuide } from "@/lib/exercise-guide";
import { AiBudgetExceededError } from "@/lib/ai-usage";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const nameEn = request.nextUrl.searchParams.get("nameEn")?.trim();
  const nameTr = request.nextUrl.searchParams.get("name")?.trim() || undefined;

  if (!nameEn) {
    return Response.json({ error: "nameEn gerekli" }, { status: 400 });
  }

  try {
    const guide = await getOrCreateExerciseGuide(
      nameEn,
      nameTr,
      session.user.id
    );
    return Response.json(guide);
  } catch (error) {
    if (error instanceof AiBudgetExceededError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: 402 }
      );
    }
    console.error("Exercise guide error:", error);
    return Response.json(
      { error: "Egzersiz rehberi oluşturulamadı" },
      { status: 500 }
    );
  }
}
