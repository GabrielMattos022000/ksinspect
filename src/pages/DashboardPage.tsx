import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface StatusItem {
  line_name: string;
  machine_name: string;
  overall_result: string | null;
  finished_at: string | null;
  product_name: string;
  operator_badge: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the latest finished cycle per machine
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("measurement_cycles")
        .select("id, overall_result, finished_at, operator_badge, lines(name), machines(name), products(formatted_name)")
        .eq("status", "FINISHED")
        .order("finished_at", { ascending: false })
        .limit(200);

      // Group by machine, keep latest only
      const byMachine = new Map<string, StatusItem>();
      (data ?? []).forEach((d: any) => {
        const machineKey = d.machines?.name + "_" + d.lines?.name;
        if (!byMachine.has(machineKey)) {
          byMachine.set(machineKey, {
            line_name: d.lines?.name ?? "",
            machine_name: d.machines?.name ?? "",
            overall_result: d.overall_result,
            finished_at: d.finished_at,
            product_name: d.products?.formatted_name ?? "",
            operator_badge: d.operator_badge,
          });
        }
      });
      setItems(Array.from(byMachine.values()));
      setLoading(false);
    };
    fetchStatus();
  }, []);

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Status das Linhas / Máquinas</h2>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhuma medição finalizada ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
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
      )}
    </div>
  );
}
