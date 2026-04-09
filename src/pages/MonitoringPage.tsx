import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LineStatus {
  line_id: string;
  line_name: string;
  line_group: string;
  machine_num: number;
  machine_id: string;
  overall_result: string | null;
  finished_at: string | null;
  product_name: string;
  operator_badge: string;
  interval_minutes: number;
}

const LINE_GROUPS = ["Cilmop", "Gasolina", "Diesel"];

function getDelayStatus(finishedAt: string | null, intervalMinutes: number) {
  if (!finishedAt || intervalMinutes <= 0) return "no_data";
  const lastMs = new Date(finishedAt).getTime();
  const nowMs = Date.now();
  const diffMinutes = (nowMs - lastMs) / 60000;
  return diffMinutes > intervalMinutes ? "atrasado" : "efetuado";
}

export default function MonitoringPage() {
  const [items, setItems] = useState<LineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState("all");
  const [cardSize, setCardSize] = useState<"sm" | "md" | "lg">("md");

  const fetchData = async () => {
    try {
      const data = await api.get("/monitoring");
      setItems(data ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  const filtered = filterGroup === "all" ? items : items.filter((i) => i.line_group === filterGroup);
  const grouped = LINE_GROUPS.reduce<Record<string, LineStatus[]>>((acc, g) => {
    acc[g] = filtered.filter((i) => i.line_group === g);
    return acc;
  }, {});

  const gridCols = {
    sm: "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10",
    md: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
    lg: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[cardSize];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <h2 className="text-xl font-semibold sr-only">Monitoramento</h2>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os grupos</SelectItem>
              {LINE_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {(["sm", "md", "lg"] as const).map((s) => (
            <Button
              key={s}
              variant={cardSize === s ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setCardSize(s)}
            >
              {s === "sm" ? "Mini" : s === "md" ? "Médio" : "Grande"}
            </Button>
          ))}
        </div>
      </div>

      {LINE_GROUPS.map((group) => {
        const groupItems = grouped[group];
        if (!groupItems || groupItems.length === 0) return null;

        const approvedCount = groupItems.filter((i) => i.overall_result === "OK").length;
        const rejectedCount = groupItems.filter((i) => i.overall_result === "NOK").length;
        const delayedCount = groupItems.filter((i) => getDelayStatus(i.finished_at, i.interval_minutes) === "atrasado").length;

        return (
          <div key={group} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 border-b pb-2">
              <h3 className="text-base font-semibold">{group}</h3>
              <span className="text-xs text-muted-foreground">{groupItems.length} linha(s)/máquina(s)</span>
              {approvedCount > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-success/50 text-success bg-success/10">
                  <CheckCircle2 className="h-3 w-3" /> {approvedCount} Aprovado
                </Badge>
              )}
              {rejectedCount > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-destructive/50 text-destructive bg-destructive/10">
                  <XCircle className="h-3 w-3" /> {rejectedCount} Reprovado
                </Badge>
              )}
              {delayedCount > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-warning/50 text-warning bg-warning/10">
                  <AlertTriangle className="h-3 w-3" /> {delayedCount} Atrasado
                </Badge>
              )}
            </div>

            <div className={cn("grid gap-3", gridCols)}>
              {groupItems.map((item) => {
                const delayStatus = getDelayStatus(item.finished_at, item.interval_minutes);
                const isOk = item.overall_result === "OK";
                const isNok = item.overall_result === "NOK";
                const isDelayed = delayStatus === "atrasado";
                const hasData = item.overall_result !== null;

                return (
                  <Card
                    key={`${item.line_id}_${item.machine_num}`}
                    className={cn(
                      "transition-all",
                      isNok && "border-destructive/50",
                      isDelayed && "border-warning/50",
                    )}
                  >
                    {cardSize === "sm" ? (
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-semibold truncate">{item.line_name}</p>
                        <div className="flex gap-1 flex-wrap">
                          {hasData && (
                            <Badge className={cn("text-[10px] px-1 py-0", isOk ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
                              {isOk ? "APROVADO" : "REPROVADO"}
                            </Badge>
                          )}
                          {isDelayed && (
                            <Badge className="text-[10px] px-1 py-0 bg-warning text-warning-foreground">ATRASADO</Badge>
                          )}
                          {!isDelayed && hasData && (
                            <Badge className="text-[10px] px-1 py-0 bg-muted text-muted-foreground">EFETUADO</Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardHeader className={cn("pb-2", cardSize === "lg" ? "p-4" : "p-3")}>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className={cn("leading-tight", cardSize === "lg" ? "text-base" : "text-sm")}>
                              {item.line_name}
                            </CardTitle>
                            {isOk ? (
                              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                            ) : isNok ? (
                              <XCircle className="h-5 w-5 text-destructive shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className={cn("space-y-2", cardSize === "lg" ? "p-4 pt-0" : "p-3 pt-0")}>
                          <div className="flex flex-wrap gap-1">
                            {hasData && (
                              <Badge className={cn("text-xs", isOk ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
                                {isOk ? "APROVADO" : "REPROVADO"}
                              </Badge>
                            )}
                            {isDelayed ? (
                              <Badge className="text-xs bg-warning text-warning-foreground">ATRASADO</Badge>
                            ) : hasData ? (
                              <Badge variant="outline" className="text-xs">EFETUADO</Badge>
                            ) : null}
                          </div>
                          {cardSize === "lg" && (
                            <>
                              <p className="text-xs text-muted-foreground truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.finished_at ? new Date(item.finished_at).toLocaleString("pt-BR") : "Sem medição"}
                              </p>
                              {hasData && <p className="text-xs text-muted-foreground">OP: {item.operator_badge}</p>}
                            </>
                          )}
                          {cardSize === "md" && item.finished_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.finished_at).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </CardContent>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhuma linha cadastrada.</p>
      )}
    </div>
  );
}
