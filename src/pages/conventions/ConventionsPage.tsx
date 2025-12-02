import { useState, useMemo } from "react";
import { Plus, Search, Download, FileText, CheckCircle, AlertTriangle, Clock, XCircle, Calendar } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useConventions, useDeleteConvention, Convention } from "@/hooks/useConventionsBailleurs";
import { ConventionDialog } from "@/components/conventions/ConventionDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Brouillon", variant: "secondary", icon: FileText },
  active: { label: "Active", variant: "default", icon: CheckCircle },
  suspended: { label: "Suspendue", variant: "destructive", icon: XCircle },
  closed: { label: "Clôturée", variant: "outline", icon: XCircle },
};

export default function ConventionsPage() {
  const { data: conventions, isLoading } = useConventions();
  const deleteConvention = useDeleteConvention();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const bailleurFilter = searchParams.get("bailleur");

  // Calculate stats
  const stats = useMemo(() => {
    if (!conventions) return { active: 0, expiringSoon: 0, expired: 0, inNegotiation: 0 };
    
    const now = new Date();
    let expiringSoon = 0;
    let expired = 0;
    
    conventions.forEach(c => {
      if (c.closing_date) {
        const closingDate = new Date(c.closing_date);
        const daysUntilClose = differenceInDays(closingDate, now);
        if (daysUntilClose < 0 && c.status === "active") {
          expired++;
        } else if (daysUntilClose <= 90 && daysUntilClose >= 0 && c.status === "active") {
          expiringSoon++;
        }
      }
    });
    
    return {
      active: conventions.filter(c => c.status === "active").length,
      expiringSoon,
      expired,
      inNegotiation: conventions.filter(c => c.status === "draft").length,
    };
  }, [conventions]);

  // Filter conventions
  const filteredConventions = useMemo(() => {
    if (!conventions) return [];
    let filtered = conventions;
    
    if (bailleurFilter) {
      filtered = filtered.filter(c => c.bailleur_id === bailleurFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.bailleur?.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [conventions, searchQuery, bailleurFilter]);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} M`;
    }
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  const getConventionStatus = (convention: Convention) => {
    if (!convention.closing_date) return convention.status;
    
    const now = new Date();
    const closingDate = new Date(convention.closing_date);
    const daysUntilClose = differenceInDays(closingDate, now);
    
    if (daysUntilClose < 0 && convention.status === "active") {
      return "expired";
    }
    if (daysUntilClose <= 90 && daysUntilClose >= 0 && convention.status === "active") {
      return "expiring";
    }
    return convention.status;
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConvention.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AppLayout title="Conventions" subtitle="Gestion des accords de financement">
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              <p className="text-sm text-muted-foreground">Expirent bientôt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Clock className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">Expirées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inNegotiation}</p>
              <p className="text-sm text-muted-foreground">En négociation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une convention..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
          <Button onClick={() => { setSelectedConvention(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle convention
          </Button>
        </div>
      </div>

      {/* Conventions List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Conventions</CardTitle>
          <p className="text-sm text-muted-foreground">Accords de financement avec les bailleurs</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : filteredConventions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune convention trouvée
            </div>
          ) : (
            filteredConventions.map((convention) => {
              const displayStatus = getConventionStatus(convention);
              const disbursementRate = convention.total_amount > 0 
                ? (convention.disbursed_amount / convention.total_amount) * 100 
                : 0;
              
              const statusInfo = displayStatus === "expired" 
                ? { label: "Expirée", variant: "destructive" as const, icon: XCircle }
                : displayStatus === "expiring"
                ? { label: "Expire bientôt", variant: "outline" as const, icon: AlertTriangle }
                : statusConfig[convention.status] || statusConfig.draft;
              
              const StatusIcon = statusInfo.icon;

              return (
                <div 
                  key={convention.id} 
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={statusInfo.variant}
                        className="flex items-center gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-mono">{convention.code}</span>
                    </div>
                    <h3 className="font-semibold text-lg truncate">{convention.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{convention.bailleur?.name}</span>
                      <span>•</span>
                      {convention.description && (
                        <>
                          <span className="truncate max-w-[200px]">{convention.description}</span>
                          <span>•</span>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {convention.effective_date && format(new Date(convention.effective_date), "dd/MM/yyyy", { locale: fr })}
                        {convention.closing_date && ` → ${format(new Date(convention.closing_date), "dd/MM/yyyy", { locale: fr })}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="min-w-[200px]">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Décaissement</span>
                        <span className="font-medium">{disbursementRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={disbursementRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatAmount(convention.disbursed_amount)}</span>
                        <span>{formatAmount(convention.total_amount)} {convention.currency?.code || "FCFA"}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/conventions/${convention.id}`)}
                    >
                      Voir détails
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <ConventionDialog open={dialogOpen} onOpenChange={setDialogOpen} convention={selectedConvention} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppLayout>
  );
}
