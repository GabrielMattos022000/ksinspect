import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface StatusItem {
  line_name: string;
  machine_name: string;
  machine_group: string;
  overall_result: string | null;
  finished_at: string | null;
  product_name: string;
  operator_badge: string;
}

const MACHINE_GROUPS = ["Cilmop", "Gasolina", "Diesel", "Casting"];

export default function DashboardPage() {
  const [items, setItems] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then((data) => {
      setItems(data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold sr-only">Status das Linhas / Máquinas</h2>
        <p className="text-center text-muted-foreground">Nenhuma medição finalizada ainda.</p>
      </div>
    );
  }

  const grouped = MACHINE_GROUPS.reduce<Record<string, StatusItem[]>>((acc, g) => {
    acc[g] = items.filter((item) => item.machine_group === g);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold sr-only">Status das Linhas / Máquinas</h2>
      {MACHINE_GROUPS.map((group) => {
        const groupItems = grouped[group];
        if (groupItems.length === 0) return null;

        const okCount = groupItems.filter((i) => i.overall_result === "OK").length;
        const nokCount = groupItems.filter((i) => i.overall_result !== "OK").length;

        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-3 border-b pb-2">
              <h3 className="text-base font-semibold">{group}</h3>
              <span className="text-xs text-muted-foreground">{groupItems.length} máquina(s)</span>
              {okCount > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-success/50 text-success bg-success/10">
                  <CheckCircle2 className="h-3 w-3" /> {okCount} OK
                </Badge>
              )}
              {nokCount > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-destructive/50 text-destructive bg-destructive/10">
                  <XCircle className="h-3 w-3" /> {nokCount} NOK
                </Badge>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupItems.map((item, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.line_name} / {item.machine_name}</CardTitle>
                      {item.overall_result === "OK" ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <XCircle className="h-6 w-6 text-destructive" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <Badge className={item.overall_result === "OK" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                      {item.overall_result}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.finished_at ? new Date(item.finished_at).toLocaleString("pt-BR") : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">OP: {item.operator_badge}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
