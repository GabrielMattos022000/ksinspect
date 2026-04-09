import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, UserCog, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  role: "admin" | "operador" | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "operador">("operador");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.get("/users");
      setUsers(data ?? []);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      return toast.error("Preencha todos os campos");
    }
    if (newPassword.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setSaving(true);

    try {
      await api.post("/users", {
        full_name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
        role: newRole,
      });
      toast.success("Usuário criado com sucesso!");
      setDialogOpen(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("operador");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleChangeRole = async (userId: string, newRoleValue: "admin" | "operador") => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRoleValue });
      toast.success("Perfil atualizado");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.user_id}`);
      toast.success("Usuário excluído com sucesso");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openNew = () => {
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("operador");
    setDialogOpen(true);
  };

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <h2 className="text-xl font-semibold sr-only">Usuários</h2>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Usuário</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="João da Silva" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="joao@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "operador")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="admin">Admin / Engenharia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateUser} className="w-full" disabled={saving}>
              {saving ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deleteTarget?.full_name || "Sem nome"}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Card key={u.user_id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-sm">{u.full_name || "Sem nome"}</CardTitle>
                  </div>
                </div>
                <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs uppercase">
                  {u.role ?? "sem perfil"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(u)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Select
                  value={u.role ?? "operador"}
                  onValueChange={(v) => handleChangeRole(u.user_id, v as "admin" | "operador")}
                >
                  <SelectTrigger className="h-7 text-xs w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {users.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
}
