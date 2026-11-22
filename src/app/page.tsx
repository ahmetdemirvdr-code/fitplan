import Link from "next/link";
import { Dumbbell, Apple, Droplets, TrendingUp, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #0a0a0f 0%, #1A1A2E 45%, #16213E 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(255,107,53,0.22) 0%, transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-md px-6 pb-14 pt-10 text-center">
          <div className="mb-8 flex justify-center">
            <BrandLogo height={72} priority className="drop-shadow-lg" />
          </div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            <Zap className="h-4 w-4 text-[#FFE66D]" />
            AI Destekli Fitness Asistanı
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Hedeflerine Özel
            <br />
            <span className="text-[#FF6B35]">Spor & Beslenme</span>
          </h1>
          <p className="mb-8 text-lg text-[#EAEAEA]/70">
            Yapay zeka ile sana özel antrenman ve beslenme planı. Günlük takip,
            kalori hesabı ve ilerleme analizi.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 w-full rounded-xl text-lg font-semibold text-white shadow-lg shadow-[#FF6B35]/25"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #ff8c5a)",
                }}
              >
                Ücretsiz Başla
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-xl border-white/20 font-medium text-white hover:bg-white/10"
              >
                Giriş Yap
              </Button>
            </Link>
          </div>
        </div>
      </header>

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

      <section className="bg-muted/50 py-12">
        <div className="mx-auto max-w-md px-6">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Nasıl Çalışıyor?
          </h2>
          <div className="space-y-6">
            <Step number={1} title="Kayıt Ol" desc="E-posta ile hızlıca kayıt ol" />
            <Step
              number={2}
              title="Soruları Yanıtla"
              desc="7 adımda sana özel bilgilerini paylaş"
            />
            <Step
              number={3}
              title="Planını Al"
              desc="AI sana özel spor ve beslenme planı oluştursun"
            />
            <Step
              number={4}
              title="Takip Et"
              desc="Günlük antrenman, yemek ve su takibini yap"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-md px-6 py-12 text-center">
        <div className="mb-4 flex justify-center">
          <BrandLogo height={48} />
        </div>
        <h2 className="mb-4 text-2xl font-bold">Hemen Başla!</h2>
        <p className="mb-6 text-muted-foreground">
          İlk planın ücretsiz. 7 gün boyunca tüm özellikleri dene.
        </p>
        <Link href="/register">
          <Button
            size="lg"
            className="h-14 w-full rounded-xl text-lg font-semibold text-white shadow-lg shadow-[#FF6B35]/25"
            style={{ background: "linear-gradient(135deg, #FF6B35, #ff8c5a)" }}
          >
            Ücretsiz Kayıt Ol
          </Button>
        </Link>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Strive. Tüm hakları saklıdır.</p>
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
    <div className="flex gap-4 rounded-2xl border border-[#EAEAEA]/10 bg-[#16213E]/40 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/10">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-sm font-bold text-white">
        {number}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
