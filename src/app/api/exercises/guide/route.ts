import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { getOrCreateExerciseGuide } from "@/lib/exercise-guide";
import { AiBudgetExceededError } from "@/lib/ai-usage";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
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
      user.id
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
