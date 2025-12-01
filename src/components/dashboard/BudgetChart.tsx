import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { month: "Jan", budget: 450000, depenses: 380000 },
  { month: "Fév", budget: 520000, depenses: 490000 },
  { month: "Mar", budget: 480000, depenses: 420000 },
  { month: "Avr", budget: 550000, depenses: 510000 },
  { month: "Mai", budget: 600000, depenses: 540000 },
  { month: "Juin", budget: 580000, depenses: 490000 },
];

export function BudgetChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Suivi Budgétaire</CardTitle>
        <CardDescription>Budget vs Dépenses mensuelles (en FCFA)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="month" 
              className="text-xs fill-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} FCFA`, '']}
            />
            <Legend />
            <Bar 
              dataKey="budget" 
              name="Budget" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="depenses" 
              name="Dépenses" 
              fill="hsl(var(--accent))" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
