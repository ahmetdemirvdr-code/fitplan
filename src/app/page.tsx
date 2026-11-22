import Link from "next/link";
import { Dumbbell, Apple, Droplets, TrendingUp, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="relative overflow-hidden text-white" style={{background: "linear-gradient(135deg, #1A1A2E 0%, #1E2D4A 50%, #16213E 100%)"}}>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 30% 50%, rgba(255,107,53,0.15) 0%, transparent 60%)"}} />
        <div className="relative mx-auto max-w-md px-6 py-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-white/10">
            <Zap className="h-4 w-4 text-[#FFE66D]" />
            AI Destekli Fitness Asistanı
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Hedeflerine Özel
            <br />
            <span className="text-[#FF6B35]">Spor & Beslenme</span>
            <br />
            Planı
          </h1>
          <p className="mb-8 text-lg text-[#EAEAEA]/70">
            Yapay zeka ile sana özel antrenman programı ve beslenme planı.
            Günlük takip, kalori hesaplama ve ilerleme analizi.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full font-semibold text-lg h-14 rounded-xl text-white shadow-lg shadow-[#FF6B35]/25"
                style={{background: "linear-gradient(135deg, #FF6B35, #ff8c5a)"}}
              >
                Ücretsiz Başla
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/20 text-white hover:bg-white/10 font-medium h-12 rounded-xl"
              >
                Giriş Yap
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
            icon={<Dumbbell className="h-6 w-6 text-[#FF6B35]" />}
            title="Kişisel Antrenman Programı"
            description="Seviyene ve hedeflerine göre AI tarafından oluşturulan haftalık spor programı"
          />
          <FeatureCard
            icon={<Apple className="h-6 w-6 text-[#FF6B35]" />}
            title="Beslenme Planı & Kalori Takibi"
            description="Yediklerini yaz, AI kalori ve makro değerlerini hesaplasın. Günlük hedeflerini takip et."
          />
          <FeatureCard
            icon={<Droplets className="h-6 w-6 text-[#4ECDC4]" />}
            title="Su Takibi"
            description="Günlük su tüketimini takip et, hatırlatmalar al"
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6 text-[#a29bfe]" />}
            title="İlerleme Analizi"
            description="Kilo, ölçü ve performans grafiklerinle ilerlemeni gör"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6 text-[#4ECDC4]" />}
            title="12 Haftalık Program Döngüsü"
            description="Her 12 haftada ilerlemene göre planın otomatik güncellenir"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-12">
        <div className="mx-auto max-w-md px-6">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Nasıl Çalışıyor?
          </h2>
          <div className="space-y-6">
            <Step number={1} title="Kayıt Ol" desc="E-posta ile hızlıca kayıt ol" />
            <Step number={2} title="Soruları Yanıtla" desc="7 adımda sana özel bilgilerini paylaş" />
            <Step number={3} title="Planını Al" desc="AI sana özel spor ve beslenme planı oluştursun" />
            <Step number={4} title="Takip Et" desc="Günlük antrenman, yemek ve su takibini yap" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-md px-6 py-12 text-center">
        <h2 className="mb-4 text-2xl font-bold">Hemen Başla!</h2>
        <p className="mb-6 text-muted-foreground">
          İlk planın ücretsiz. 7 gün boyunca tüm özellikleri dene.
        </p>
        <Link href="/register">
          <Button
            size="lg"
            className="w-full font-semibold text-lg h-14 rounded-xl text-white shadow-lg shadow-[#FF6B35]/25"
            style={{background: "linear-gradient(135deg, #FF6B35, #ff8c5a)"}}
          >
            Ücretsiz Kayıt Ol
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; 2024 FitPlan. Tüm hakları saklıdır.</p>
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-white font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
