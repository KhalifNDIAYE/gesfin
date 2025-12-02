import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, User, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBailleur, useConventionsByBailleur, useBailleurStats } from "@/hooks/useConventionsBailleurs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

const bailleurTypeLabels: Record<string, string> = {
  bilateral: "Bilatéral",
  multilateral: "Multilatéral",
  ong: "ONG",
  prive: "Privé",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  suspended: { label: "Suspendue", variant: "destructive" },
  closed: { label: "Clôturée", variant: "outline" },
};

export default function BailleurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bailleur, isLoading } = useBailleur(id || "");
  const { data: conventions } = useConventionsByBailleur(id || "");
  const { data: stats } = useBailleurStats(id || "");

  const formatAmount = (amount: number) => new Intl.NumberFormat("fr-FR").format(amount);

  if (isLoading) return <div className="p-6">Chargement...</div>;
  if (!bailleur) return <div className="p-6">Bailleur non trouvé</div>;

  const disbursementRate = stats?.totalAmount ? (stats.disbursedAmount / stats.totalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/bailleurs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            {bailleur.name}
          </h1>
          <p className="text-muted-foreground">{bailleur.code} • {bailleurTypeLabels[bailleur.bailleur_type]}</p>
        </div>
        <Badge variant={bailleur.is_active ? "default" : "secondary"} className="text-sm">
          {bailleur.is_active ? "Actif" : "Inactif"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.totalConventions || 0}</div>
            <p className="text-sm text-muted-foreground">Conventions totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.activeConventions || 0}</div>
            <p className="text-sm text-muted-foreground">Conventions actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatAmount(stats?.totalAmount || 0)}</div>
            <p className="text-sm text-muted-foreground">Montant total engagé</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatAmount(stats?.disbursedAmount || 0)}</div>
            <p className="text-sm text-muted-foreground">Montant décaissé</p>
          </CardContent>
        </Card>
      </div>

      {/* Disbursement Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Taux de décaissement global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Décaissé: {formatAmount(stats?.disbursedAmount || 0)}</span>
              <span>Restant: {formatAmount(stats?.remainingAmount || 0)}</span>
            </div>
            <Progress value={disbursementRate} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">{disbursementRate.toFixed(1)}% décaissé</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bailleur.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-sm">{bailleur.address}</span>
              </div>
            )}
            {bailleur.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href={`mailto:${bailleur.email}`} className="text-sm text-primary hover:underline">{bailleur.email}</a>
              </div>
            )}
            {bailleur.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{bailleur.phone}</span>
              </div>
            )}
            {bailleur.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <a href={bailleur.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{bailleur.website}</a>
              </div>
            )}
            {bailleur.country && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{bailleur.country.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle>Contact principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bailleur.contact_person ? (
              <>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{bailleur.contact_person}</span>
                </div>
                {bailleur.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${bailleur.contact_email}`} className="text-sm text-primary hover:underline">{bailleur.contact_email}</a>
                  </div>
                )}
                {bailleur.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{bailleur.contact_phone}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun contact défini</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{bailleur.notes || "Aucune note"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Conventions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Conventions ({conventions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conventions && conventions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Décaissé</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Clôture</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conventions.map((c) => {
                  const rate = c.total_amount ? (c.disbursed_amount / c.total_amount) * 100 : 0;
                  return (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/conventions/${c.id}`)}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.name}</TableCell>
                      <TableCell>{formatAmount(c.total_amount)} {c.currency?.symbol}</TableCell>
                      <TableCell>{formatAmount(c.disbursed_amount)} {c.currency?.symbol}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={rate} className="h-2 w-16" />
                          <span className="text-xs">{rate.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{c.closing_date ? format(new Date(c.closing_date), "dd/MM/yyyy", { locale: fr }) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[c.status]?.variant || "secondary"}>
                          {statusLabels[c.status]?.label || c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune convention pour ce bailleur</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
