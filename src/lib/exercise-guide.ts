import { prisma } from "@/lib/prisma";
import { callOpenRouter } from "@/lib/openrouter";

export function normalizeExerciseSlug(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export type ExerciseGuidePayload = {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string | null;
  targetMuscle: string | null;
  equipment: string | null;
  steps: string[];
  tips: string[];
  commonMistakes: string[];
  cached: boolean;
};

type AiGuideResponse = {
  nameTr?: string;
  targetMuscle?: string;
  equipment?: string;
  steps?: string[];
  tips?: string[];
  commonMistakes?: string[];
};

async function generateGuideWithAI(
  nameEn: string,
  nameTr?: string,
  userId?: string | null
) {
  const content = await callOpenRouter(
    [
      {
        role: "system",
        content: `Sen sertifikalı bir fitness koçusun. Egzersiz rehberi üretiyorsun.
Yanıtı MUTLAKA geçerli JSON olarak ver. Tüm metinler Türkçe olsun (nameEn hariç).

JSON FORMATI:
{
  "nameTr": "Türkçe egzersiz adı",
  "targetMuscle": "Ana kas grubu",
  "equipment": "Gerekli ekipman",
  "steps": ["Adım 1...", "Adım 2...", "..."],
  "tips": ["İpucu 1", "İpucu 2"],
  "commonMistakes": ["Yaygın hata 1", "Yaygın hata 2"]
}

KURALLAR:
- steps: 5-8 net, uygulanabilir adım
- tips: 2-4 kısa ipucu
- commonMistakes: 2-4 yaygın hata
- Güvenli forma odaklan`,
      },
      {
        role: "user",
        content: `Egzersiz: ${nameEn}${nameTr ? ` (Türkçe: ${nameTr})` : ""}
Bu hareket için detaylı "nasıl yapılır" rehberi yaz.`,
      },
    ],
    {
      temperature: 0.4,
      maxTokens: 1200,
      userId: userId ?? null,
      purpose: "exercise_guide",
    }
  );

  const parsed = JSON.parse(content) as AiGuideResponse;
  const steps = (parsed.steps || []).map((s) => String(s).trim()).filter(Boolean);
  if (steps.length < 3) {
    throw new Error("AI rehberi yetersiz adım döndürdü");
  }

  return {
    nameTr: parsed.nameTr?.trim() || nameTr || null,
    targetMuscle: parsed.targetMuscle?.trim() || null,
    equipment: parsed.equipment?.trim() || null,
    steps,
    tips: (parsed.tips || []).map((s) => String(s).trim()).filter(Boolean),
    commonMistakes: (parsed.commonMistakes || [])
      .map((s) => String(s).trim())
      .filter(Boolean),
  };
}

export async function getOrCreateExerciseGuide(
  nameEn: string,
  nameTr?: string,
  userId?: string | null
): Promise<ExerciseGuidePayload> {
  const cleanedEn = nameEn.trim();
  if (!cleanedEn) {
    throw new Error("nameEn gerekli");
  }

  const slug = normalizeExerciseSlug(cleanedEn);
  if (!slug) {
    throw new Error("Geçersiz egzersiz adı");
  }

  const existing = await prisma.exerciseGuide.findUnique({ where: { slug } });
  if (existing) {
    return { ...existing, cached: true };
  }

  const generated = await generateGuideWithAI(cleanedEn, nameTr, userId);

  try {
    const created = await prisma.exerciseGuide.create({
      data: {
        slug,
        nameEn: cleanedEn,
        ...generated,
      },
    });
    return { ...created, cached: false };
  } catch {
    // Concurrent request already inserted the same slug
    const raced = await prisma.exerciseGuide.findUnique({ where: { slug } });
    if (raced) return { ...raced, cached: true };
    throw new Error("Egzersiz rehberi kaydedilemedi");
  }
}
