import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, buildFoodAnalysisPrompt } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  try {
    const { description } = await request.json();
    if (!description || typeof description !== "string") {
      return Response.json({ error: "Yemek aciklamasi gerekli" }, { status: 400 });
    }

    const messages = buildFoodAnalysisPrompt(description);
    const aiResponse = await callOpenRouter(messages, {
      maxTokens: 1024,
      temperature: 0.3,
    });

    const analysis = JSON.parse(aiResponse);
    return Response.json(analysis);
  } catch (error) {
    console.error("Food analysis error:", error);
    return Response.json({ error: "Yemek analiz edilemedi" }, { status: 500 });
  }
}
