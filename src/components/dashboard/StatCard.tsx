import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon,
  variant = "default" 
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const iconBgStyles = {
    default: "bg-muted",
    primary: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    info: "bg-info/10",
  };

  const iconColorStyles = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
  };

  return (
    <div className="stat-card group">
      <div className="stat-card-gradient" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="metric-label">{title}</p>
            <p className="metric-value">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isPositive && "text-success",
                isNegative && "text-destructive",
                !isPositive && !isNegative && "text-muted-foreground"
              )}>
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                <span>{isPositive ? "+" : ""}{change}%</span>
                {changeLabel && <span className="text-muted-foreground">vs {changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
            iconBgStyles[variant]
          )}>
            <div className={iconColorStyles[variant]}>{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
