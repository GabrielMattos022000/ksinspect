import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LINE_GROUPS = ["Cilmop", "Gasolina", "Diesel"];

interface Line {
  id: string;
  name: string;
  active: boolean;
  line_group: string;
}

export default function LinesPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Line | null>(null);
  const [name, setName] = useState("");
  const [lineGroup, setLineGroup] = useState("Cilmop");

  const fetchLines = async () => {
    const data = await api.get("/lines");
    setLines(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLines(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    try {
      if (editing) {
        await api.put(`/lines/${editing.id}`, { name: name.trim(), line_group: lineGroup });
        toast.success("Linha atualizada");
      } else {
        await api.post("/lines", { name: name.trim(), line_group: lineGroup });
        toast.success("Linha criada");
      }
      setDialogOpen(false);
      setEditing(null);
      setName(""); setLineGroup("Cilmop");
      fetchLines();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (line: Line) => {
    await api.put(`/lines/${line.id}`, { active: !line.active });
    fetchLines();
  };

  const deleteLine = async (id: string) => {
    if (!confirm("Excluir esta linha?")) return;
    try {
      await api.delete(`/lines/${id}`);
      toast.success("Linha excluída");
      fetchLines();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (line: Line) => {
    setEditing(line);
    setName(line.name);
    setLineGroup(line.line_group ?? "Cilmop");
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setName(""); setLineGroup("Cilmop");
    setDialogOpen(true);
  };

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  const grouped = LINE_GROUPS.reduce<Record<string, Line[]>>((acc, g) => {
    acc[g] = lines.filter((l) => (l.line_group ?? "Cilmop") === g);
    return acc;
  }, {});
  const ungrouped = lines.filter((l) => !LINE_GROUPS.includes(l.line_group ?? "Cilmop"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <h2 className="text-xl font-semibold sr-only">Linhas (ZAP)</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Linha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Linha" : "Nova Linha"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: ZAP 01" />
              </div>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={lineGroup} onValueChange={setLineGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LINE_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {LINE_GROUPS.map((group) => {
        const groupLines = grouped[group];
        if (!groupLines || groupLines.length === 0) return null;
        return (
          <div key={group} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">{group}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupLines.map((line) => (
                <Card key={line.id} className={!line.active ? "opacity-60" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">{line.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch checked={line.active} onCheckedChange={() => toggleActive(line)} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(line)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteLine(line.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Outros</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ungrouped.map((line) => (
              <Card key={line.id} className={!line.active ? "opacity-60" : ""}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{line.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch checked={line.active} onCheckedChange={() => toggleActive(line)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(line)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteLine(line.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lines.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhuma linha cadastrada.</p>
      )}
    </div>
  );
}
