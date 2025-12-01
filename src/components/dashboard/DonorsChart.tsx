import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: "Banque Mondiale", value: 2500, color: "hsl(var(--chart-1))" },
  { name: "AFD", value: 1800, color: "hsl(var(--chart-2))" },
  { name: "BAD", value: 5000, color: "hsl(var(--chart-3))" },
  { name: "USAID", value: 800, color: "hsl(var(--chart-4))" },
  { name: "UE", value: 600, color: "hsl(var(--chart-5))" },
];

export function DonorsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par bailleur</CardTitle>
        <CardDescription>Budget total en millions FCFA</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} M FCFA`, '']}
            />
            <Legend 
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
