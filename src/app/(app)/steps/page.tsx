"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Footprints,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { StepsPlatformNotice } from "@/components/steps-platform-notice";
import { calculateStepCalories } from "@/lib/step-calories";

type StepSummary = {
  totalSteps: number;
  stepTarget: number;
  totalCalories: number;
  distanceKm: number;
  percentage: number;
  logs: Array<{
    id: string;
    steps: number;
    source: string;
    time: string;
  }>;
};

const QUICK = [1000, 2500, 5000, 10000];

export default function StepsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<StepSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [stepsInput, setStepsInput] = useState("1000");
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);

  const load = useCallback(async () => {
    try {
      const [stepsRes, profileRes] = await Promise.all([
        fetch("/api/steps/log"),
        fetch("/api/profile"),
      ]);
      if (stepsRes.ok) setSummary(await stepsRes.json());
      if (profileRes.ok) {
        const p = await profileRes.json();
        if (p.weight) setWeightKg(p.weight);
        if (p.height) setHeightCm(p.height);
      }
    } catch {
      toast.error("Adım verisi yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const preview = useMemo(() => {
    const n = Math.max(0, Math.floor(Number(stepsInput) || 0));
    return calculateStepCalories({
      steps: n,
      weightKg,
      heightCm,
    });
  }, [stepsInput, weightKg, heightCm]);

  const addSteps = async (amount?: number) => {
    const steps = amount ?? Math.floor(Number(stepsInput) || 0);
    if (steps < 1) {
      toast.error("Geçerli bir adım girin");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/steps/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, source: "MANUAL" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Kaydedilemedi");
        return;
      }
      const data = await res.json();
      setSummary(data);
      toast.success(`${steps.toLocaleString("tr-TR")} adım eklendi`);
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const removeLog = async (id: string) => {
    try {
      const res = await fetch(`/api/steps/log?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Silinemedi");
        return;
      }
      const data = await res.json();
      setSummary(data);
      toast.success("Kayıt silindi");
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  const suggestTarget = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/steps/ai-target", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Öneri alınamadı");
        return;
      }
      const put = await fetch("/api/steps/target", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: data.suggestedTarget }),
      });
      if (!put.ok) {
        toast.error("Hedef kaydedilemedi");
        return;
      }
      toast.success(
        `Hedef ${data.suggestedTarget.toLocaleString("tr-TR")} adım — ${data.reason}`
      );
      await load();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[#EAEAEA]/60"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Adım Ekle</h1>
            <p className="text-sm text-[#EAEAEA]/50">
              Günlük yürüyüş / adım kaydı
            </p>
          </div>
        </div>

        <StepsPlatformNotice />

        <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Footprints className="h-5 w-5 text-[#a29bfe]" />
                <span className="font-semibold">Bugün</span>
              </div>
              <span className="font-stat text-sm text-[#EAEAEA]/60">
                {(summary?.totalSteps || 0).toLocaleString("tr-TR")} /{" "}
                {(summary?.stepTarget || 10000).toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#0f1424]">
              <div
                className="h-full rounded-full bg-[#a29bfe] transition-all"
                style={{ width: `${summary?.percentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-[#EAEAEA]/50">
              Tahmini yakılan:{" "}
              <span className="text-[#FFE66D]">
                ~{summary?.totalCalories || 0} kcal
              </span>
              {" · "}
              {summary?.distanceKm?.toFixed(2) || "0.00"} km
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              {QUICK.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[#EAEAEA]/20"
                  disabled={saving}
                  onClick={() => void addSteps(n)}
                >
                  +{n.toLocaleString("tr-TR")}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                step={100}
                value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)}
                className="h-11 rounded-xl bg-[#16213E]"
                placeholder="Adım sayısı"
              />
              <Button
                type="button"
                disabled={saving}
                className="h-11 rounded-xl bg-[#FF6B35] px-5 hover:bg-[#E55A25]"
                onClick={() => void addSteps()}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Kaydet"
                )}
              </Button>
            </div>

            <p className="text-xs text-[#EAEAEA]/50">
              Bu giriş için tahmini: ~{preview.calories} kcal ·{" "}
              {preview.distanceKm.toFixed(2)} km (MET {preview.met})
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-[#a29bfe]/40 text-[#a29bfe]"
              disabled={aiLoading}
              onClick={() => void suggestTarget()}
            >
              {aiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              AI ile hedef öner
            </Button>
          </CardContent>
        </Card>

        {!!summary?.logs?.length && (
          <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
            <CardContent className="space-y-2 p-4">
              <h2 className="text-sm font-semibold text-[#EAEAEA]/70">
                Bugünkü kayıtlar
              </h2>
              {summary.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg bg-[#16213E] px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-stat">
                      {log.steps.toLocaleString("tr-TR")} adım
                    </span>
                    <span className="ml-2 text-[10px] text-[#EAEAEA]/40">
                      {log.source === "GOOGLE_HEALTH" ? "Google" : "Manuel"} ·{" "}
                      {new Date(log.time).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-[#EAEAEA]/40 hover:text-[#E74C3C]"
                    onClick={() => void removeLog(log.id)}
                    aria-label="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
