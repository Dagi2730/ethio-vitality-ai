import { Outlet } from "react-router-dom";
import { ClinicalNavRail } from "../navigation/ClinicalNavRail";

export function ClinicalLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-calm-100">
      <ClinicalNavRail />
      <main className="zone-data flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
