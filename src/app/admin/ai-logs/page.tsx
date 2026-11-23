"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquareText, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ChatMessage = { role?: string; content?: string };

type AiLog = {
  id: string;
  purpose: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  displayCostUsd: number;
  requestMessages: ChatMessage[] | null;
  responseContent: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
};

const PURPOSE_LABELS: Record<string, string> = {
  plan_generate: "Plan oluştur",
  plan_import_workout: "Program aktar (antrenman)",
  plan_import_meals: "Program aktar (beslenme)",
};

const FILTERS = [
  { value: "", label: "Tüm plan istekleri" },
  { value: "plan_generate", label: "Plan oluştur" },
  { value: "plan_import_workout", label: "Aktarım — antrenman" },
  { value: "plan_import_meals", label: "Aktarım — beslenme" },
];

export default function AdminAiLogsPage() {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [purpose, setPurpose] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: "50" });
      if (purpose) params.set("purpose", purpose);
      const res = await fetch(`/api/admin/ai-logs?${params}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      toast.error("AI logları yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [purpose]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Plan AI istekleri</h1>
        <p className="text-sm text-[#EAEAEA]/50">
          Geliştirme: kullanıcıların plan oluştururken gönderdiği prompt mesajları
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value || "all"}
            type="button"
            size="sm"
            variant={purpose === f.value ? "default" : "outline"}
            className={
              purpose === f.value
                ? "rounded-full bg-[#FF6B35] hover:bg-[#E55A25]"
                : "rounded-full border-[#EAEAEA]/20"
            }
            onClick={() => setPurpose(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
          <CardContent className="p-6 text-sm text-[#EAEAEA]/50">
            Henüz kayıtlı plan AI isteği yok. Yeni plan oluşturulunca burada
            görünecek.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const open = expanded === log.id;
            const messages = Array.isArray(log.requestMessages)
              ? log.requestMessages
              : [];
            return (
              <Card
                key={log.id}
                className="border-[#EAEAEA]/10 bg-[#1A1A2E] overflow-hidden"
              >
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5"
                    onClick={() => setExpanded(open ? null : log.id)}
                  >
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#a29bfe]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {PURPOSE_LABELS[log.purpose] || log.purpose}
                        </Badge>
                        <span className="text-xs text-[#EAEAEA]/40">
                          {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm">
                        {log.user ? (
                          <Link
                            href={`/admin/users/${log.user.id}`}
                            className="text-[#4ECDC4] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.user.name || log.user.email}
                          </Link>
                        ) : (
                          <span className="text-[#EAEAEA]/50">Anonim</span>
                        )}
                        <span className="text-[#EAEAEA]/40">
                          {" "}
                          · {log.model} · {log.promptTokens}+
                          {log.completionTokens} tok · $
                          {log.displayCostUsd.toFixed(4)}
                        </span>
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[#EAEAEA]/40" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#EAEAEA]/40" />
                    )}
                  </button>

                  {open && (
                    <div className="space-y-3 border-t border-[#EAEAEA]/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#EAEAEA]/40">
                        İstek mesajları
                      </p>
                      {messages.length === 0 ? (
                        <p className="text-sm text-[#EAEAEA]/50">
                          Bu kayıtta mesaj yok (eski çağrı veya kaydedilmemiş).
                        </p>
                      ) : (
                        messages.map((msg, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-[#EAEAEA]/10 bg-[#0f1424] p-3"
                          >
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#FF6B35]">
                              {msg.role || "message"}
                            </p>
                            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[#EAEAEA]/85">
                              {msg.content || "—"}
                            </pre>
                          </div>
                        ))
                      )}

                      {log.responseContent && (
                        <div>
                          <button
                            type="button"
                            className="mb-2 text-xs font-semibold text-[#4ECDC4] hover:underline"
                            onClick={() =>
                              setShowResponse((s) => ({
                                ...s,
                                [log.id]: !s[log.id],
                              }))
                            }
                          >
                            {showResponse[log.id]
                              ? "Yanıtı gizle"
                              : "Model yanıtını göster"}
                          </button>
                          {showResponse[log.id] && (
                            <pre className="max-h-96 overflow-auto rounded-xl border border-[#EAEAEA]/10 bg-[#0f1424] p-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[#EAEAEA]/70">
                              {log.responseContent}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
