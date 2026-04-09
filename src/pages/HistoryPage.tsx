import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface Line { id: string; name: string; }
interface Product { id: string; pb: string; ks: string; formatted_name: string | null; }

interface CycleRow {
  id: string;
  line_name: string;
  product_name: string;
  product_pb: string;
  product_ks: string;
  finished_at: string | null;
  operator_badge: string;
  overall_result: string | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterLine, setFilterLine] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/lines"),
      api.get("/products"),
    ]).then(([l, p]) => {
      setLines(l ?? []);
      setProducts(p ?? []);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("status", "FINISHED");
    params.set("limit", "500");
    if (filterLine !== "all") params.set("line_id", filterLine);
    if (filterProduct !== "all") params.set("product_id", filterProduct);
    if (filterResult !== "all") params.set("overall_result", filterResult);
    if (filterDateFrom) params.set("date_from", filterDateFrom);
    if (filterDateTo) params.set("date_to", filterDateTo);

    api.get(`/cycles?${params.toString()}`).then((data) => {
      setCycles(
        (data ?? []).map((d: any) => ({
          id: d.id,
          line_name: d.line_name ?? "",
          product_name: d.product_formatted_name ?? `PB: ${d.product_pb} KS: ${d.product_ks}`,
          product_pb: d.product_pb ?? "",
          product_ks: d.product_ks ?? "",
          finished_at: d.finished_at,
          operator_badge: d.operator_badge,
          overall_result: d.overall_result,
        }))
      );
      setLoading(false);
    });
  }, [user, filterLine, filterProduct, filterResult, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setFilterLine("all");
    setFilterProduct("all");
    setFilterResult("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasFilters = filterLine !== "all" || filterProduct !== "all" || filterResult !== "all" || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold sr-only">Histórico de Ciclos</h2>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Filtros</p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs">
              <X className="h-3 w-3" /> Limpar filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Linha</Label>
            <Select value={filterLine} onValueChange={setFilterLine}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Produto</Label>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>PB: {p.pb} KS: {p.ks}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Resultado</Label>
            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="OK">APROVADO</SelectItem>
                <SelectItem value="NOK">REPROVADO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label className="text-xs">Período</Label>
            <div className="flex gap-1 items-center">
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 text-xs" />
              <span className="text-xs text-muted-foreground">até</span>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-muted-foreground">Carregando...</div>
      ) : cycles.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhum ciclo encontrado.</p>
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
                  <TableCell className="max-w-[200px] truncate">
                    {c.product_pb ? `PB: ${c.product_pb} KS: ${c.product_ks}` : c.product_name}
                  </TableCell>
                  <TableCell>{c.finished_at ? new Date(c.finished_at).toLocaleString("pt-BR") : "-"}</TableCell>
                  <TableCell>{c.operator_badge}</TableCell>
                  <TableCell>
                    <Badge className={c.overall_result === "OK" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                      {c.overall_result === "OK" ? "APROVADO" : c.overall_result === "NOK" ? "REPROVADO" : c.overall_result}
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
