import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

type Characteristic = Tables<"characteristics">;
type Product = Tables<"products">;

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
  const [unit, setUnit] = useState("mm");
  const [nominal, setNominal] = useState("");
  const [limitMin, setLimitMin] = useState("");
  const [limitMax, setLimitMax] = useState("");

  const fetchData = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").eq("id", productId!).maybeSingle(),
      supabase.from("characteristics").select("*").eq("product_id", productId!).order("sort_order"),
    ]);
    setProduct(p);
    setChars(c ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [productId]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    const payload = {
      name: name.trim(),
      unit,
      nominal: parseFloat(nominal) || 0,
      limit_min: parseFloat(limitMin) || 0,
      limit_max: parseFloat(limitMax) || 0,
      product_id: productId!,
      sort_order: editing ? editing.sort_order : chars.length,
    };
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
    setName(""); setUnit("mm"); setNominal(""); setLimitMin(""); setLimitMax("");
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
    setUnit(c.unit);
    setNominal(String(c.nominal));
    setLimitMin(String(c.limit_min));
    setLimitMax(String(c.limit_max));
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

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Características</h2>
          <p className="text-sm text-muted-foreground">{product?.formatted_name}</p>
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
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.unit} | Nom: {c.nominal} | Min: {c.limit_min} | Max: {c.limit_max}
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
