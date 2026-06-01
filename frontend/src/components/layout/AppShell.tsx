import { Outlet, useLocation } from "react-router-dom";
import { NavigationRail } from "./NavigationRail";

export function AppShell() {
  const { pathname } = useLocation();
  const isDataView =
    pathname.includes("/insights") || pathname.startsWith("/manager");
  const isJournal = pathname.includes("/reflect");

  return (
    <div className="flex min-h-screen bg-calm-100">
      <NavigationRail />
      <div className="flex flex-1 flex-col">
        <main
          className={`flex-1 overflow-y-auto ${
            isJournal
              ? "zone-journal"
              : isDataView
                ? "zone-data"
                : "zone-personal"
          }`}
        >
          <div
            className={`mx-auto w-full px-4 py-6 sm:px-8 ${
              isDataView ? "max-w-7xl" : "max-w-2xl lg:max-w-3xl"
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
