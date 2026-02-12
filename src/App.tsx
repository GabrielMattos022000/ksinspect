import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NewCyclePage from "@/pages/NewCyclePage";
import CyclePage from "@/pages/CyclePage";
import HistoryPage from "@/pages/HistoryPage";
import LinesPage from "@/pages/admin/LinesPage";
import MachinesPage from "@/pages/admin/MachinesPage";
import ProductsPage from "@/pages/admin/ProductsPage";
import CharacteristicsPage from "@/pages/admin/CharacteristicsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/cycle/new" element={<ProtectedRoute><NewCyclePage /></ProtectedRoute>} />
            <Route path="/cycle/:cycleId" element={<ProtectedRoute><CyclePage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/admin/lines" element={<ProtectedRoute adminOnly><LinesPage /></ProtectedRoute>} />
            <Route path="/admin/machines" element={<ProtectedRoute adminOnly><MachinesPage /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute adminOnly><ProductsPage /></ProtectedRoute>} />
            <Route path="/admin/products/:productId/characteristics" element={<ProtectedRoute adminOnly><CharacteristicsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
