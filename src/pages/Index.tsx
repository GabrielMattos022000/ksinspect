import { useAuth } from "@/hooks/useAuth";
import DashboardPage from "./DashboardPage";
import NewCyclePage from "./NewCyclePage";

export default function Index() {
  const { isAdmin } = useAuth();
  // Admin sees dashboard, operator sees new cycle form
  return isAdmin ? <DashboardPage /> : <NewCyclePage />;
}
