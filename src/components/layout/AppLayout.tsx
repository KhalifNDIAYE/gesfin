import { ReactNode, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
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
    <div className="min-h-screen bg-background flex flex-col" data-layout="app" data-testid="app-layout">
      <AppSidebar />
      <div className="pl-64 transition-all duration-300 flex flex-col flex-1">
        <AppHeader title={title} subtitle={subtitle} />
        <main className="p-6 flex-1" data-component="main-content" data-testid="main-content">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
