"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Scale,
  Ruler,
  Loader2,
  Save,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface ProgressData {
  date: string;
  weight: number | null;
  chestMeasure: number | null;
  waistMeasure: number | null;
  hipMeasure: number | null;
  armMeasure: number | null;
  totalCalories: number;
  totalProtein: number;
  totalWaterMl: number;
  workoutsCompleted: number;
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [measurements, setMeasurements] = useState({
    weight: "",
    chestMeasure: "",
    waistMeasure: "",
    hipMeasure: "",
    armMeasure: "",
  });

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/progress?range=month");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Progress fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const saveMeasurements = async () => {
    setSaving(true);
    try {
      const body: Record<string, number | null> = {};
      if (measurements.weight) body.weight = parseFloat(measurements.weight);
      if (measurements.chestMeasure) body.chestMeasure = parseFloat(measurements.chestMeasure);
      if (measurements.waistMeasure) body.waistMeasure = parseFloat(measurements.waistMeasure);
      if (measurements.hipMeasure) body.hipMeasure = parseFloat(measurements.hipMeasure);
      if (measurements.armMeasure) body.armMeasure = parseFloat(measurements.armMeasure);

      if (Object.keys(body).length === 0) {
        toast.error("En az bir olcum girin");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Olcumler kaydedildi!");
        setMeasurements({
          weight: "",
          chestMeasure: "",
          waistMeasure: "",
          hipMeasure: "",
          armMeasure: "",
        });
        fetchProgress();
      } else {
        toast.error("Kayit sirasinda hata olustu");
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Compute stats
  const weightData = data.filter((d) => d.weight != null);
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;
  const firstWeight = weightData.length > 0 ? weightData[0].weight : null;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  const totalWorkouts = data.reduce((s, d) => s + d.workoutsCompleted, 0);
  const avgCalories =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.totalCalories, 0) / data.length)
      : 0;

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Ilerleme</h1>
          <p className="text-muted-foreground">Son 30 gunluk ozet</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Ozet</TabsTrigger>
            <TabsTrigger value="measure">Olcum Ekle</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Scale className="h-5 w-5 text-blue-600" />}
                label="Guncel Kilo"
                value={latestWeight ? `${latestWeight} kg` : "-"}
                sub={
                  weightChange !== null
                    ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`
                    : undefined
                }
                subColor={
                  weightChange !== null && weightChange < 0
                    ? "text-green-600"
                    : weightChange !== null && weightChange > 0
                    ? "text-red-500"
                    : undefined
                }
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                label="Antrenman"
                value={`${totalWorkouts}`}
                sub="tamamlandi"
              />
              <StatCard
                icon={
                  <div className="text-orange-500 font-bold text-sm">kcal</div>
                }
                label="Ort. Kalori"
                value={`${avgCalories}`}
                sub="kcal/gun"
              />
              <StatCard
                icon={<Ruler className="h-5 w-5 text-purple-600" />}
                label="Kayit Gunu"
                value={`${data.length}`}
                sub="gun"
              />
            </div>

            {/* Weight History */}
            {weightData.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 font-semibold">Kilo Gecmisi</h3>
                  <div className="space-y-2">
                    {weightData.slice(-7).map((d) => (
                      <div
                        key={d.date}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {new Date(d.date).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="font-medium">{d.weight} kg</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <TrendingUp className="mx-auto mb-2 h-8 w-8" />
                  <p>Henuz ilerleme verisi yok.</p>
                  <p className="text-sm">
                    Yemek, su ve antrenman takibi yaptikca burada gorunecek.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="measure" className="mt-4">
            <Card>
              <CardContent className="space-y-4 p-4">
                <h3 className="font-semibold">Bugunun Olcumleri</h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="weight">Kilo (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={measurements.weight}
                      onChange={(e) =>
                        setMeasurements((p) => ({
                          ...p,
                          weight: e.target.value,
                        }))
                      }
                      placeholder="Ornegin: 75.5"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="chest">Gogus (cm)</Label>
                      <Input
                        id="chest"
                        type="number"
                        step="0.1"
                        value={measurements.chestMeasure}
                        onChange={(e) =>
                          setMeasurements((p) => ({
                            ...p,
                            chestMeasure: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="waist">Bel (cm)</Label>
                      <Input
                        id="waist"
                        type="number"
                        step="0.1"
                        value={measurements.waistMeasure}
                        onChange={(e) =>
                          setMeasurements((p) => ({
                            ...p,
                            waistMeasure: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hip">Kalca (cm)</Label>
                      <Input
                        id="hip"
                        type="number"
                        step="0.1"
                        value={measurements.hipMeasure}
                        onChange={(e) =>
                          setMeasurements((p) => ({
                            ...p,
                            hipMeasure: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="arm">Kol (cm)</Label>
                      <Input
                        id="arm"
                        type="number"
                        step="0.1"
                        value={measurements.armMeasure}
                        onChange={(e) =>
                          setMeasurements((p) => ({
                            ...p,
                            armMeasure: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700"
                  onClick={saveMeasurements}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Kaydet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && (
          <div className={`mt-1 text-xs font-medium ${subColor || "text-muted-foreground"}`}>
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
