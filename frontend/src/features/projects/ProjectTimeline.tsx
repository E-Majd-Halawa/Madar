import { useMemo, useState } from 'react';
import {
  addDays,
  differenceInDays,
  format,
  isAfter,
  isBefore,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
} from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, ChevronRight, Flag, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { useTaskStore } from '@/store/taskStore';
import type { Project, Task } from '@/types';
import { cn } from '@/utils/cn';

interface ProjectTimelineProps {
  projects: Project[];
  activeProjectId?: string;
  className?: string;
}

export function ProjectTimeline({ projects, activeProjectId, className }: ProjectTimelineProps) {
  const { t } = useTranslation();
  const allTasks = useTaskStore((s) => s.tasks);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<{
    id: string;
    title: string;
    start: string;
    due: string;
    progress: number;
    tasksCount: string;
  } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Determine timeline overall range
  const { timelineStart, timelineEnd, totalDays, intervals } = useMemo(() => {
    const today = startOfDay(new Date());
    let earliest = addDays(today, -30);
    let latest = addDays(today, 60);

    const dates: Date[] = [];
    for (const p of projects) {
      if (p.startDate) dates.push(parseISO(p.startDate));
      if (p.dueDate) dates.push(parseISO(p.dueDate));
    }

    if (dates.length > 0) {
      const minD = minDate(dates);
      const maxD = maxDate(dates);
      if (isBefore(minD, earliest)) earliest = addDays(minD, -7);
      if (isAfter(maxD, latest)) latest = addDays(maxD, 14);
    }

    const diff = Math.max(differenceInDays(latest, earliest), 14);

    // Create month or 2-week intervals for the timeline header
    const segments: { label: string; offsetPct: number; widthPct: number }[] = [];
    const stepDays = 14;
    for (let dayOffset = 0; dayOffset < diff; dayOffset += stepDays) {
      const segDate = addDays(earliest, dayOffset);
      const segWidth = Math.min(stepDays, diff - dayOffset);
      segments.push({
        label: format(segDate, 'MMM d'),
        offsetPct: (dayOffset / diff) * 100,
        widthPct: (segWidth / diff) * 100,
      });
    }

    return {
      timelineStart: earliest,
      timelineEnd: latest,
      totalDays: diff,
      intervals: segments,
    };
  }, [projects]);

  // "Today" position on the timeline
  const todayOffsetPct = useMemo(() => {
    const today = startOfDay(new Date());
    const offset = differenceInDays(today, timelineStart);
    return Math.max(0, Math.min(100, (offset / totalDays) * 100));
  }, [timelineStart, totalDays]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted">
        <Calendar className="size-10 mb-3 text-muted/50" />
        <p className="text-sm font-medium">{t('projects.empty')}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-2xl border border-border/20 bg-surface/40 p-4 backdrop-blur-sm', className)}>
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-fg flex items-center gap-2">
            <Flag className="size-4 text-accent" />
            {t('timeline.title')}
          </h2>
          <p className="text-xs text-muted">{t('timeline.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-accent" />
            <span>{t('timeline.progress', { pct: 100 })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-danger" />
            <span>{t('calendar.today')}</span>
          </div>
        </div>
      </div>

      {/* Gantt View Container with horizontal scroll */}
      <div className="overflow-x-auto select-none pb-2 scrollbar-thin">
        <div className="min-w-[700px]">
          {/* Timeline Grid Header */}
          <div className="relative flex border-b border-border/20 pb-2 text-[11px] font-semibold text-muted">
            <div className="w-52 shrink-0 pe-4 ps-2">{t('projects.title')}</div>
            <div className="relative flex-1 h-5">
              {intervals.map((seg, i) => (
                <div
                  key={i}
                  className="absolute top-0 truncate border-s border-border/15 ps-1.5 text-muted"
                  style={{ left: `${seg.offsetPct}%`, width: `${seg.widthPct}%` }}
                >
                  {seg.label}
                </div>
              ))}
              {/* Today marker label */}
              <div
                className="absolute -top-1 -translate-x-1/2 z-10 px-1 rounded bg-danger text-[10px] font-bold text-white shadow-sm"
                style={{ left: `${todayOffsetPct}%` }}
              >
                {t('calendar.today')}
              </div>
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="relative divide-y divide-border/10 py-1">
            {/* Today vertical line */}
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10 w-px border-s-2 border-dashed border-danger/60"
              style={{ left: `calc(13rem + (100% - 13rem) * ${todayOffsetPct / 100})` }}
            />

            {projects.map((project) => {
              const pStart = project.startDate ? parseISO(project.startDate) : timelineStart;
              const pEnd = project.dueDate ? parseISO(project.dueDate) : addDays(pStart, 14);

              const startOffset = Math.max(0, differenceInDays(pStart, timelineStart));
              const duration = Math.max(1, differenceInDays(pEnd, pStart));

              const leftPct = Math.max(0, Math.min(99, (startOffset / totalDays) * 100));
              const widthPct = Math.max(3, Math.min(100 - leftPct, (duration / totalDays) * 100));

              // Tasks inside this project
              const pTasks = allTasks.filter((t) => t.projectId === project.id && t.status !== 'archived');
              const doneCount = pTasks.filter((t) => t.status === 'completed').length;
              const pct = pTasks.length > 0 ? Math.round((doneCount / pTasks.length) * 100) : 0;
              const isExpanded = !!expandedProjects[project.id];

              return (
                <div key={project.id} className="group/row py-2">
                  {/* Project Row */}
                  <div className="flex items-center">
                    {/* Left: Project Info */}
                    <div className="w-52 shrink-0 pe-3 ps-1 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {pTasks.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(project.id)}
                            className="p-0.5 text-muted hover:text-fg transition rounded"
                          >
                            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                          </button>
                        ) : (
                          <span className="w-4" />
                        )}
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                        <Link
                          to={`/app/projects/${project.id}`}
                          className="truncate text-xs font-semibold text-fg hover:text-accent transition"
                          title={project.name}
                        >
                          {project.name}
                        </Link>
                      </div>
                      <span className="text-[10px] text-muted shrink-0">{pct}%</span>
                    </div>

                    {/* Right: Gantt Bar Track */}
                    <div className="relative flex-1 h-8 rounded-lg bg-surface-2/20 flex items-center px-1">
                      {/* Project Milestone Bar */}
                      <motion.div
                        whileHover={{ scaleY: 1.15 }}
                        onMouseEnter={() =>
                          setHoveredItem({
                            id: project.id,
                            title: project.name,
                            start: format(pStart, 'MMM d, yyyy'),
                            due: format(pEnd, 'MMM d, yyyy'),
                            progress: pct,
                            tasksCount: `${doneCount}/${pTasks.length}`,
                          })
                        }
                        onMouseLeave={() => setHoveredItem(null)}
                        className="absolute h-5 rounded-md shadow-sm cursor-pointer overflow-hidden border border-white/10 transition-all flex items-center"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          backgroundColor: `${project.color}33`,
                        }}
                      >
                        {/* Progress Fill */}
                        <div
                          className="h-full rounded-s-md transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: project.color,
                          }}
                        />
                        <span className="absolute inset-0 px-2 flex items-center text-[10px] font-bold text-fg drop-shadow-sm truncate">
                          {project.name} ({duration}d)
                        </span>
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Task Progression Bars */}
                  {isExpanded && pTasks.length > 0 && (
                    <div className="space-y-1.5 pt-1.5 ps-6">
                      {pTasks.map((task) => {
                        const tStart = task.startDate ? parseISO(task.startDate) : (task.dueDate ? addDays(parseISO(task.dueDate), -3) : pStart);
                        const tEnd = task.dueDate ? parseISO(task.dueDate) : addDays(tStart, 3);
                        const tOffset = Math.max(0, differenceInDays(tStart, timelineStart));
                        const tDuration = Math.max(1, differenceInDays(tEnd, tStart));
                        const tLeft = Math.max(0, Math.min(99, (tOffset / totalDays) * 100));
                        const tWidth = Math.max(2.5, Math.min(100 - tLeft, (tDuration / totalDays) * 100));

                        return (
                          <div key={task.id} className="flex items-center text-[11px]">
                            <div className="w-[11.5rem] shrink-0 truncate pe-2 text-muted ps-2 flex items-center gap-1.5">
                              <span className={cn('size-1.5 rounded-full', task.status === 'completed' ? 'bg-accent' : 'bg-muted/60')} />
                              <span className={cn('truncate', task.status === 'completed' && 'line-through text-muted/60')}>
                                {task.title}
                              </span>
                            </div>
                            <div className="relative flex-1 h-5 rounded bg-surface-2/10 flex items-center">
                              <div
                                className={cn(
                                  'absolute h-3 rounded-sm transition cursor-pointer',
                                  task.status === 'completed' ? 'bg-accent/80' : 'bg-surface-3/80 border border-border/30 hover:border-accent',
                                )}
                                style={{
                                  left: `${tLeft}%`,
                                  width: `${tWidth}%`,
                                }}
                                title={`${task.title} (${task.status})`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredItem && (
        <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-accent/20 bg-surface-2/80 px-4 py-2 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-accent" />
            <span className="font-bold text-fg">{hoveredItem.title}</span>
            <span className="text-muted">
              ({hoveredItem.start} → {hoveredItem.due})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted">
              {t('projects.card.progress')}: <strong className="text-fg">{hoveredItem.progress}%</strong>
            </span>
            <span className="text-muted">
              {t('projects.workspace.overview.stats.tasksTotal')}: <strong className="text-fg">{hoveredItem.tasksCount}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
