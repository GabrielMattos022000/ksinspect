import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface CycleRow {
  id: string;
  line_name: string;
  product_name: string;
  finished_at: string | null;
  operator_badge: string;
  overall_result: string | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("measurement_cycles")
      .select("id, finished_at, operator_badge, overall_result, lines(name), products(formatted_name)")
      .eq("status", "FINISHED")
      .order("finished_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setCycles(
          (data ?? []).map((d: any) => ({
            id: d.id,
            line_name: d.lines?.name ?? "",
            product_name: d.products?.formatted_name ?? "",
            finished_at: d.finished_at,
            operator_badge: d.operator_badge,
            overall_result: d.overall_result,
          }))
        );
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Histórico de Ciclos</h2>
      {cycles.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhum ciclo finalizado ainda.</p>
      ) : (
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Linha</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Chapa</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/cycle/${c.id}`)}>
                  <TableCell>{c.line_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.product_name}</TableCell>
                  <TableCell>{c.finished_at ? new Date(c.finished_at).toLocaleString("pt-BR") : "-"}</TableCell>
                  <TableCell>{c.operator_badge}</TableCell>
                  <TableCell>
                    <Badge className={c.overall_result === "OK" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                      {c.overall_result}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
