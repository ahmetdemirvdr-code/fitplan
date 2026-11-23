"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  TrendingUp,
  Scale,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Droplets,
  Dumbbell,
  Apple,
  Footprints,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { levelColor, type DayScoreLevel } from "@/lib/day-score";

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

type CalendarDay = {
  day: number;
  date: string;
  score: number;
  level: DayScoreLevel;
  points: { workout: number; steps: number; water: number; nutrition: number };
  workout: { needed: boolean; completed: boolean; name: string | null };
  steps: { count: number; target: number; pct: number; hasData: boolean };
  water: { ml: number; targetMl: number; pct: number };
  nutrition: {
    calories: number;
    target: number;
    pct: number;
    meals: number;
    protein: number;
  };
  weight: number | null;
};

type CalendarPayload = {
  year: number;
  month: number;
  days: CalendarDay[];
  streak: number;
  monthAvg: number;
  totalPoints: number;
  todayScore: number;
  encouragement: string;
  targets: { calorie: number; waterMl: number; waterL: number; steps: number };
};

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const DAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function getCalendarCells(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default function ProgressPage() {
  const now = useMemo(() => new Date(), []);
  const [data, setData] = useState<ProgressData[]>([]);
  const [calendar, setCalendar] = useState<CalendarPayload | null>(null);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
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
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Progress fetch error:", err);
    }
  }, []);

  const fetchCalendar = useCallback(async (year: number, monthIndex: number) => {
    try {
      const res = await fetch(
        `/api/progress/calendar?year=${year}&month=${monthIndex + 1}`
      );
      if (res.ok) setCalendar(await res.json());
    } catch (err) {
      console.error("Calendar fetch error:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchProgress(),
        fetchCalendar(viewYear, viewMonth),
      ]);
      setLoading(false);
    })();
  }, [fetchProgress, fetchCalendar, viewYear, viewMonth]);

  const saveMeasurements = async () => {
    setSaving(true);
    try {
      const body: Record<string, number | null> = {};
      if (measurements.weight) body.weight = parseFloat(measurements.weight);
      if (measurements.chestMeasure)
        body.chestMeasure = parseFloat(measurements.chestMeasure);
      if (measurements.waistMeasure)
        body.waistMeasure = parseFloat(measurements.waistMeasure);
      if (measurements.hipMeasure)
        body.hipMeasure = parseFloat(measurements.hipMeasure);
      if (measurements.armMeasure)
        body.armMeasure = parseFloat(measurements.armMeasure);

      if (Object.keys(body).length === 0) {
        toast.error("En az bir ölçüm girin");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Ölçümler kaydedildi!");
        setMeasurements({
          weight: "",
          chestMeasure: "",
          waistMeasure: "",
          hipMeasure: "",
          armMeasure: "",
        });
        fetchProgress();
        fetchCalendar(viewYear, viewMonth);
      } else {
        toast.error("Kayıt sırasında hata oluştu");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const cells = getCalendarCells(viewYear, viewMonth);
  const dayMap = useMemo(() => {
    const m = new Map<number, CalendarDay>();
    calendar?.days.forEach((d) => m.set(d.day, d));
    return m;
  }, [calendar]);

  const selected = selectedDay ? dayMap.get(selectedDay) : null;
  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const isFutureDay = (day: number | null) => {
    if (!day) return false;
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    const t = new Date(now);
    t.setHours(0, 0, 0, 0);
    return date > t;
  };

  const prevMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const weightData = data.filter((d) => d.weight != null);
  const latestWeight =
    weightData.length > 0 ? weightData[weightData.length - 1].weight : null;
  const firstWeight = weightData.length > 0 ? weightData[0].weight : null;
  const weightChange =
    latestWeight && firstWeight ? latestWeight - firstWeight : null;
  const totalWorkouts = data.reduce((s, d) => s + d.workoutsCompleted, 0);

  if (loading && !calendar) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">İlerleme</h1>
          <p className="text-muted-foreground">
            Günlük kayıtların, takvim ve Strive Puan
          </p>
        </div>

        {/* Score / streak strip */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Card className="border-[#FF6B35]/20">
            <CardContent className="p-3 text-center">
              <Trophy className="mx-auto mb-1 h-4 w-4 text-[#FF6B35]" />
              <p className="text-xl font-bold tabular-nums text-[#FF6B35]">
                {calendar?.todayScore ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Bugün puan</p>
            </CardContent>
          </Card>
          <Card className="border-[#F1C40F]/20">
            <CardContent className="p-3 text-center">
              <Flame className="mx-auto mb-1 h-4 w-4 text-[#F1C40F]" />
              <p className="text-xl font-bold tabular-nums text-[#F1C40F]">
                {calendar?.streak ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Gün seri</p>
            </CardContent>
          </Card>
          <Card className="border-[#4ECDC4]/20">
            <CardContent className="p-3 text-center">
              <TrendingUp className="mx-auto mb-1 h-4 w-4 text-[#4ECDC4]" />
              <p className="text-xl font-bold tabular-nums text-[#4ECDC4]">
                {calendar?.monthAvg ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Ay ort.</p>
            </CardContent>
          </Card>
        </div>

        {calendar?.encouragement && (
          <div className="mb-4 rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-4 py-3 text-sm text-[#EAEAEA]/90">
            {calendar.encouragement}
          </div>
        )}

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Takvim</TabsTrigger>
            <TabsTrigger value="overview">Özet</TabsTrigger>
            <TabsTrigger value="measure">Ölçüm</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-1 font-semibold">Aktivite Takvimi</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Renkler günlük Strive Puan’a göre. Güne dokunup antrenman, su ve
                  beslenme dengesini gör.
                </p>

                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="rounded-xl bg-[#16213E] p-2"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-semibold">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="rounded-xl bg-[#16213E] p-2"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="mb-1 grid grid-cols-7 gap-1">
                  {DAY_LABELS.map((d) => (
                    <div
                      key={d}
                      className="py-1 text-center text-xs text-muted-foreground"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    const info = day ? dayMap.get(day) : null;
                    const future = isFutureDay(day);
                    const color = !day
                      ? "transparent"
                      : future
                        ? "#1A1A2E"
                        : levelColor(info?.level || "empty");
                    const isToday = isCurrentMonth && day === now.getDate();
                    const isSelected = day === selectedDay;
                    return (
                      <button
                        key={`${viewYear}-${viewMonth}-${i}`}
                        type="button"
                        disabled={!day || future}
                        onClick={() =>
                          day &&
                          !future &&
                          setSelectedDay(day === selectedDay ? null : day)
                        }
                        className="relative flex aspect-square items-center justify-center rounded-xl text-xs font-medium transition"
                        style={{
                          backgroundColor: day ? color : "transparent",
                          color:
                            !day || future || info?.level === "empty"
                              ? "#6B7280"
                              : "#fff",
                          border: isSelected
                            ? "2px solid #FF6B35"
                            : isToday
                              ? "2px solid #FF6B3588"
                              : "2px solid transparent",
                          opacity: day ? 1 : 0,
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    { color: "#2ECC71", label: "İyi (75+)" },
                    { color: "#F1C40F", label: "Orta (40–74)" },
                    { color: "#E74C3C", label: "Zayıf (<40)" },
                    { color: "#243044", label: "Kayıt yok" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selected && (
              <Card className="border-[#FF6B35]/25">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {selected.day} {MONTH_NAMES[viewMonth]} {viewYear}
                    </h3>
                    <span className="text-lg font-bold tabular-nums text-[#FF6B35]">
                      {selected.score}
                      <span className="text-xs font-normal text-muted-foreground">
                        /100
                      </span>
                    </span>
                  </div>

                  {selected.level === "empty" ? (
                    <p className="text-sm text-muted-foreground">
                      Bu gün için henüz kayıt yok. Antrenman, su veya yemek
                      ekleyince puan oluşur.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 text-sm">
                        <ScoreRow
                          icon={<Dumbbell className="h-4 w-4 text-[#FF6B35]" />}
                          label={
                            selected.workout.needed
                              ? selected.workout.name || "Antrenman"
                              : "Dinlenme günü"
                          }
                          detail={
                            selected.workout.needed
                              ? selected.workout.completed
                                ? "Tamamlandı"
                                : "Yapılmadı"
                              : "Antrenman yok"
                          }
                          pts={selected.points.workout}
                          max={selected.steps?.hasData ? 30 : 40}
                          done={
                            !selected.workout.needed ||
                            selected.workout.completed
                          }
                        />
                        {selected.steps?.hasData && (
                          <ScoreRow
                            icon={
                              <Footprints className="h-4 w-4 text-[#a29bfe]" />
                            }
                            label="Adım"
                            detail={`${selected.steps.count.toLocaleString("tr-TR")} / ${selected.steps.target.toLocaleString("tr-TR")}`}
                            pts={selected.points.steps}
                            max={15}
                            done={selected.steps.pct >= 80}
                          />
                        )}
                        <ScoreRow
                          icon={<Droplets className="h-4 w-4 text-[#4ECDC4]" />}
                          label="Su"
                          detail={`${(selected.water.ml / 1000).toFixed(1)} / ${(selected.water.targetMl / 1000).toFixed(1)} L`}
                          pts={selected.points.water}
                          max={selected.steps?.hasData ? 25 : 30}
                          done={selected.water.pct >= 80}
                        />
                        <ScoreRow
                          icon={<Apple className="h-4 w-4 text-[#F1C40F]" />}
                          label="Beslenme"
                          detail={
                            selected.nutrition.meals
                              ? `${selected.nutrition.calories} / ${selected.nutrition.target} kcal · ${selected.nutrition.meals} öğün`
                              : "Öğün kaydı yok"
                          }
                          pts={selected.points.nutrition}
                          max={30}
                          done={selected.nutrition.meals > 0}
                        />
                      </div>
                      {selected.weight != null && (
                        <p className="text-xs text-muted-foreground">
                          Kilo kaydı: {selected.weight} kg
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 font-semibold">Strive Puan nasıl işler?</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>
                    • Adım kaydı yoksa: Antrenman 40 + Su 30 + Beslenme 30
                  </li>
                  <li>
                    • Adım kaydı varsa: Antrenman 30 + Adım 15 + Su 25 +
                    Beslenme 30
                  </li>
                  <li>• Adım / su hedefe orantılı; beslenme öğün + kalori</li>
                  <li>• 40+ puan günler seri (streak) sayılır</li>
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Bu ay toplam:{" "}
                  <span className="font-semibold text-[#EAEAEA]">
                    {calendar?.totalPoints ?? 0} puan
                  </span>
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Scale className="h-5 w-5 text-[#4ECDC4]" />}
                label="Güncel Kilo"
                value={latestWeight ? `${latestWeight} kg` : "-"}
                sub={
                  weightChange !== null
                    ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`
                    : undefined
                }
                subColor={
                  weightChange !== null && weightChange < 0
                    ? "text-[#2ECC71]"
                    : weightChange !== null && weightChange > 0
                      ? "text-[#E74C3C]"
                      : undefined
                }
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-[#FF6B35]" />}
                label="Antrenman"
                value={`${totalWorkouts}`}
                sub="tamamlandı"
              />
              <StatCard
                icon={<Flame className="h-5 w-5 text-[#F1C40F]" />}
                label="Seri"
                value={`${calendar?.streak ?? 0}`}
                sub="gün"
              />
              <StatCard
                icon={<Trophy className="h-5 w-5 text-[#4ECDC4]" />}
                label="Ay Ort. Puan"
                value={`${calendar?.monthAvg ?? 0}`}
                sub="/100"
              />
            </div>

            {weightData.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 font-semibold">Kilo Geçmişi</h3>
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
          </TabsContent>

          <TabsContent value="measure" className="mt-4">
            <Card>
              <CardContent className="space-y-4 p-4">
                <h3 className="font-semibold">Bugünün Ölçümleri</h3>
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
                      placeholder="Örneğin: 75.5"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["chestMeasure", "Göğüs (cm)"],
                        ["waistMeasure", "Bel (cm)"],
                        ["hipMeasure", "Kalça (cm)"],
                        ["armMeasure", "Kol (cm)"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={key}>{label}</Label>
                        <Input
                          id={key}
                          type="number"
                          step="0.1"
                          value={measurements[key]}
                          onChange={(e) =>
                            setMeasurements((p) => ({
                              ...p,
                              [key]: e.target.value,
                            }))
                          }
                          className="h-12 rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="h-12 w-full rounded-xl bg-[#FF6B35] shadow-lg shadow-[#FF6B35]/25 hover:bg-[#E55A25]"
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

function ScoreRow({
  icon,
  label,
  detail,
  pts,
  max,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  pts: number;
  max: number;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[#16213E] p-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{label}</p>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {pts}/{max}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1A1A2E]">
          <div
            className="h-full rounded-full bg-[#FF6B35]"
            style={{ width: `${Math.min(100, (pts / max) * 100)}%` }}
          />
        </div>
      </div>
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-[#2ECC71]/20 text-[#2ECC71]" : "bg-[#E74C3C]/15 text-[#E74C3C]"
        }`}
      >
        {done ? <Check size={12} /> : <X size={12} />}
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
          <div
            className={`mt-1 text-xs font-medium ${subColor || "text-muted-foreground"}`}
          >
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
