import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";

type Page = "landing" | "dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("landing");

  return (
    <>
      {page === "landing" && (
        <LandingPage onNavigateDashboard={() => setPage("dashboard")} />
      )}
      {page === "dashboard" && (
        <DashboardPage onBack={() => setPage("landing")} />
      )}
      <Toaster />
    </>
  );
}
