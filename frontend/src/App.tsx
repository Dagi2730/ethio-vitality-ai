import { Navigate, Route, Routes } from "react-router-dom";
import { AuthenticatedShell } from "./components/auth/AuthenticatedShell";
import { getHomeForRole } from "./config/roleRoutes";
import { useAuthStore } from "./store/authStore";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/personal/DashboardPage";
import { CoachPage } from "./pages/personal/CoachPage";
import { InsightsPage } from "./pages/personal/InsightsPage";
import { ReflectPage } from "./pages/personal/ReflectPage";
import { ActionsPage } from "./pages/personal/ActionsPage";
import { PrivacyPage } from "./pages/personal/PrivacyPage";
import { CorporateHealthHeatmap } from "./pages/corporate/CorporateHealthHeatmap";
import { OverviewPage } from "./pages/manager/OverviewPage";
import { ClinicalWardView } from "./pages/clinical/ClinicalWardView";

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomeForRole(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AuthenticatedShell />}>
        {/* Personal (patient) */}
        <Route path="/personal" element={<DashboardPage />} />
        <Route path="/personal/coach" element={<CoachPage />} />
        <Route path="/personal/insights" element={<InsightsPage />} />
        <Route path="/personal/reflect" element={<ReflectPage />} />
        <Route path="/personal/actions" element={<ActionsPage />} />
        <Route path="/personal/privacy" element={<PrivacyPage />} />

        {/* Corporate (HR) */}
        <Route path="/corporate/heatmap" element={<CorporateHealthHeatmap />} />
        <Route path="/corporate/overview" element={<OverviewPage />} />

        {/* Clinical (doctor) */}
        <Route path="/clinical/ward" element={<ClinicalWardView />} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="/manager" element={<Navigate to="/corporate/heatmap" replace />} />
      <Route path="/manager/*" element={<Navigate to="/corporate/heatmap" replace />} />
      <Route path="/unauthorized" element={<HomeRedirect />} />
      <Route path="/corporate" element={<Navigate to="/corporate/heatmap" replace />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
