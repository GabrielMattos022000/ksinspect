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

const MACHINE_GROUPS = ["Cilmop", "Gasolina", "Diesel", "Casting"];

interface Machine {
  id: string;
  name: string;
  line_id: string;
  active: boolean;
  machine_group: string;
  line_name?: string;
}

interface Line {
  id: string;
  name: string;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [name, setName] = useState("");
  const [lineId, setLineId] = useState("");
  const [machineGroup, setMachineGroup] = useState("Cilmop");

  const fetchData = async () => {
    const [m, l] = await Promise.all([
      api.get("/machines"),
      api.get("/lines?active=true"),
    ]);
    setMachines(m ?? []);
    setLines(l ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!name.trim() || !lineId || !machineGroup) return toast.error("Preencha todos os campos");
    try {
      if (editing) {
        await api.put(`/machines/${editing.id}`, { name: name.trim(), line_id: lineId, machine_group: machineGroup });
        toast.success("Máquina atualizada");
      } else {
        await api.post("/machines", { name: name.trim(), line_id: lineId, machine_group: machineGroup });
        toast.success("Máquina criada");
      }
      setDialogOpen(false);
      setEditing(null);
      setName(""); setLineId(""); setMachineGroup("Cilmop");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (m: Machine) => {
    await api.put(`/machines/${m.id}`, { active: !m.active });
    fetchData();
  };

  const deleteMachine = async (id: string) => {
    if (!confirm("Excluir esta máquina?")) return;
    try {
      await api.delete(`/machines/${id}`);
      toast.success("Máquina excluída");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (m: Machine) => {
    setEditing(m);
    setName(m.name);
    setLineId(m.line_id);
    setMachineGroup(m.machine_group ?? "Cilmop");
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setName(""); setLineId(""); setMachineGroup("Cilmop");
    setDialogOpen(true);
  };

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  const grouped = MACHINE_GROUPS.reduce<Record<string, Machine[]>>((acc, g) => {
    acc[g] = machines.filter((m) => (m.machine_group ?? "Cilmop") === g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold sr-only">Máquinas</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Máquina</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Máquina" : "Nova Máquina"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Linha (ZAP)</Label>
                <Select value={lineId} onValueChange={setLineId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a linha" /></SelectTrigger>
                  <SelectContent>
                    {lines.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: 01" />
              </div>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={machineGroup} onValueChange={setMachineGroup}>
                  <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
                  <SelectContent>
                    {MACHINE_GROUPS.map((g) => (
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

      {MACHINE_GROUPS.map((group) => {
        const groupMachines = grouped[group];
        if (groupMachines.length === 0) return null;
        return (
          <div key={group} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">{group}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupMachines.map((m) => (
                <Card key={m.id} className={!m.active ? "opacity-60" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base">{m.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{m.line_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={m.active} onCheckedChange={() => toggleActive(m)} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMachine(m.id)}>
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

      {machines.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhuma máquina cadastrada.</p>
      )}
    </div>
  );
}
