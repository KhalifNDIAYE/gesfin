import { ReactNode, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useNotificationSync } from "@/hooks/useNotificationSync";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  // Initialize notification sync service to correlate business alerts with notifications
  useNotificationSync();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-64 transition-all duration-300">
        <AppHeader title={title} subtitle={subtitle} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
