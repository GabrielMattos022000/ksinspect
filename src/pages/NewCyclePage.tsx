import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

export default function NewCyclePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineId, setLineId] = useState("");
  const [productId, setProductId] = useState("");
  const [weekCast, setWeekCast] = useState("");
  const [badge, setBadge] = useState("");
  const [cav, setCav] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/lines?active=true").then((data) => setLines(data ?? []));
    api.get("/products?active=true").then((data) => setProducts(data ?? []));
  }, []);

  const weekCastValid = /^\d{1,2}[A-Za-z]$/.test(weekCast);
  const badgeValid = /^\d+$/.test(badge);

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return (p.pb + p.ks + (p.formatted_name ?? "")).toLowerCase().includes(s);
  });

  const canStart = lineId && productId && weekCastValid && badgeValid && cav.trim();

  const handleStart = async () => {
    if (!canStart || !user) return;
    setSubmitting(true);

    try {
      const cycle = await api.post("/cycles", {
        line_id: lineId,
        product_id: productId,
        week_cast: weekCast,
        operator_badge: badge,
        cav: cav.trim(),
      });

      toast.success("Ciclo iniciado!");
      navigate(`/cycle/${cycle.id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar ciclo");
    } finally {
      setSubmitting(false);
    }
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
            <Label>Produto</Label>
            <Input
              placeholder="Buscar por PB ou KS..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-2"
            />
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
              <SelectContent>
                {filteredProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>PB: {p.pb} KS: {p.ks}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
