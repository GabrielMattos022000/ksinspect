import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CharacteristicImageUpload, { getPublicUrl } from "@/components/CharacteristicImageUpload";
import type { Tables } from "@/integrations/supabase/types";

type Characteristic = Tables<"characteristics">;
type Product = Tables<"products">;

const INTERVAL_OPTIONS = [
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
  { label: "4 horas", value: 240 },
  { label: "8 horas", value: 480 },
  { label: "Turno (8h)", value: 480 },
];

export default function CharacteristicsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [chars, setChars] = useState<Characteristic[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Characteristic | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [charType, setCharType] = useState<"variable" | "attribute">("variable");
  const [unit, setUnit] = useState("mm");
  const [nominal, setNominal] = useState("");
  const [limitMin, setLimitMin] = useState("");
  const [limitMax, setLimitMax] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState("60");
  const [isCritical, setIsCritical] = useState(false);
  const [deviceImagePath, setDeviceImagePath] = useState<string | null>(null);
  const [drawingImagePath, setDrawingImagePath] = useState<string | null>(null);

  const fetchData = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").eq("id", productId!).maybeSingle(),
      supabase.from("characteristics").select("*").eq("product_id", productId!).order("sort_order"),
    ]);
    setProduct(p);
    setChars((c as Characteristic[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [productId]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    const isAttribute = charType === "attribute";
    const payload = {
      name: name.trim(),
      characteristic_type: charType,
      unit: isAttribute ? "-" : unit,
      nominal: isAttribute ? 0 : (parseFloat(nominal) || 0),
      limit_min: isAttribute ? 0 : (parseFloat(limitMin) || 0),
      limit_max: isAttribute ? 0 : (parseFloat(limitMax) || 0),
      product_id: productId!,
      sort_order: editing ? editing.sort_order : chars.length,
      measurement_interval_minutes: parseInt(intervalMinutes) || 60,
      is_critical: isCritical,
      device_image_path: deviceImagePath,
      drawing_image_path: drawingImagePath,
    } as any;
    if (editing) {
      const { error } = await supabase.from("characteristics").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Característica atualizada");
    } else {
      const { error } = await supabase.from("characteristics").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Característica criada");
    }
    setDialogOpen(false);
    setEditing(null);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setName(""); setCharType("variable"); setUnit("mm"); setNominal(""); setLimitMin(""); setLimitMax(""); setIntervalMinutes("60"); setIsCritical(false); setDeviceImagePath(null); setDrawingImagePath(null);
  };

  const toggleActive = async (c: Characteristic) => {
    await supabase.from("characteristics").update({ active: !c.active }).eq("id", c.id);
    fetchData();
  };

  const deleteChar = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("characteristics").delete().eq("id", id);
    toast.success("Excluída");
    fetchData();
  };

  const openEdit = (c: Characteristic) => {
    setEditing(c);
    setName(c.name);
    setCharType(((c as any).characteristic_type as "variable" | "attribute") ?? "variable");
    setUnit(c.unit);
    setNominal(String(c.nominal));
    setLimitMin(String(c.limit_min));
    setLimitMax(String(c.limit_max));
    setIntervalMinutes(String(c.measurement_interval_minutes ?? 60));
    setIsCritical(c.is_critical ?? false);
    setDeviceImagePath(c.device_image_path);
    setDrawingImagePath(c.drawing_image_path);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const moveChar = async (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= chars.length) return;
    const updates = [
      { id: chars[index].id, sort_order: chars[newIndex].sort_order },
      { id: chars[newIndex].id, sort_order: chars[index].sort_order },
    ];
    for (const u of updates) {
      await supabase.from("characteristics").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    fetchData();
  };

  const formatInterval = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = minutes / 60;
    return h === 1 ? "1 hora" : `${h} horas`;
  };

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold sr-only">Características</h2>
          <p className="text-sm text-muted-foreground">PB: {product?.pb} KS: {product?.ks}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nova"} Característica</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="PI Cubo x Saia" />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mm" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Nominal</Label>
                <Input type="number" step="any" value={nominal} onChange={(e) => setNominal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mín</Label>
                <Input type="number" step="any" value={limitMin} onChange={(e) => setLimitMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Máx</Label>
                <Input type="number" step="any" value={limitMax} onChange={(e) => setLimitMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Intervalo de Medição
              </Label>
              <Select value={intervalMinutes} onValueChange={setIntervalMinutes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CharacteristicImageUpload
                label="Imagem do Dispositivo"
                currentPath={deviceImagePath}
                onUploaded={setDeviceImagePath}
              />
              <CharacteristicImageUpload
                label="Imagem do Desenho"
                currentPath={drawingImagePath}
                onUploaded={setDrawingImagePath}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_critical"
                checked={isCritical}
                onCheckedChange={(checked) => setIsCritical(checked === true)}
              />
              <Label htmlFor="is_critical" className="text-sm font-medium cursor-pointer">
                Dimensão Crítica
              </Label>
            </div>
            <Button onClick={handleSave} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {chars.map((c, i) => (
          <Card key={c.id} className={!c.active ? "opacity-60" : ""}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveChar(i, -1)} disabled={i === 0}>▲</Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveChar(i, 1)} disabled={i === chars.length - 1}>▼</Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {c.name}
                  {c.is_critical && <span className="ml-1.5 text-[10px] font-bold text-destructive uppercase">Crítica</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.unit} | Nom: {c.nominal} | Min: {c.limit_min} | Max: {c.limit_max}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" /> A cada {formatInterval(c.measurement_interval_minutes ?? 60)}
                </p>
              </div>
              <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteChar(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {chars.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhuma característica cadastrada.</p>
      )}
    </div>
  );
}
