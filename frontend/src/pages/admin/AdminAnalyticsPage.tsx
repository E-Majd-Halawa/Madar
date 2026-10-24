import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toastStore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const c = useChartColors();
  const [range, setRange] = useState<'7' | '30' | '90'>('30');

  const chartData = [
    { date: 'Day 1', activeUsers: 120, tasksDone: 45, volume: 320 },
    { date: 'Day 5', activeUsers: 145, tasksDone: 58, volume: 410 },
    { date: 'Day 10', activeUsers: 180, tasksDone: 72, volume: 490 },
    { date: 'Day 15', activeUsers: 210, tasksDone: 89, volume: 550 },
    { date: 'Day 20', activeUsers: 245, tasksDone: 104, volume: 630 },
    { date: 'Day 25', activeUsers: 290, tasksDone: 125, volume: 720 },
    { date: 'Day 30', activeUsers: 340, tasksDone: 148, volume: 840 },
  ];

  const handleExportCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      ['Period,ActiveUsers,TasksCompleted', `Range_${range}d,340,148`].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `admin-analytics-${range}d.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(t('admin.analytics.exportSuccess', 'Admin analytics CSV exported successfully.'));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.analytics.title', 'Global Platform Analytics')}</h1>
          <p className="text-sm text-text-muted">{t('admin.analytics.subtitle', 'High-level telemetry across all tenants and workspaces.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-2 p-1 rounded-xl border border-border">
            {(['7', '30', '90'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${range === r ? 'bg-accent text-accent-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                {t(`admin.analytics.days${r}`, `${r} Days`)}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-2">
            <Download className="size-4" /> {t('admin.analytics.exportCsv', 'Export CSV')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 space-y-4 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-lg font-semibold text-text">{t('admin.analytics.activeUsersTrend', 'Active Users Trend')}</h3>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={c.muted} 
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(val) => {
                    const match = val.match(/Day\s+(\d+)/);
                    const dayNum = match ? match[1] : val;
                    return t('admin.analytics.dayTick', { day: dayNum, defaultValue: val });
                  }}
                />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }}
                  labelFormatter={(label) => {
                    const match = label.match(/Day\s+(\d+)/);
                    const dayNum = match ? match[1] : label;
                    return t('admin.analytics.dayLabel', { day: dayNum, defaultValue: label });
                  }}
                  formatter={(value, name) => [value, t(`admin.analytics.series.${name}`, { defaultValue: name })]}
                />
                <Line type="monotone" dataKey="activeUsers" stroke={c.accent} strokeWidth={3} dot={{ fill: c.accent, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 space-y-4 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
          <h3 className="text-lg font-semibold text-text">{t('admin.analytics.platformTaskOutput', 'Platform Task Output')}</h3>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={c.muted} 
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(val) => {
                    const match = val.match(/Day\s+(\d+)/);
                    const dayNum = match ? match[1] : val;
                    return t('admin.analytics.dayTick', { day: dayNum, defaultValue: val });
                  }}
                />
                <YAxis stroke={c.muted} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: c.surface, borderColor: c.grid, borderRadius: '12px', color: 'var(--fg)' }}
                  labelFormatter={(label) => {
                    const match = label.match(/Day\s+(\d+)/);
                    const dayNum = match ? match[1] : label;
                    return t('admin.analytics.dayLabel', { day: dayNum, defaultValue: label });
                  }}
                  formatter={(value, name) => [value, t(`admin.analytics.series.${name}`, { defaultValue: name })]}
                />
                <Bar dataKey="tasksDone" fill={c.accent} radius={[6, 6, 0, 0]} opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
