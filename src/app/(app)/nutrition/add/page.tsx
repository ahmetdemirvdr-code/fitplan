"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const mealTypes = [
  { value: "BREAKFAST", label: "Kahvalti" },
  { value: "LUNCH", label: "Ogle Yemegi" },
  { value: "DINNER", label: "Aksam Yemegi" },
  { value: "SNACK", label: "Ara Ogun" },
];

interface FoodAnalysis {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  note?: string;
}

export default function AddFoodPage() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [mealType, setMealType] = useState("LUNCH");
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);

  const analyzeFood = async () => {
    if (!description.trim()) {
      toast.error("Yemek aciklamasi girin");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch("/api/food/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
        setStep("confirm");
      } else {
        toast.error("Yemek analiz edilemedi. Tekrar deneyin.");
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveFood = async () => {
    if (!analysis) return;
    setSaving(true);

    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          description: analysis.description || description,
          calories: analysis.calories,
          protein: analysis.protein,
          carbs: analysis.carbs,
          fat: analysis.fat,
        }),
      });

      if (res.ok) {
        toast.success("Yemek eklendi!");
        router.push("/nutrition");
      } else {
        toast.error("Kayit sirasinda hata olustu");
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-muted-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Yemek Ekle</h1>
        </div>

        {step === "input" ? (
          <div className="space-y-5">
            {/* Meal Type */}
            <div className="space-y-2">
              <Label>Ogun</Label>
              <div className="grid grid-cols-2 gap-2">
                {mealTypes.map((mt) => (
                  <button
                    key={mt.value}
                    onClick={() => setMealType(mt.value)}
                    className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                      mealType === mt.value
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20"
                        : "border-border hover:border-green-200"
                    }`}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Description */}
            <div className="space-y-2">
              <Label htmlFor="food">Ne yedin?</Label>
              <Input
                id="food"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ornegin: 1 tabak mercimek corbasi, 2 dilim ekmek"
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Yediklerini olabildigince detayli yaz. Porsiyon ve miktar
                belirt.
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700"
              onClick={analyzeFood}
              disabled={analyzing || !description.trim()}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI ile Analiz Et
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Analysis Result */}
            <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/10">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">AI Analiz Sonucu</span>
                </div>
                <p className="mb-4 text-sm">{analysis?.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-3 text-center dark:bg-background">
                    <div className="text-2xl font-bold text-orange-600">
                      {analysis?.calories}
                    </div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center dark:bg-background">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis?.protein}g
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protein
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center dark:bg-background">
                    <div className="text-2xl font-bold text-amber-600">
                      {analysis?.carbs}g
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Karbonhidrat
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center dark:bg-background">
                    <div className="text-2xl font-bold text-red-500">
                      {analysis?.fat}g
                    </div>
                    <div className="text-xs text-muted-foreground">Yag</div>
                  </div>
                </div>

                {analysis?.note && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    * {analysis.note}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => {
                  setStep("input");
                  setAnalysis(null);
                }}
              >
                Duzelt
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700"
                onClick={saveFood}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Onayla
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
