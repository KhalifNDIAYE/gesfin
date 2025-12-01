import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "in" | "out";
  date: string;
  project: string;
}

const transactions: Transaction[] = [
  { id: "1", description: "Décaissement Tranche 2", amount: 250000000, type: "in", date: "2024-01-15", project: "Programme Eau Potable" },
  { id: "2", description: "Paiement fournisseur équipements", amount: 45000000, type: "out", date: "2024-01-14", project: "Électrification Villages" },
  { id: "3", description: "Honoraires consultants", amount: 12500000, type: "out", date: "2024-01-13", project: "Santé Communautaire" },
  { id: "4", description: "Subvention État", amount: 180000000, type: "in", date: "2024-01-12", project: "Routes Nationales" },
  { id: "5", description: "Fournitures bureau", amount: 850000, type: "out", date: "2024-01-11", project: "Administration" },
];

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions récentes</CardTitle>
        <CardDescription>Derniers mouvements financiers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                transaction.type === "in" ? "bg-success/10" : "bg-destructive/10"
              )}>
                {transaction.type === "in" ? (
                  <ArrowDownLeft className="h-5 w-5 text-success" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{transaction.project}</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-semibold",
                  transaction.type === "in" ? "text-success" : "text-foreground"
                )}>
                  {transaction.type === "in" ? "+" : "-"}{(transaction.amount / 1000000).toFixed(1)} M
                </p>
                <p className="text-xs text-muted-foreground">{transaction.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
