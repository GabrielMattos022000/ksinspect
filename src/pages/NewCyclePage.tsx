import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Line = Tables<"lines">;
type Machine = Tables<"machines">;
type Product = Tables<"products">;

export default function NewCyclePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineId, setLineId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [productId, setProductId] = useState("");
  const [weekCast, setWeekCast] = useState("");
  const [badge, setBadge] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("lines").select("*").eq("active", true).order("name").then(({ data }) => setLines(data ?? []));
    supabase.from("products").select("*").eq("active", true).order("pb").then(({ data }) => setProducts(data ?? []));
  }, []);

  useEffect(() => {
    if (!lineId) { setMachines([]); setMachineId(""); return; }
    supabase.from("machines").select("*").eq("line_id", lineId).eq("active", true).order("name")
      .then(({ data }) => setMachines(data ?? []));
    setMachineId("");
  }, [lineId]);

  const weekCastValid = /^\d{1,2}[A-Za-z]$/.test(weekCast);
  const badgeValid = /^\d+$/.test(badge);

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return (p.pb + p.ks + p.cav + p.maq + (p.formatted_name ?? "")).toLowerCase().includes(s);
  });

  const canStart = lineId && machineId && productId && weekCastValid && badgeValid;

  const handleStart = async () => {
    if (!canStart || !user) return;
    setSubmitting(true);

    // Create cycle
    const { data: cycle, error } = await supabase.from("measurement_cycles").insert({
      line_id: lineId,
      machine_id: machineId,
      product_id: productId,
      week_cast: weekCast,
      operator_badge: badge,
      user_id: user.id,
    }).select().single();

    if (error || !cycle) {
      toast.error(error?.message ?? "Erro ao criar ciclo");
      setSubmitting(false);
      return;
    }

    // Create measurement rows for each active characteristic
    const { data: chars } = await supabase
      .from("characteristics")
      .select("id")
      .eq("product_id", productId)
      .eq("active", true)
      .order("sort_order");

    if (chars && chars.length > 0) {
      const rows = chars.map((c) => ({
        cycle_id: cycle.id,
        characteristic_id: c.id,
      }));
      await supabase.from("measurements").insert(rows);
    }

    toast.success("Ciclo iniciado!");
    navigate(`/cycle/${cycle.id}`);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Ciclo de Medição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Linha (ZAP)</Label>
            <Select value={lineId} onValueChange={setLineId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Máquina</Label>
            <Select value={machineId} onValueChange={setMachineId} disabled={!lineId}>
              <SelectTrigger><SelectValue placeholder={lineId ? "Selecione" : "Selecione a linha primeiro"} /></SelectTrigger>
              <SelectContent>
                {machines.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Produto</Label>
            <Input
              placeholder="Buscar por PB, KS, Cav, Maq..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-2"
            />
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
              <SelectContent>
                {filteredProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.formatted_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <Label>Chapa Operador</Label>
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

          <Button onClick={handleStart} disabled={!canStart || submitting} className="w-full">
            {submitting ? "Iniciando..." : "Iniciar Ciclo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
