import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartColors } from '@/hooks/useChartColors';
import { useMotion } from '@/hooks/useMotion';
import type { FocusSession } from '@/types';
import { dailyActivity, formatMinutes } from '@/utils/taskStats';

export function FocusStats({ sessions }: { sessions: FocusSession[] }) {
  const { t } = useTranslation();
  const c = useChartColors();
  const { enabled } = useMotion();
  const week = dailyActivity([], sessions, 7);
  const total = week.reduce((s, d) => s + d.focusMinutes, 0);
  const count = week.filter((d) => d.focusMinutes > 0).length;
  const best = week.reduce((a, b) => (b.focusMinutes > a.focusMinutes ? b : a), week[0]);

  return (
    <div>
      <p className="text-3xl font-semibold tabular-nums">{formatMinutes(total)}</p>
      <p className="text-xs text-muted">
        {t('dashboard.focusTotal')} · {t('dashboard.focusSessions', { count })}
      </p>
      <div className="mt-3 h-24" role="img" aria-label={t('dashboard.widgets.focusStats')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={week} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" stroke={c.muted} tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip
              cursor={{ fill: c.grid }}
              contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 12, fontSize: 12 }}
              formatter={(value: number) => [formatMinutes(value), t('dashboard.chart.focus')]}
            />
            <Bar dataKey="focusMinutes" fill={c.accent2} radius={[4, 4, 0, 0]} isAnimationActive={enabled} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {best && best.focusMinutes > 0 && (
        <p className="mt-2 text-xs text-muted">
          {t('dashboard.focusBest')}: <span className="text-fg">{best.label} · {formatMinutes(best.focusMinutes)}</span>
        </p>
      )}
    </div>
  );
}
