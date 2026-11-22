"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Droplets,
  Plus,
  Minus,
  Loader2,
  GlassWater,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WaterLog {
  id: string;
  amount: number;
  time: string;
}

export default function WaterPage() {
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [totalMl, setTotalMl] = useState(0);
  const [target, setTarget] = useState(2.5); // liters
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [waterRes, planRes] = await Promise.all([
        fetch("/api/water/log"),
        fetch("/api/plan/active"),
      ]);

      if (waterRes.ok) {
        const data = await waterRes.json();
        setWaterLogs(data.waterLogs);
        setTotalMl(data.totalMl);
      }
      if (planRes.ok) {
        const planData = await planRes.json();
        setTarget(planData.dailyWaterTarget || 2.5);
      }
    } catch (err) {
      console.error("Water fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addWater = async (amount: number) => {
    setAdding(true);
    try {
      const res = await fetch("/api/water/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        await fetchData();
        toast.success(`${amount}ml su eklendi!`);
      } else {
        toast.error("Eklenemedi");
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const targetMl = target * 1000;
  const percent = Math.min((totalMl / targetMl) * 100, 100);
  const glasses = Math.floor(totalMl / 200);
  const targetGlasses = Math.ceil(targetMl / 200);

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Su Takibi</h1>
          <p className="text-muted-foreground">Gunluk su tuketimini takip et</p>
        </div>

        {/* Water Visual */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative mx-auto mb-4 flex h-48 w-32 items-end justify-center overflow-hidden rounded-2xl border-4 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
              {/* Water level */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
                style={{ height: `${percent}%` }}
              />
              {/* Text overlay */}
              <div className="relative z-10 mb-4 text-center">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {(totalMl / 1000).toFixed(1)}L
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  / {target}L
                </div>
              </div>
            </div>

            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <GlassWater className="h-4 w-4" />
                <span>
                  {glasses} / {targetGlasses} bardak
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                %{Math.round(percent)} tamamlandi
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-14 rounded-xl flex-col gap-0.5"
                onClick={() => addWater(200)}
                disabled={adding}
              >
                <Droplets className="h-5 w-5 text-blue-500" />
                <span className="text-xs">1 Bardak</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-xl flex-col gap-0.5"
                onClick={() => addWater(330)}
                disabled={adding}
              >
                <Droplets className="h-5 w-5 text-blue-500" />
                <span className="text-xs">330ml</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-xl flex-col gap-0.5"
                onClick={() => addWater(500)}
                disabled={adding}
              >
                <Droplets className="h-5 w-5 text-blue-500" />
                <span className="text-xs">500ml</span>
              </Button>
            </div>

            {/* Custom Amount */}
            <div className="mt-4">
              <CustomWaterInput onAdd={addWater} disabled={adding} />
            </div>
          </CardContent>
        </Card>

        {/* Water Log History */}
        <div>
          <h3 className="mb-3 font-semibold">Bugunun Kayitlari</h3>
          {waterLogs.length > 0 ? (
            <div className="space-y-2">
              {waterLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        {log.amount}ml
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.time).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                Henuz su kaydi yok. Ilk bardagini ekle!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomWaterInput({
  onAdd,
  disabled,
}: {
  onAdd: (amount: number) => void;
  disabled: boolean;
}) {
  const [amount, setAmount] = useState(200);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-xl shrink-0"
        onClick={() => setAmount(Math.max(50, amount - 50))}
        disabled={disabled}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="flex-1 text-center font-semibold">{amount}ml</div>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-xl shrink-0"
        onClick={() => setAmount(Math.min(2000, amount + 50))}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 px-4"
        onClick={() => onAdd(amount)}
        disabled={disabled}
      >
        Ekle
      </Button>
    </div>
  );
}
