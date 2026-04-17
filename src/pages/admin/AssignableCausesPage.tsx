import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AssignableCause {
  id: string;
  description: string;
  active: boolean;
  created_at: string;
}

const MOCK_CAUSES: AssignableCause[] = [
  { id: "1", description: "Desgaste de ferramenta", active: true, created_at: new Date().toISOString() },
  { id: "2", description: "Falha de matéria-prima", active: true, created_at: new Date().toISOString() },
  { id: "3", description: "Ajuste incorreto da máquina", active: true, created_at: new Date().toISOString() },
  { id: "4", description: "Erro de operação", active: true, created_at: new Date().toISOString() },
  { id: "5", description: "Variação de temperatura", active: false, created_at: new Date().toISOString() },
];

export default function AssignableCausesPage() {
  const [causes, setCauses] = useState<AssignableCause[]>(MOCK_CAUSES);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssignableCause | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formDescription, setFormDescription] = useState("");
  const [formActive, setFormActive] = useState(true);

  const filtered = causes.filter((c) =>
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setFormDescription("");
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (cause: AssignableCause) => {
    setEditing(cause);
    setFormDescription(cause.description);
    setFormActive(cause.active);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const trimmed = formDescription.trim();
    if (!trimmed) {
      toast.error("Informe a descrição da causa");
      return;
    }
    if (trimmed.length > 200) {
      toast.error("A descrição deve ter no máximo 200 caracteres");
      return;
    }

    if (editing) {
      setCauses((prev) =>
        prev.map((c) =>
          c.id === editing.id ? { ...c, description: trimmed, active: formActive } : c
        )
      );
      toast.success("Causa atualizada");
    } else {
      const newCause: AssignableCause = {
        id: crypto.randomUUID(),
        description: trimmed,
        active: formActive,
        created_at: new Date().toISOString(),
      };
      setCauses((prev) => [newCause, ...prev]);
      toast.success("Causa cadastrada");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setCauses((prev) => prev.filter((c) => c.id !== deleteId));
    toast.success("Causa removida");
    setDeleteId(null);
  };

  const toggleActive = (cause: AssignableCause) => {
    setCauses((prev) =>
      prev.map((c) => (c.id === cause.id ? { ...c, active: !c.active } : c))
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Causas Assinaláveis</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastro das causas dos defeitos identificados durante as inspeções.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Causa
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar causa..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhuma causa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cause) => (
                    <TableRow key={cause.id}>
                      <TableCell className="font-medium">{cause.description}</TableCell>
                      <TableCell>
                        <button onClick={() => toggleActive(cause)}>
                          <Badge variant={cause.active ? "default" : "secondary"}>
                            {cause.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(cause)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(cause.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Causa" : "Nova Causa"}</DialogTitle>
            <DialogDescription>
              Informe a descrição da causa assinalável.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex.: Desgaste de ferramenta"
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formDescription.length}/200
              </p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="active" className="cursor-pointer">Ativa</Label>
              <Switch id="active" checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover causa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
