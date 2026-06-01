import { Outlet, useLocation } from "react-router-dom";
import { MobilePersonalNav } from "../navigation/MobilePersonalNav";
import { SanctuaryMesh } from "../sanctuary/SanctuaryMesh";
import { PersonalNavRail } from "../navigation/PersonalNavRail";

export function PersonalLayout() {
  const { pathname } = useLocation();
  const isCoach = pathname.includes("/coach");
  const isJournal = pathname.includes("/reflect");

  if (isCoach) {
    return (
      <div className="sanctuary-page min-h-screen">
        <SanctuaryMesh />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="sanctuary-page flex min-h-screen">
      <SanctuaryMesh />
      <PersonalNavRail />
      <main
        className={`relative flex-1 overflow-y-auto ${
          isJournal ? "zone-journal" : "zone-personal"
        }`}
      >
        <div className="mx-auto max-w-lg px-4 py-6 pb-24 sm:px-6 lg:max-w-xl">
          <Outlet />
        </div>
      </main>
      <MobilePersonalNav />
    </div>
  );
}
