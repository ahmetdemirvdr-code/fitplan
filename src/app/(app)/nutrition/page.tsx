"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Apple,
  Plus,
  Trash2,
  Loader2,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface FoodLog {
  id: string;
  mealType: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

interface PlanData {
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}

const mealTypeLabels: Record<string, string> = {
  BREAKFAST: "Kahvalti",
  LUNCH: "Ogle Yemegi",
  DINNER: "Aksam Yemegi",
  SNACK: "Ara Ogun",
};

const mealTypeColors: Record<string, string> = {
  BREAKFAST: "text-amber-600",
  LUNCH: "text-orange-600",
  DINNER: "text-red-600",
  SNACK: "text-purple-600",
};

export default function NutritionPage() {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [foodRes, planRes] = await Promise.all([
        fetch("/api/food/log"),
        fetch("/api/plan/active"),
      ]);

      if (foodRes.ok) {
        const foodData = await foodRes.json();
        setFoodLogs(foodData.foodLogs);
        setTotals(foodData.totals);
      }
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlan(planData);
      }
    } catch (err) {
      console.error("Nutrition fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteFood = async (id: string) => {
    try {
      const res = await fetch(`/api/food/log?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Yemek silindi");
        fetchData();
      }
    } catch {
      toast.error("Silinemedi");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const caloriePercent = plan
    ? Math.min((totals.calories / plan.dailyCalorieTarget) * 100, 100)
    : 0;

  // Group food logs by meal type
  const grouped: Record<string, FoodLog[]> = {};
  for (const log of foodLogs) {
    if (!grouped[log.mealType]) grouped[log.mealType] = [];
    grouped[log.mealType].push(log);
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Beslenme</h1>
            <p className="text-muted-foreground">Gunluk beslenme takibi</p>
          </div>
          <Link href="/nutrition/add">
            <Button className="rounded-xl bg-green-600 hover:bg-green-700">
              <Plus className="mr-1 h-4 w-4" />
              Ekle
            </Button>
          </Link>
        </div>

        {/* Calorie Summary */}
        {plan && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">Gunluk Ozet</span>
                </div>
                <span className="text-sm font-medium">
                  {totals.calories} / {plan.dailyCalorieTarget} kcal
                </span>
              </div>
              <Progress value={caloriePercent} className="mb-4 h-3" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <MacroCard
                  label="Protein"
                  current={totals.protein}
                  target={plan.proteinTarget}
                  color="text-blue-600"
                />
                <MacroCard
                  label="Karb"
                  current={totals.carbs}
                  target={plan.carbTarget}
                  color="text-amber-600"
                />
                <MacroCard
                  label="Yag"
                  current={totals.fat}
                  target={plan.fatTarget}
                  color="text-red-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Food Logs by Meal Type */}
        {["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((type) => (
          <div key={type} className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <Apple
                className={`h-4 w-4 ${mealTypeColors[type]}`}
              />
              <h3 className="font-semibold">{mealTypeLabels[type]}</h3>
              {grouped[type] && (
                <Badge variant="secondary" className="text-xs">
                  {grouped[type].reduce((s, f) => s + f.calories, 0)} kcal
                </Badge>
              )}
            </div>
            {grouped[type]?.length ? (
              <div className="space-y-2">
                {grouped[type].map((log) => (
                  <Card key={log.id}>
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {log.description}
                        </p>
                        <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                          <span>{log.calories} kcal</span>
                          <span>P: {log.protein}g</span>
                          <span>K: {log.carbs}g</span>
                          <span>Y: {log.fat}g</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteFood(log.id)}
                        className="ml-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-3 text-center text-sm text-muted-foreground">
                  Henuz yemek eklenmedi
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroCard({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div>
      <div className={`text-lg font-bold ${color}`}>
        {Math.round(current)}g
      </div>
      <Progress value={percent} className="my-1 h-1.5" />
      <div className="text-xs text-muted-foreground">/ {target}g</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
