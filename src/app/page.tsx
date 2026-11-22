import Link from "next/link";
import { Dumbbell, Apple, Droplets, TrendingUp, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-700 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-md px-6 py-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            <Zap className="h-4 w-4" />
            AI Destekli Fitness Asistani
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Hedeflerine Ozel
            <br />
            <span className="text-green-200">Spor & Beslenme</span>
            <br />
            Plani
          </h1>
          <p className="mb-8 text-lg text-green-100">
            Yapay zeka ile sana ozel antrenman programi ve beslenme plani.
            Gunluk takip, kalori hesaplama ve ilerleme analizi.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full bg-white text-green-700 hover:bg-green-50 font-semibold text-lg h-14 rounded-xl"
              >
                Ucretsiz Basla
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/40 text-white hover:bg-white/10 font-medium h-12 rounded-xl"
              >
                Giris Yap
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-md px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
          Neler Sunuyoruz?
        </h2>
        <div className="grid gap-4">
          <FeatureCard
            icon={<Dumbbell className="h-6 w-6 text-green-600" />}
            title="Kisisel Antrenman Programi"
            description="Seviyene ve hedeflerine gore AI tarafindan olusturulan haftalik spor programi"
          />
          <FeatureCard
            icon={<Apple className="h-6 w-6 text-orange-500" />}
            title="Beslenme Plani & Kalori Takibi"
            description="Yediklerini yaz, AI kalori ve makro degerlerini hesaplasin. Gunluk hedeflerini takip et."
          />
          <FeatureCard
            icon={<Droplets className="h-6 w-6 text-blue-500" />}
            title="Su Takibi"
            description="Gunluk su tuketimini takip et, hatirlatmalar al"
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
            title="Ilerleme Analizi"
            description="Kilo, olcu ve performans grafiklerinle ilerlemeni gor"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6 text-emerald-600" />}
            title="12 Haftalik Program Dongusu"
            description="Her 12 haftada ilerlemene gore planin otomatik guncellenir"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-12">
        <div className="mx-auto max-w-md px-6">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Nasil Calisiyor?
          </h2>
          <div className="space-y-6">
            <Step number={1} title="Kayit Ol" desc="E-posta ile hizlica kayit ol" />
            <Step number={2} title="Sorulari Yanitla" desc="7 adimda sana ozel bilgilerini paylas" />
            <Step number={3} title="Planini Al" desc="AI sana ozel spor ve beslenme plani olustursun" />
            <Step number={4} title="Takip Et" desc="Gunluk antrenman, yemek ve su takibini yap" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-md px-6 py-12 text-center">
        <h2 className="mb-4 text-2xl font-bold">Hemen Basla!</h2>
        <p className="mb-6 text-muted-foreground">
          Ilk planin ucretsiz. 7 gun boyunca tum ozellikleri dene.
        </p>
        <Link href="/register">
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 font-semibold text-lg h-14 rounded-xl"
          >
            Ucretsiz Kayit Ol
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; 2024 FitPlan. Tum haklar saklidir.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
