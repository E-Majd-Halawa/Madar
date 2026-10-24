import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartColors } from '@/hooks/useChartColors';
import { useMotion } from '@/hooks/useMotion';
import type { Task } from '@/types';
import { priorityDistribution } from '@/utils/taskStats';

export function PriorityDonut({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation();
  const c = useChartColors();
  const { enabled } = useMotion();
  const data = priorityDistribution(tasks);
  const colors = { urgent: c.danger, high: c.warning, medium: c.accent, low: c.muted } as const;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-36 shrink-0" role="img" aria-label={t('dashboard.widgets.priority')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" innerRadius="66%" outerRadius="100%" paddingAngle={2} stroke="none" isAnimationActive={enabled}>
              {data.map((d) => (
                <Cell key={d.priority} fill={colors[d.priority]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 12, fontSize: 12 }}
              formatter={(value: number, _n, item) => [value, t(`tasks.priorities.${item.payload.priority}`)]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.priority} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: colors[d.priority] }} />
            <span className="flex-1 truncate text-muted">{t(`tasks.priorities.${d.priority}`)}</span>
            <span className="tabular-nums">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
