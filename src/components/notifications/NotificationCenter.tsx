import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Archive, Trash2, Filter, Download, AlertTriangle, Info, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotifications, useUnreadNotificationsCount, useNotificationMutations, Notification, NotificationType, NotificationSeverity } from '@/hooks/useNotifications';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeConfig: Record<NotificationType, { label: string; icon: React.ReactNode; color: string }> = {
  budget_overrun: { label: 'Budget', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-500' },
  project_late: { label: 'Projet', icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-500' },
  convention_expired: { label: 'Convention', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-yellow-500' },
  blocked_action: { label: 'Sécurité', icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-500' },
  validation_pending: { label: 'Validation', icon: <Info className="h-4 w-4" />, color: 'text-blue-500' },
  backup_status: { label: 'Système', icon: <Info className="h-4 w-4" />, color: 'text-gray-500' },
  system_info: { label: 'Info', icon: <Info className="h-4 w-4" />, color: 'text-blue-500' },
};

const severityConfig: Record<NotificationSeverity, { label: string; bgColor: string; textColor: string }> = {
  critical: { label: 'Critique', bgColor: 'bg-destructive', textColor: 'text-destructive-foreground' },
  warning: { label: 'Alerte', bgColor: 'bg-orange-500', textColor: 'text-white' },
  info: { label: 'Info', bgColor: 'bg-blue-500', textColor: 'text-white' },
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onArchive, onDelete, onClick }: NotificationItemProps) {
  const navigate = useNavigate();
  const type = typeConfig[notification.type];
  const severity = severityConfig[notification.severity];
  const isUnread = notification.status === 'unread';

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    if (notification.direct_link) {
      navigate(notification.direct_link);
    }
    onClick();
  };

  return (
    <div
      className={cn(
        'p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors',
        isUnread && 'bg-primary/5'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', type.color)}>
          {type.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {type.label}
            </Badge>
            <Badge className={cn('text-xs', severity.bgColor, severity.textColor)}>
              {severity.label}
            </Badge>
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="font-medium text-sm truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
          {notification.related_entity_name && (
            <p className="text-xs text-primary mt-1">{notification.related_entity_name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {isUnread && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(notification.id);
            }}
          >
            <Archive className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filters = {
    status: tab === 'unread' ? 'unread' as const : tab === 'archived' ? 'archived' as const : undefined,
    type: typeFilter !== 'all' ? typeFilter as NotificationType : undefined,
    severity: severityFilter !== 'all' ? severityFilter as NotificationSeverity : undefined,
  };

  const { data: notifications, isLoading } = useNotifications(filters);
  const { data: unreadCount } = useUnreadNotificationsCount();
  const { markAsRead, markAllAsRead, archiveNotification, deleteNotification } = useNotificationMutations();

  const handleExport = () => {
    if (!notifications?.length) return;

    const csvContent = [
      ['Date', 'Type', 'Sévérité', 'Titre', 'Message', 'Module', 'Statut'].join(','),
      ...notifications.map(n => [
        format(new Date(n.created_at), 'dd/MM/yyyy HH:mm'),
        typeConfig[n.type].label,
        severityConfig[n.severity].label,
        `"${n.title}"`,
        `"${n.message}"`,
        n.module || '-',
        n.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notifications_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout lire
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <div className="px-3 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">Toutes</TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Non lues
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex-1">Archivées</TabsTrigger>
            </TabsList>
          </div>

          {/* Filters */}
          <div className="p-3 flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Gravité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes gravités</SelectItem>
                {Object.entries(severityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <TabsContent value={tab} className="m-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications?.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={(id) => markAsRead.mutate(id)}
                    onArchive={(id) => archiveNotification.mutate(id)}
                    onDelete={(id) => deleteNotification.mutate(id)}
                    onClick={() => setOpen(false)}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
