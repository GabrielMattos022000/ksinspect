import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "operador">("operador");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const roleMap = new Map<string, "admin" | "operador">();
    (roles ?? []).forEach((r) => roleMap.set(r.user_id, r.role));

    const userList: UserProfile[] = (profiles ?? []).map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: "",
      role: roleMap.get(p.user_id) ?? null,
    }));

    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      return toast.error("Preencha todos os campos");
    }
    if (newPassword.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setSaving(true);

    const { data, error } = await supabase.auth.signUp({
      email: newEmail.trim(),
      password: newPassword.trim(),
      options: {
        data: { full_name: newName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: newRole });
    }

    toast.success("Usuário criado com sucesso! O usuário precisará confirmar o e-mail.");
    setDialogOpen(false);
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("operador");
    setSaving(false);
    fetchUsers();
  };

  const handleChangeRole = async (userId: string, newRoleValue: "admin" | "operador") => {
    const { data: existing } = await supabase.from("user_roles").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("user_roles").update({ role: newRoleValue }).eq("user_id", userId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRoleValue });
      if (error) return toast.error(error.message);
    }
    toast.success("Perfil atualizado");
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: deleteTarget.user_id },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro ao excluir usuário");
    } else {
      toast.success("Usuário excluído com sucesso");
      fetchUsers();
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const openNew = () => {
    setEditingUser(null);
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

      {/* Delete confirmation */}
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
