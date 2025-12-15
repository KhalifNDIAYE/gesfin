import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lock,
  CheckCircle2,
  Database,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useSecurityDashboardStats, useLoginStats } from "@/hooks/useSecurityCompliance";
import { useBlockedActionsStats } from "@/hooks/useBlockedActions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

export const SecurityDashboardTab = () => {
  const { data: stats, isLoading: statsLoading } = useSecurityDashboardStats();
  const { data: blockedStats } = useBlockedActionsStats();
  const { data: loginStats } = useLoginStats(7);

  // Mock data for charts when no data
  const loginChartData = loginStats?.length ? loginStats : [
    { date: "Lun", logins: 45, failed: 2 },
    { date: "Mar", logins: 52, failed: 1 },
    { date: "Mer", logins: 48, failed: 3 },
    { date: "Jeu", logins: 61, failed: 0 },
    { date: "Ven", logins: 55, failed: 1 },
    { date: "Sam", logins: 12, failed: 0 },
    { date: "Dim", logins: 8, failed: 0 },
  ];

  const incidentsByType = [
    { type: "Accès non autorisé", count: 3 },
    { type: "Tentative intrusion", count: 1 },
    { type: "Fuite données", count: 0 },
    { type: "Malware", count: 0 },
    { type: "Phishing", count: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actions bloquées</p>
                <p className="text-2xl font-bold">{blockedStats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Incidents ouverts</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats?.openIncidents || 0}</p>
                  {(stats?.criticalIncidents || 0) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats?.criticalIncidents} critique(s)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Lock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chiffrement</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    AES-256 Actif
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Score & Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Taux de conformité global
            </CardTitle>
            <CardDescription>Score basé sur les contrôles validés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="h-32 w-32 -rotate-90 transform">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(stats?.complianceScore || 0) * 3.51} 351`}
                    className="text-success"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{stats?.complianceScore || 0}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Contrôles conformes</span>
                <span className="font-medium text-success">{stats?.conformeControls || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total des contrôles</span>
                <span className="font-medium">{stats?.totalControls || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Connexions (7 derniers jours)</CardTitle>
            <CardDescription>Connexions réussies vs tentatives échouées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loginChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="logins" 
                    stroke="hsl(var(--success))" 
                    name="Connexions réussies"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(var(--destructive))" 
                    name="Tentatives échouées"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incidents par type</CardTitle>
            <CardDescription>Distribution des incidents de sécurité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentsByType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="type" className="text-xs" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut par norme</CardTitle>
            <CardDescription>Niveau de conformité par référentiel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "SOC 2", score: 85, status: "conforme" },
              { name: "ISO 27001", score: 78, status: "a_ameliorer" },
              { name: "RGPD", score: 92, status: "conforme" },
              { name: "HIPAA", score: 65, status: "a_ameliorer" },
              { name: "FedRAMP", score: 45, status: "en_cours" },
            ].map((norm) => (
              <div key={norm.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{norm.name}</span>
                  <span className="text-muted-foreground">{norm.score}%</span>
                </div>
                <Progress 
                  value={norm.score} 
                  className={`h-2 ${
                    norm.score >= 80 ? '[&>div]:bg-success' : 
                    norm.score >= 60 ? '[&>div]:bg-warning' : 
                    '[&>div]:bg-destructive'
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-success/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
                <p className="font-semibold">Il y a 2 heures</p>
                <Badge variant="secondary" className="mt-1 bg-success/10 text-success">
                  Réussie
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Chiffrement données</p>
                <p className="font-semibold">AES-256-GCM</p>
                <Badge variant="secondary" className="mt-1 bg-success/10 text-success">
                  Actif
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Chiffrement fichiers</p>
                <p className="font-semibold">RSA-4096</p>
                <Badge variant="secondary" className="mt-1 bg-success/10 text-success">
                  Actif
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
