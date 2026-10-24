import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartColors } from '@/hooks/useChartColors';
import { useMotion } from '@/hooks/useMotion';
import type { FocusSession, Task } from '@/types';
import { dailyActivity } from '@/utils/taskStats';

export function ProductivityChart({ tasks, sessions }: { tasks: Task[]; sessions: FocusSession[] }) {
  const { t } = useTranslation();
  const c = useChartColors();
  const { enabled } = useMotion();
  const data = dailyActivity(tasks, sessions, 7);

  return (
    <div className="h-56" role="img" aria-label={t('dashboard.widgets.productivity')}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.accent} stopOpacity={0.4} />
              <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" stroke={c.muted} tickLine={false} axisLine={false} fontSize={12} />
          <YAxis allowDecimals={false} stroke={c.muted} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            cursor={{ stroke: c.grid }}
            contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 12, fontSize: 12 }}
            labelFormatter={(_, p) => p?.[0]?.payload?.date ?? ''}
            formatter={(value: number) => [value, t('dashboard.chart.completed')]}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke={c.accent}
            strokeWidth={2}
            fill="url(#fillCompleted)"
            isAnimationActive={enabled}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
