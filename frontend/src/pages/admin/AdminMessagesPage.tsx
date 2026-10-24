import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Search, Trash2, AlertTriangle, UserX } from 'lucide-react';
import { auditService } from '@/services/auditService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { LtrBdi } from './adminFormat';

export default function AdminMessagesPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [search, setSearch] = useState('');
  const chartLocale = i18n.language === 'ar' ? ar : enUS;
  
  const [messages, setMessages] = useState([
    { id: 'msg-101', sender: 'Sarah Jenkins', content: 'Check out this external crypto link! Free airdrop.', channel: '#general', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'msg-102', sender: 'Bob Smith', content: 'Hey everyone, please stop spamming notifications.', channel: '#announcements', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 'msg-103', sender: 'Diana Prince', content: 'Here is the secret API key snippet...', channel: '#dev', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 'msg-109', sender: 'Barry Allen', content: 'This architectural approach is completely wrong!', channel: '#architecture', createdAt: new Date(Date.now() - 3600000 * 15).toISOString() },
    { id: 'msg-115', sender: 'Victor Stone', content: 'Claim your prize at sketchy-link.com', channel: '#general', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
  ]);

  const handleAction = async (msgId: string, actionName: string, targetName: string) => {
    try {
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        actionKey: actionName === 'Delete' ? 'admin.audit.actions.taskDeleted' : 'admin.audit.actions.userRoleUpdated',
        targetKey: 'admin.audit.targets.fileName',
        targetParams: { name: `Message ${msgId} by ${targetName}` },
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: 'warning',
      });
      if (actionName === 'Delete') {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
      toast.success(t('admin.messages.actionSuccess', { action: actionName }));
    } catch {
      toast.error(t('admin.messages.actionError', 'Failed to execute moderation action.'));
    }
  };

  const filtered = messages.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()) || m.sender.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.messages.title', 'Message Moderation')}</h1>
        <p className="text-sm text-text-muted">{t('admin.messages.subtitle', 'Review chat channels, flag inappropriate content, and enforce communication standards.')}</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder={t('admin.search.messages', 'Search messages or senders...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl ps-9 pe-4 py-2 text-xs text-fg focus:outline-none"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-muted">
                <th className="p-4 text-start font-medium">{t('admin.messages.table.sender', 'Sender')}</th>
                <th className="p-4 text-start font-medium">{t('admin.messages.table.channel', 'Channel')}</th>
                <th className="p-4 text-start font-medium">{t('admin.messages.table.content', 'Content')}</th>
                <th className="p-4 text-start font-medium">{t('admin.messages.table.time', 'Time')}</th>
                <th className="p-4 text-end font-medium">{t('admin.messages.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((msg) => (
                <tr key={msg.id} className="hover:bg-surface-2/40 transition">
                  <td className="p-4 font-medium text-fg">{msg.sender}</td>
                  <td className="p-4 font-mono text-muted">{msg.channel}</td>
                  <td className="p-4 text-text max-w-md truncate" dir="auto">{msg.content}</td>
                  <td className="p-4 text-muted font-mono">
                    <LtrBdi>
                      {formatDistanceToNow(parseISO(msg.createdAt), { addSuffix: true, locale: chartLocale })}
                    </LtrBdi>
                  </td>
                  <td className="p-4 text-end space-x-2 rtl:space-x-reverse">
                    <Button variant="secondary" size="sm" onClick={() => handleAction(msg.id, 'Warn', msg.sender)} className="h-7 text-xs">
                      {t('admin.messages.warn', 'Warn')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAction(msg.id, 'Delete', msg.sender)} className="h-7 text-xs text-red-500 hover:bg-red-500/10">
                      {t('admin.messages.delete', 'Delete')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
