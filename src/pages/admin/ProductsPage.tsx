import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pb, setPb] = useState("");
  const [ks, setKs] = useState("");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async () => {
    if (!pb.trim() || !ks.trim()) return toast.error("Preencha PB e KS");
    const payload = { pb: pb.trim(), ks: ks.trim(), cav: "", maq: "" };
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Produto atualizado");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Produto criado");
    }
    setDialogOpen(false);
    setEditing(null);
    setPb(""); setKs("");
    fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto e todas as suas características?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setPb(p.pb); setKs(p.ks);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setPb(""); setKs("");
    setDialogOpen(true);
  };

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold sr-only">Produtos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>PB</Label>
                  <Input value={pb} onChange={(e) => setPb(e.target.value)} placeholder="057052" />
                </div>
                <div className="space-y-2">
                  <Label>KS</Label>
                  <Input value={ks} onChange={(e) => setKs(e.target.value)} placeholder="97561" />
                </div>
              </div>
              {(pb || ks) && (
                <div className="rounded bg-muted p-2 text-sm text-muted-foreground">
                  Nome: PB: {pb} KS: {ks}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Cav e Máq serão informados ao iniciar um ciclo de medição.</p>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className={!p.active ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">PB: {p.pb} KS: {p.ks}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/products/${p.id}/characteristics`)}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhum produto cadastrado.</p>
      )}
    </div>
  );
}
