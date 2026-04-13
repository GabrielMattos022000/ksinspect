import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import loginBg from "@/assets/login-bg.jpg";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, devLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
      } else {
        await signUp(email, password, fullName);
        toast.success("Conta criada com sucesso!");
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (role: "admin" | "operador") => {
    devLogin(role);
    toast.success(`Login DEV como ${role}`);
    navigate("/");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <Card className="relative z-10 w-full max-w-md bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex items-center justify-center">
            <img src={logo} alt="KS Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Sistema de Inspeção - KS</CardTitle>
          <CardDescription>
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta? " : "Já tem conta? "}
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </div>

          {/* DEV LOGIN — remover em produção */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-center text-muted-foreground mb-2">⚠️ Acesso rápido (sem backend)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDevLogin("admin")}>
                Entrar como Admin
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDevLogin("operador")}>
                Entrar como Operador
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
