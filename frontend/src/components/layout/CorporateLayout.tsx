import { Outlet } from "react-router-dom";
import { CorporateNavRail } from "../navigation/CorporateNavRail";

export function CorporateLayout() {
  return (
    <div className="flex min-h-screen bg-calm-50">
      <CorporateNavRail />
      <main className="zone-data flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
