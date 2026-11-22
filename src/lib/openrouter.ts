import { assertAiBudgetAllowed, recordAiUsage } from "@/lib/ai-usage";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Fallback rates for openai/gpt-4o-mini when OpenRouter omits usage.cost */
const FALLBACK_INPUT_PER_M = 0.15;
const FALLBACK_OUTPUT_PER_M = 0.6;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  model?: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost?: number;
    total_cost?: number;
  };
}

export type OpenRouterResult = {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
};

function estimateCostUsd(promptTokens: number, completionTokens: number) {
  return (
    (promptTokens / 1_000_000) * FALLBACK_INPUT_PER_M +
    (completionTokens / 1_000_000) * FALLBACK_OUTPUT_PER_M
  );
}

export async function callOpenRouter(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    json?: boolean;
    userId?: string | null;
    purpose?: string;
  }
): Promise<string> {
  const result = await callOpenRouterDetailed(messages, options);
  return result.content;
}

export async function callOpenRouterDetailed(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    json?: boolean;
    userId?: string | null;
    purpose?: string;
  }
): Promise<OpenRouterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  if (options?.userId) {
    await assertAiBudgetAllowed(options.userId);
  }

  const model = options?.model || "openai/gpt-4o-mini";

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "FitPlan",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.json === false
        ? {}
        : { response_format: { type: "json_object" } }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const promptTokens = data.usage?.prompt_tokens ?? 0;
  const completionTokens = data.usage?.completion_tokens ?? 0;
  const reported =
    typeof data.usage?.cost === "number"
      ? data.usage.cost
      : typeof data.usage?.total_cost === "number"
        ? data.usage.total_cost
        : null;
  const costUsd =
    reported !== null && reported >= 0
      ? reported
      : estimateCostUsd(promptTokens, completionTokens);

  const result: OpenRouterResult = {
    content: data.choices[0]?.message?.content || "",
    model: data.model || model,
    promptTokens,
    completionTokens,
    costUsd,
  };

  if (options?.purpose) {
    await recordAiUsage({
      userId: options.userId ?? null,
      purpose: options.purpose,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      costUsd: result.costUsd,
    });
  }

  return result;
}

const PLAN_JSON_FORMAT = `{
  "dailyCalorieTarget": number,
  "dailyWaterTarget": number (litre),
  "proteinTarget": number (gram),
  "carbTarget": number (gram),
  "fatTarget": number (gram),
  "workoutPlan": [
    {
      "dayOfWeek": number (1-7, 1=Pazartesi),
      "name": "Göğüs + Triceps",
      "isRestDay": false,
      "exercises": [
        {
          "name": "Bench Press",
          "nameEn": "Barbell Bench Press",
          "sets": 4,
          "reps": "8-12",
          "weight": "Orta ağırlık",
          "restSeconds": 90,
          "description": "Sırtını düz bench'e yatır. Ayaklarını yere sabitle. Barı göğsüne kontrollü indir. Nefes vererek yukarı itin. Dirseklerini vücuda yapıştırma."
        }
      ]
    }
  ],
  "mealPlan": [
    {
      "dayOfWeek": 1,
      "meals": [
        {
          "mealType": "BREAKFAST",
          "description": "2 yumurta, 1 dilim tam buğday ekmek...",
          "calories": 350,
          "protein": 25,
          "carbs": 30,
          "fat": 15
        }
      ]
    }
  ]
}`;

/** Import: workout-only, multi-phase — meals are generated separately */
const IMPORT_WORKOUT_JSON_FORMAT = `{
  "durationWeeks": number,
  "phases": [
    {
      "name": "Faz 1 — Temeller",
      "startWeek": 1,
      "endWeek": 4,
      "workoutDays": [
        {
          "dayOfWeek": number (1-7, 1=Pazartesi),
          "name": "Üst Vücut + Mobilite",
          "isRestDay": false,
          "exercises": [
            {
              "name": "Boyun Mobilite",
              "nameEn": "Neck Mobility",
              "sets": 1,
              "reps": "2 dk",
              "weight": null,
              "restSeconds": 0,
              "description": "Program notu kısaca"
            }
          ]
        }
      ]
    }
  ]
}`;

const MEAL_ONLY_JSON_FORMAT = `{
  "dailyCalorieTarget": number,
  "dailyWaterTarget": number (litre),
  "proteinTarget": number (gram),
  "carbTarget": number (gram),
  "fatTarget": number (gram),
  "mealPlan": [
    {
      "dayOfWeek": 1,
      "meals": [
        {
          "mealType": "BREAKFAST",
          "description": "2 yumurta, 1 dilim tam buğday ekmek...",
          "calories": 350,
          "protein": 25,
          "carbs": 30,
          "fat": 15
        }
      ]
    }
  ]
}`;

function buildProfileBlock(profile: Record<string, unknown>): string {
  const genderText = profile.gender === "MALE" ? "Erkek" : "Kadın";
  const goalText: Record<string, string> = {
    LOSE_WEIGHT: "Kilo vermek",
    BUILD_MUSCLE: "Kas yapmak",
    MAINTAIN: "Formu korumak",
    ENDURANCE: "Dayanıklılığı artırmak",
  };
  const dietText: Record<string, string> = {
    NORMAL: "Normal",
    VEGETARIAN: "Vejetaryen",
    VEGAN: "Vegan",
    KETO: "Ketojenik",
    OTHER: "Diğer",
  };
  const levelText: Record<string, string> = {
    BEGINNER: "Başlangıç",
    INTERMEDIATE: "Orta",
    ADVANCED: "İleri",
  };

  return `Kullanıcı Bilgileri:
- Cinsiyet: ${genderText}
- Yaş: ${profile.age}
- Boy: ${profile.height} cm
- Kilo: ${profile.weight} kg
${profile.bodyFatPercentage ? `- Vücut yağ oranı: %${profile.bodyFatPercentage}` : ""}
- Hedef: ${goalText[profile.goal as string] || profile.goal}
${profile.targetWeight ? `- Hedef kilo: ${profile.targetWeight} kg` : ""}
- Sağlık durumları: ${(profile.healthConditions as string[])?.length ? (profile.healthConditions as string[]).join(", ") : "Yok"}
- Alerjiler: ${(profile.allergies as string[])?.length ? (profile.allergies as string[]).join(", ") : "Yok"}
${profile.injuries ? `- Sakatlıklar/kısıtlamalar: ${profile.injuries}` : ""}
- Diyet tercihi: ${dietText[profile.dietPreference as string] || profile.dietPreference}
- Spor seviyesi: ${levelText[profile.experienceLevel as string] || profile.experienceLevel}
- Spor salonu erişimi: ${profile.hasGymAccess ? "Var" : "Yok"}
- Ev ekipmanları: ${(profile.homeEquipment as string[])?.length ? (profile.homeEquipment as string[]).join(", ") : "Yok"}
- Sadece vücut ağırlığı: ${profile.bodyweightOnly ? "Evet" : "Hayır"}
- Haftada spor günü: ${profile.daysPerWeek}
- Günlük süre: ${profile.minutesPerDay} dakika
- Günlük öğün sayısı: ${profile.mealsPerDay}
- Ara öğün: ${profile.hasSnacks ? "Yapıyor" : "Yapmıyor"}
- Yemek yeri: ${profile.eatsAtHome ? "Genelde evde" : "Genelde dışarıda"}
- Bütçe: ${profile.budget === "LOW" ? "Düşük" : profile.budget === "MEDIUM" ? "Orta" : "Yüksek"}`;
}

/** Convert pasted multi-phase program → workout JSON only (no meals). */
export function buildImportWorkoutPrompt(
  profile: Record<string, unknown>,
  existingProgram: string
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Sen bir program dönüştürücüsüsün. Kullanıcının yapıştırdığı antrenman programını JSON'a çeviriyorsun. BESLENME YOK — sadece antrenman.

KRİTİK KURALLAR (ihlal etme):
1. Yanıt MUTLAKA geçerli JSON olsun
2. Programdaki HER hareketi ayrı exercises öğesi olarak yaz — özetleme, birleştirme, atlama YASAK
3. Bir günde 7 hareket yazılmışsa exercises dizisinde TAM 7 öğe olmalı (3'e düşürme)
4. Fazları ayrı phases olarak tut (FAZ 1, FAZ 2, FAZ 3...). startWeek/endWeek programdan çıkar
5. Her fazda programda adı geçen antrenman günlerini yaz; diğer günler isRestDay: true
6. dayOfWeek: Pazartesi=1 ... Pazar=7 (Salı=2, Perşembe=4, Cumartesi=6)
7. sets/reps/weight programdaki değerlerden gelsin (ör. 3×10 → sets:3, reps:"10"; ~2 dk → sets:1, reps:"2 dk")
8. description en fazla 1 kısa cümle (program notu yeterli) — uzun anlatım YAZMA
9. name Türkçe, nameEn standart İngilizce egzersiz adı
10. durationWeeks programdaki toplam hafta (yoksa faz endWeek'lerinin maksimumu)
11. Isınma protokolü ayrı bir "her antrenman öncesi" bölümüyse, her antrenman gününün BAŞINA o günün listesinde yazılan ısınma/mobilite hareketlerini koy; listedeki sırayı koru

JSON FORMATI:
${IMPORT_WORKOUT_JSON_FORMAT}`,
    },
    {
      role: "user",
      content: `${buildProfileBlock(profile)}

=== KULLANICININ MEVCUT PROGRAMI ===
${existingProgram}
=== PROGRAM SONU ===

Bu programı fazlı workout JSON'una çevir. Hiçbir hareketi atlama veya özetleme.`,
    },
  ];
}

/** Nutrition-only plan for imported workouts. */
export function buildMealPlanPrompt(profile: Record<string, unknown>): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Sen bir beslenme uzmanısın. Kullanıcı için 7 günlük öğün planı ve makro hedefleri üret.

KURALLAR:
1. Yanıt MUTLAKA geçerli JSON
2. Türkçe yaz
3. BMR + aktivite ile kalori hesapla
4. Her gün için meals dizisi doldur (BREAKFAST, LUNCH, DINNER, isteğe SNACK)
5. Antrenman üretme — sadece beslenme alanları

JSON FORMATI:
${MEAL_ONLY_JSON_FORMAT}`,
    },
    {
      role: "user",
      content: `${buildProfileBlock(profile)}

Bu bilgilere göre makro hedefleri ve 7 günlük beslenme planı oluştur.`,
    },
  ];
}

export function buildFitnessPlanPrompt(
  profile: Record<string, unknown>,
  options?: { existingProgram?: string }
): ChatMessage[] {
  const existingProgram = options?.existingProgram?.trim();
  if (existingProgram) {
    return buildImportWorkoutPrompt(profile, existingProgram);
  }

  const systemPrompt = `Sen profesyonel bir fitness ve beslenme uzmanısın. Kullanıcının bilgilerine göre kişisel bir spor ve beslenme planı oluşturacaksın.

KURALLAR:
1. Yanıtı MUTLAKA geçerli JSON formatında ver
2. Türkçe yaz
3. Egzersiz isimlerini hem Türkçe (name) hem standart İngilizce (nameEn) ver; nameEn bilinen egzersiz adı olsun (ör. Barbell Bench Press, Bodyweight Squat)
4. Her egzersizin description alanı 3-5 net cümle olsun: başlangıç pozisyonu, hareket, nefes, yaygın hata; her cümle nokta ile bitsin
5. Spor programı haftanın belirtilen gün sayısına uygun olsun
6. Beslenme planı kişi bilgilerine uygun olsun
7. Kalori hesaplamalarını doğru yap (BMR + aktivite faktoru)
8. Makro dağılımı hedefe göre ayarla

JSON FORMATI:
${PLAN_JSON_FORMAT}`;

  const userPrompt = `${buildProfileBlock(profile)}

Bu bilgilere göre 7 günlük (1 haftalık döngü) detaylı bir spor ve beslenme planı oluştur. Haftanın ${profile.daysPerWeek} günü antrenman, geri kalanı dinlenme günü olsun.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function buildFoodAnalysisPrompt(foodDescription: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Sen bir beslenme uzmanısın. Kullanıcının yazdığı yemeği analiz edip kalori ve makro besin değerlerini tahmin edeceksin. Yanıtı MUTLAKA geçerli JSON formatında ver.

JSON FORMATI:
{
  "description": "Yemeğin düzenlenmiş açıklaması",
  "calories": number,
  "protein": number (gram),
  "carbs": number (gram),
  "fat": number (gram),
  "note": "Yaklaşık değerlerdir, porsiyona göre değişebilir"
}

Türkiye'deki standart porsiyon boyutlarını baz al. Örneğin:
- 1 tabak çorbası = ~250ml
- 1 porsiyon pilav = ~150g
- 1 tabak et yemeği = ~200g et`,
    },
    {
      role: "user",
      content: `Su yemeği analiz et: "${foodDescription}"`,
    },
  ];
}
