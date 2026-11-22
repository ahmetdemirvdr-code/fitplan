const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callOpenRouter(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "FitPlan",
    },
    body: JSON.stringify({
      model: options?.model || "openai/gpt-4o-mini",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  return data.choices[0]?.message?.content || "";
}

export function buildFitnessPlanPrompt(profile: Record<string, unknown>): ChatMessage[] {
  const genderText = profile.gender === "MALE" ? "Erkek" : "Kadin";
  const goalText: Record<string, string> = {
    LOSE_WEIGHT: "Kilo vermek",
    BUILD_MUSCLE: "Kas yapmak",
    MAINTAIN: "Formu korumak",
    ENDURANCE: "Dayanikliligi artirmak",
  };
  const dietText: Record<string, string> = {
    NORMAL: "Normal",
    VEGETARIAN: "Vejetaryen",
    VEGAN: "Vegan",
    KETO: "Ketojenik",
    OTHER: "Diger",
  };
  const levelText: Record<string, string> = {
    BEGINNER: "Baslangic",
    INTERMEDIATE: "Orta",
    ADVANCED: "Ileri",
  };

  const systemPrompt = `Sen profesyonel bir fitness ve beslenme uzmanisin. Kullanicinin bilgilerine gore kisisel bir spor ve beslenme plani olusturacaksin.

KURALLAR:
1. Yaniti MUTLAKA gecerli JSON formatinda ver
2. Turkce yaz
3. Egzersiz isimlerini hem Turkce hem Ingilizce ver
4. Spor programi haftanin belirtilen gun sayisina uygun olsun
5. Beslenme plani kisi bilgilerine uygun olsun
6. Kalori hesaplamalarini dogru yap (BMR + aktivite faktoru)
7. Makro dagilimi hedefe gore ayarla

JSON FORMATI:
{
  "dailyCalorieTarget": number,
  "dailyWaterTarget": number (litre),
  "proteinTarget": number (gram),
  "carbTarget": number (gram),
  "fatTarget": number (gram),
  "workoutPlan": [
    {
      "dayOfWeek": number (1-7, 1=Pazartesi),
      "name": "Gogus + Triceps",
      "isRestDay": false,
      "exercises": [
        {
          "name": "Bench Press",
          "nameEn": "Barbell Bench Press",
          "sets": 4,
          "reps": "8-12",
          "weight": "Orta agirlik",
          "restSeconds": 90,
          "description": "Sirti duz bench'e yatirin..."
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
          "description": "2 yumurta, 1 dilim tam bugday ekmek...",
          "calories": 350,
          "protein": 25,
          "carbs": 30,
          "fat": 15
        }
      ]
    }
  ]
}`;

  const userPrompt = `Kullanici Bilgileri:
- Cinsiyet: ${genderText}
- Yas: ${profile.age}
- Boy: ${profile.height} cm
- Kilo: ${profile.weight} kg
${profile.bodyFatPercentage ? `- Vucut yag orani: %${profile.bodyFatPercentage}` : ""}
- Hedef: ${goalText[profile.goal as string] || profile.goal}
${profile.targetWeight ? `- Hedef kilo: ${profile.targetWeight} kg` : ""}
- Saglik durumlari: ${(profile.healthConditions as string[])?.length ? (profile.healthConditions as string[]).join(", ") : "Yok"}
- Alerjiler: ${(profile.allergies as string[])?.length ? (profile.allergies as string[]).join(", ") : "Yok"}
${profile.injuries ? `- Sakatliklar/kisitlamalar: ${profile.injuries}` : ""}
- Diyet tercihi: ${dietText[profile.dietPreference as string] || profile.dietPreference}
- Spor seviyesi: ${levelText[profile.experienceLevel as string] || profile.experienceLevel}
- Spor salonu erisimi: ${profile.hasGymAccess ? "Var" : "Yok"}
- Ev ekipmanlari: ${(profile.homeEquipment as string[])?.length ? (profile.homeEquipment as string[]).join(", ") : "Yok"}
- Sadece vucut agirligi: ${profile.bodyweightOnly ? "Evet" : "Hayir"}
- Haftada spor gunu: ${profile.daysPerWeek}
- Gunluk sure: ${profile.minutesPerDay} dakika
- Gunluk ogun sayisi: ${profile.mealsPerDay}
- Ara ogun: ${profile.hasSnacks ? "Yapiyor" : "Yapmiyor"}
- Yemek yeri: ${profile.eatsAtHome ? "Genelde evde" : "Genelde disarida"}
- Butce: ${profile.budget === "LOW" ? "Dusuk" : profile.budget === "MEDIUM" ? "Orta" : "Yuksek"}

Bu bilgilere gore 7 gunluk (1 haftalik dongu) detayli bir spor ve beslenme plani olustur. Haftanin ${profile.daysPerWeek} gunu antrenman, geri kalani dinlenme gunu olsun.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function buildFoodAnalysisPrompt(foodDescription: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Sen bir beslenme uzmanisin. Kullanicinin yazidigi yemegi analiz edip kalori ve makro besin degerlerini tahmin edeceksin. Yaniti MUTLAKA gecerli JSON formatinda ver.

JSON FORMATI:
{
  "description": "Yemegin duzenlenmis aciklamasi",
  "calories": number,
  "protein": number (gram),
  "carbs": number (gram),
  "fat": number (gram),
  "note": "Yaklasik degerlerdir, porsiyona gore degisebilir"
}

Turkiye'deki standart porsiyon boyutlarini baz al. Ornegin:
- 1 tabak corbasi = ~250ml
- 1 porsiyon pilav = ~150g
- 1 tabak et yemegi = ~200g et`,
    },
    {
      role: "user",
      content: `Su yemegi analiz et: "${foodDescription}"`,
    },
  ];
}
