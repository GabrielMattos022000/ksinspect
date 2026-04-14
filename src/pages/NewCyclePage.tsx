import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlayCircle, Settings, Clock, Loader2 } from "lucide-react";

interface Product {
  id: string;
  pb: string;
  ks: string;
  cav: string;
  maq: string;
  active: boolean;
  formatted_name: string | null;
}

interface Line {
  id: string;
  name: string;
  line_group: string;
  active: boolean;
}

interface RecentCycle {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  overall_result: string | null;
  operator_badge: string;
  week_cast: string;
  cav: string;
  product?: { pb: string; ks: string; formatted_name: string | null };
}

interface LineStatus {
  active_cycle: RecentCycle | null;
  current_product: Product | null;
}

export default function NewCyclePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([]);
  const [lineId, setLineId] = useState("");
  const [recentCycles, setRecentCycles] = useState<RecentCycle[]>([]);
  const [lineStatus, setLineStatus] = useState<LineStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Dialog "Iniciar Ciclo"
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [cav, setCav] = useState("");
  const [weekCast, setWeekCast] = useState("");
  const [badge, setBadge] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dialog "Setup Produto"
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [savingSetup, setSavingSetup] = useState(false);

  // ── Mock data para teste ──
  const MOCK_LINES: Line[] = [
    { id: "line-1", name: "ZAP 01", line_group: "Grupo A", active: true },
    { id: "line-2", name: "ZAP 02", line_group: "Grupo A", active: true },
    { id: "line-3", name: "ZAP 03", line_group: "Grupo B", active: true },
  ];

  const MOCK_PRODUCTS: Product[] = [
    { id: "prod-1", pb: "12345", ks: "K001", cav: "01", maq: "", active: true, formatted_name: "Peça Alpha" },
    { id: "prod-2", pb: "67890", ks: "K002", cav: "02", maq: "", active: true, formatted_name: "Peça Beta" },
    { id: "prod-3", pb: "11223", ks: "K003", cav: "03", maq: "", active: true, formatted_name: "Peça Gamma" },
  ];

  const MOCK_CYCLES: RecentCycle[] = [
    { id: "cyc-1", started_at: "2026-04-14T08:00:00Z", finished_at: "2026-04-14T09:30:00Z", status: "finished", overall_result: "APROVADO", operator_badge: "36554", week_cast: "15P", cav: "01", product: { pb: "12345", ks: "K001", formatted_name: "Peça Alpha" } },
    { id: "cyc-2", started_at: "2026-04-14T10:00:00Z", finished_at: "2026-04-14T11:15:00Z", status: "finished", overall_result: "REPROVADO", operator_badge: "42100", week_cast: "15P", cav: "02", product: { pb: "12345", ks: "K001", formatted_name: "Peça Alpha" } },
    { id: "cyc-3", started_at: "2026-04-14T13:00:00Z", finished_at: null, status: "in_progress", overall_result: null, operator_badge: "36554", week_cast: "15Q", cav: "01", product: { pb: "12345", ks: "K001", formatted_name: "Peça Alpha" } },
    { id: "cyc-4", started_at: "2026-04-13T07:30:00Z", finished_at: "2026-04-13T08:45:00Z", status: "finished", overall_result: "APROVADO", operator_badge: "55012", week_cast: "14P", cav: "03", product: { pb: "67890", ks: "K002", formatted_name: "Peça Beta" } },
    { id: "cyc-5", started_at: "2026-04-12T14:00:00Z", finished_at: "2026-04-12T15:20:00Z", status: "finished", overall_result: "APROVADO", operator_badge: "36554", week_cast: "14P", cav: "01", product: { pb: "12345", ks: "K001", formatted_name: "Peça Alpha" } },
  ];

  useEffect(() => {
    // Mock: carrega linhas
    setLines(MOCK_LINES);
  }, []);

  useEffect(() => {
    if (!lineId) {
      setRecentCycles([]);
      setLineStatus(null);
      return;
    }
    setLoadingStatus(true);
    // Mock: simula carregamento
    setTimeout(() => {
      setRecentCycles(MOCK_CYCLES);
      setLineStatus({
        active_cycle: MOCK_CYCLES.find((c) => c.status === "in_progress") ?? null,
        current_product: MOCK_PRODUCTS[0],
      });
      setLoadingStatus(false);
    }, 400);
  }, [lineId]);

  // Validações
  const weekCastValid = /^\d{1,2}[A-Za-z]$/.test(weekCast);
  const badgeValid = /^\d+$/.test(badge);
  const canStart = weekCastValid && badgeValid && cav.trim();

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return (p.pb + p.ks + (p.formatted_name ?? "")).toLowerCase().includes(s);
  });

  const handleOpenStart = () => {
    setCav("");
    setWeekCast("");
    setBadge("");
    setShowStartDialog(true);
  };

  const handleStart = async () => {
    if (!canStart || !user || !lineId) return;
    setSubmitting(true);
    try {
      const cycle = await api.post("/cycles", {
        line_id: lineId,
        product_id: lineStatus?.current_product?.id,
        week_cast: weekCast,
        operator_badge: badge,
        cav: cav.trim(),
      });
      toast.success("Ciclo iniciado!");
      setShowStartDialog(false);
      navigate(`/cycle/${cycle.id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar ciclo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSetup = () => {
    setProductSearch("");
    setSelectedProductId(lineStatus?.current_product?.id ?? "");
    if (products.length === 0) {
      api.get("/products?active=true").then((data) => setProducts(data ?? []));
    }
    setShowSetupDialog(true);
  };

  const handleSaveSetup = async () => {
    if (!selectedProductId || !lineId) return;
    setSavingSetup(true);
    try {
      await api.put(`/lines/${lineId}/setup`, { product_id: selectedProductId });
      toast.success("Produto atualizado na linha!");
      setShowSetupDialog(false);
      // Refresh status
      const status = await api.get(`/lines/${lineId}/status`).catch(() => null);
      setLineStatus(status);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao atualizar setup");
    } finally {
      setSavingSetup(false);
    }
  };

  const getResultBadge = (result: string | null, status: string) => {
    if (status === "in_progress") return <Badge variant="outline" className="border-blue-500 text-blue-600">Em andamento</Badge>;
    if (result === "APROVADO") return <Badge className="bg-green-600 hover:bg-green-700">Aprovado</Badge>;
    if (result === "REPROVADO") return <Badge variant="destructive">Reprovado</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const selectedLine = lines.find((l) => l.id === lineId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Seleção de Linha */}
      <Card>
        <CardHeader>
          <CardTitle>Acompanhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Linha (ZAP)</Label>
            <Select value={lineId} onValueChange={setLineId}>
              <SelectTrigger><SelectValue placeholder="Selecione a linha" /></SelectTrigger>
              <SelectContent>
                {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {lineId && (
        <>
          {/* Status da Linha */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Status da Linha: {selectedLine?.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleOpenSetup}>
                  <Settings className="mr-1 h-4 w-4" />
                  Setup Produto
                </Button>
                <Button size="sm" onClick={handleOpenStart} disabled={!lineStatus?.current_product}>
                  <PlayCircle className="mr-1 h-4 w-4" />
                  Iniciar Ciclo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStatus ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Produto Atual</p>
                    {lineStatus?.current_product ? (
                      <div>
                        <p className="font-semibold">PB: {lineStatus.current_product.pb}</p>
                        <p className="text-sm text-muted-foreground">KS: {lineStatus.current_product.ks}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhum produto definido — clique em "Setup Produto"</p>
                    )}
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Ciclo Ativo</p>
                    {lineStatus?.active_cycle ? (
                      <div>
                        <p className="font-semibold text-blue-600">Em andamento</p>
                        <p className="text-sm text-muted-foreground">Operador: {lineStatus.active_cycle.operator_badge}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhum ciclo ativo</p>
                    )}
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Grupo</p>
                    <p className="font-semibold">{selectedLine?.line_group ?? "—"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimos Lançamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStatus ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : recentCycles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhum ciclo encontrado para esta linha.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Data</th>
                        <th className="pb-2 font-medium text-muted-foreground">Produto</th>
                        <th className="pb-2 font-medium text-muted-foreground">Cavidade</th>
                        <th className="pb-2 font-medium text-muted-foreground">Semana</th>
                        <th className="pb-2 font-medium text-muted-foreground">Operador</th>
                        <th className="pb-2 font-medium text-muted-foreground">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCycles.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/cycle/${c.id}`)}
                        >
                          <td className="py-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {new Date(c.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>
                          <td className="py-2">{c.product ? `PB: ${c.product.pb}` : "—"}</td>
                          <td className="py-2">{c.cav}</td>
                          <td className="py-2">{c.week_cast}</td>
                          <td className="py-2">{c.operator_badge}</td>
                          <td className="py-2">{getResultBadge(c.overall_result, c.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog: Iniciar Ciclo */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Novo Ciclo de Medição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {lineStatus?.current_product && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Produto</p>
                <p className="font-semibold">PB: {lineStatus.current_product.pb} — KS: {lineStatus.current_product.ks}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Cavidade</Label>
                <Input value={cav} onChange={(e) => setCav(e.target.value)} placeholder="Ex: 01" />
              </div>
              <div className="space-y-2">
                <Label>Semana Fundida</Label>
                <Input
                  value={weekCast}
                  onChange={(e) => setWeekCast(e.target.value)}
                  placeholder="Ex: 48P"
                  className={weekCast && !weekCastValid ? "border-destructive" : ""}
                />
                {weekCast && !weekCastValid && (
                  <p className="text-xs text-destructive">Formato: 1-2 dígitos + 1 letra</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Chapa Colaborador</Label>
                <Input
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ex: 36554"
                  className={badge && !badgeValid ? "border-destructive" : ""}
                />
                {badge && !badgeValid && (
                  <p className="text-xs text-destructive">Apenas números</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancelar</Button>
            <Button onClick={handleStart} disabled={!canStart || submitting}>
              {submitting ? "Iniciando..." : "Iniciar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Setup Produto */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup de Produto na Linha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por PB ou KS..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
              <SelectContent>
                {filteredProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>PB: {p.pb} — KS: {p.ks}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveSetup} disabled={!selectedProductId || savingSetup}>
              {savingSetup ? "Salvando..." : "Confirmar Setup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
