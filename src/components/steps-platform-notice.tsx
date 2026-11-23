import { Smartphone } from "lucide-react";

export function StepsPlatformNotice({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex gap-2 rounded-xl border border-[#FFE66D]/25 bg-[#FFE66D]/10 px-3 py-2.5 text-xs leading-relaxed text-[#EAEAEA]/80 ${className}`}
    >
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#FFE66D]" />
      <p>
        Bu özellik telefonunuzdaki sağlık uygulamasından (Samsung Health, Google
        Fit vb.) adım sayınızı görüp buraya girmeniz içindir. Otomatik senkron
        şu an Android / Google Fit odaklıdır; iOS HealthKit desteği yoktur.
      </p>
    </div>
  );
}
