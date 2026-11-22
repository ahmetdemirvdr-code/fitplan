import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { callOpenRouter, buildFoodAnalysisPrompt } from "@/lib/openrouter";
import { AiBudgetExceededError } from "@/lib/ai-usage";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { description } = await request.json();
    if (!description || typeof description !== "string") {
      return Response.json({ error: "Yemek açıklaması gerekli" }, { status: 400 });
    }

    const messages = buildFoodAnalysisPrompt(description);
    const aiResponse = await callOpenRouter(messages, {
      maxTokens: 1024,
      temperature: 0.3,
      userId: session.user.id,
      purpose: "food_analyze",
    });

    const analysis = JSON.parse(aiResponse);
    return Response.json(analysis);
  } catch (error) {
    if (error instanceof AiBudgetExceededError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: 402 }
      );
    }
    console.error("Food analysis error:", error);
    return Response.json({ error: "Yemek analiz edilemedi" }, { status: 500 });
  }
}
