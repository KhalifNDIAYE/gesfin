import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import type { DocumentSignature } from '@/hooks/useDocumentSignatures';

interface SignaturesListProps {
  signatures: DocumentSignature[];
  isLoading?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'signed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-600" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'signed':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Signé</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Refusé</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">En attente</Badge>;
    case 'cancelled':
      return <Badge variant="outline">Annulé</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SignaturesList({ signatures, isLoading }: SignaturesListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!signatures || signatures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune signature requise pour ce document
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Signatures ({signatures.filter(s => s.signature_status === 'signed').length}/{signatures.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {signatures.map((signature, index) => (
            <div
              key={signature.id}
              className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(signature.signer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  {getStatusIcon(signature.signature_status)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{signature.signer_name}</p>
                    <p className="text-xs text-muted-foreground">{signature.signer_role}</p>
                  </div>
                  {getStatusBadge(signature.signature_status)}
                </div>

                {signature.signature_status === 'signed' && signature.signed_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Signé le {format(new Date(signature.signed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                )}

                {signature.signature_status === 'rejected' && (
                  <div className="mt-2">
                    <p className="text-xs text-destructive">
                      Refusé le {signature.rejected_at && format(new Date(signature.rejected_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {signature.rejection_reason && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Motif : {signature.rejection_reason}
                      </p>
                    )}
                  </div>
                )}

                {signature.is_required && signature.signature_status === 'pending' && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Signature requise
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SignaturesList;
