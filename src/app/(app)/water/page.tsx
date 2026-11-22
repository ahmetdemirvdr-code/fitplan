"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Droplets,
  Plus,
  Minus,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WaterLog {
  id: string;
  amount: number;
  time: string;
}

function WaterRing({
  percent,
  totalMl,
  targetL,
}: {
  percent: number;
  totalMl: number;
  targetL: number;
}) {
  const size = 180;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(percent, 100) / 100);
  const color = percent >= 100 ? "#2ECC71" : "#4ECDC4";

  return (
    <div className="relative mx-auto mb-4 flex h-[180px] w-[180px] items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1A2E"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-stat text-3xl font-bold" style={{ color }}>
          {(totalMl / 1000).toFixed(1)}L
        </div>
        <div className="text-sm text-[#EAEAEA]/50">/ {targetL}L</div>
      </div>
    </div>
  );
}

export default function WaterPage() {
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [totalMl, setTotalMl] = useState(0);
  const [target, setTarget] = useState(2.5);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      toast.error("Bir hata oluştu");
    } finally {
      setAdding(false);
    }
  };

  const deleteWater = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/water/log?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
        toast.success("Kayıt silindi");
      } else {
        toast.error("Silinemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ECDC4]" />
      </div>
    );
  }

  const targetMl = target * 1000;
  const percent = Math.min((totalMl / targetMl) * 100, 100);
  const glasses = Math.floor(totalMl / 200);
  const targetGlasses = Math.ceil(targetMl / 200);

  return (
    <div className="px-5 py-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Su Takibi</h1>
          <p className="text-[#EAEAEA]/50">Günlük su tüketimini takip et</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <WaterRing percent={percent} totalMl={totalMl} targetL={target} />

            <div className="mb-5 text-center text-sm text-[#EAEAEA]/50">
              {glasses} / {targetGlasses} bardak · %{Math.round(percent)} tamamlandı
            </div>

            {/* ±200 controls */}
            <div className="mb-4 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => {
                  const last = waterLogs[waterLogs.length - 1];
                  if (last) void deleteWater(last.id);
                }}
                disabled={adding || waterLogs.length === 0 || !!deletingId}
                aria-label="Son kaydı sil"
              >
                <Minus className="h-5 w-5 text-[#4ECDC4]" />
              </Button>
              <span className="font-stat text-sm text-[#EAEAEA]/60">±200ml</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => addWater(200)}
                disabled={adding}
                aria-label="200ml ekle"
              >
                <Plus className="h-5 w-5 text-[#4ECDC4]" />
              </Button>
            </div>

            {/* Preset chips */}
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {[200, 330, 500].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  disabled={adding}
                  onClick={() => addWater(ml)}
                  className="rounded-full border border-[#4ECDC4]/40 bg-[#4ECDC4]/15 px-4 py-2 text-sm font-semibold text-[#4ECDC4] transition-colors hover:bg-[#4ECDC4]/25 disabled:opacity-50"
                >
                  +{ml}ml
                </button>
              ))}
            </div>

            <CustomWaterInput onAdd={addWater} disabled={adding} />
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-3 font-semibold">Bugünün Kayıtları</h3>
          {waterLogs.length > 0 ? (
            <div className="space-y-2">
              {waterLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-[#4ECDC4]" />
                      <span className="font-stat text-sm font-medium">
                        {log.amount}ml
                      </span>
                      <span className="text-xs text-[#EAEAEA]/40">
                        {new Date(log.time).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#E74C3C] hover:bg-[#E74C3C]/15 hover:text-[#E74C3C]"
                      onClick={() => deleteWater(log.id)}
                      disabled={deletingId === log.id}
                      aria-label="Kaydı sil"
                    >
                      {deletingId === log.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-sm text-[#EAEAEA]/50">
                Henüz su kaydı yok. İlk bardağını ekle!
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
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-xl"
        onClick={() => setAmount(Math.max(50, amount - 50))}
        disabled={disabled}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="font-stat flex-1 text-center font-semibold">{amount}ml</div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-xl"
        onClick={() => setAmount(Math.min(2000, amount + 50))}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        className="h-10 rounded-xl bg-[#4ECDC4] px-4 font-semibold text-[#1A1A2E] shadow-lg shadow-[#4ECDC4]/25 hover:bg-[#3DBDB4] hover:text-[#1A1A2E]"
        onClick={() => onAdd(amount)}
        disabled={disabled}
      >
        Ekle
      </Button>
    </div>
  );
}
