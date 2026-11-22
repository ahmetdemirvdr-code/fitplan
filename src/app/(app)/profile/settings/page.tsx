"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Moon, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Ayarlar</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-semibold">Bildirimler</Label>
                  <p className="text-sm text-muted-foreground">
                    Su, yemek ve antrenman hatirlatmalari
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Bildirim ayarlari yaklasimda...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-semibold">Tema</Label>
                  <p className="text-sm text-muted-foreground">
                    Acik / Koyu tema tercihi
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Tema ayarlari yaklasimda...
              </p>
            </CardContent>
          </Card>

          <Separator />

          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <Label className="font-semibold text-destructive">
                    Hesabi Sil
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tum verilerin kalici olarak silinir
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Bu ozellik yaklasimda...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
