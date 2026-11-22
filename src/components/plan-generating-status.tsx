"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type PlanGeneratingStatusProps = {
  title?: string;
  detail?: string;
  compact?: boolean;
};

export function PlanGeneratingStatus({
  title = "Planın Hazırlanıyor",
  detail = "AI planını oluşturuyor...",
  compact = false,
}: PlanGeneratingStatusProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const patience =
    elapsed < 45
      ? "Bu işlem genelde 1–2 dakika sürebilir. Lütfen sabırlı ol."
      : elapsed < 90
        ? "Hâlâ çalışıyor — biraz daha sabret, neredeyse bitti."
        : "Uzun programlarda bu süre normal. Sayfayı kapatma, beklemeye devam et.";

  if (compact) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Sparkles className="mb-4 h-10 w-10 animate-pulse text-[#FF6B35]" />
        <p className="font-medium text-[#EAEAEA]">{title}</p>
        <p className="mt-1 text-sm text-[#EAEAEA]/50">{detail}</p>
        <p className="mt-4 font-mono text-2xl font-semibold tabular-nums text-[#FF6B35]">
          {formatElapsed(elapsed)}
        </p>
        <p className="mt-3 max-w-xs text-sm text-[#EAEAEA]/55">{patience}</p>
        <Loader2 className="mt-6 h-7 w-7 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B35]/20">
          <Sparkles className="h-10 w-10 animate-pulse text-[#FF6B35]" />
        </div>
        <h2 className="mb-2 text-xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{detail}</p>
        <p className="mt-5 font-mono text-3xl font-semibold tabular-nums text-[#FF6B35]">
          {formatElapsed(elapsed)}
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          {patience}
        </p>
        <Loader2 className="mx-auto mt-6 h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    </div>
  );
}
