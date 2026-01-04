import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle, FileX } from 'lucide-react';

type SignatureStatusType = 'unsigned' | 'pending' | 'partially_signed' | 'fully_signed' | 'rejected';

interface SignatureStatusBadgeProps {
  status: SignatureStatusType;
  className?: string;
}

const statusConfig: Record<SignatureStatusType, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ReactNode;
  className: string;
}> = {
  unsigned: {
    label: 'Non signé',
    variant: 'outline',
    icon: <FileX className="h-3 w-3" />,
    className: 'text-muted-foreground border-muted-foreground/30',
  },
  pending: {
    label: 'En attente',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  partially_signed: {
    label: 'Partiellement signé',
    variant: 'secondary',
    icon: <AlertCircle className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  fully_signed: {
    label: 'Signé',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  rejected: {
    label: 'Refusé',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
    className: '',
  },
};

export function SignatureStatusBadge({ status, className = '' }: SignatureStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unsigned;

  return (
    <Badge 
      variant={config.variant} 
      className={`gap-1 ${config.className} ${className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

export default SignatureStatusBadge;
