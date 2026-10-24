import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useFocusStore, type FocusMode, type AmbientPreset } from '@/store/focusStore';
import { formatClock, formatDurationLabel } from '@/utils/formatDuration';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/store/toastStore';
import { 
  Play, Pause, RotateCcw, Moon, Flame, 
  CheckCircle2, Target, Music, X
} from 'lucide-react';

export default function FocusPage() {
  const { t } = useTranslation();
  const { session } = useAuthStore();
  const user = session?.user;
  const tasks = useTaskStore((s) => s.tasks);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);

  const {
    mode,
    durations,
    durationMinutes,
    remainingSeconds,
    isRunning,
    selectedTaskId,
    dndEnabled,
    ambientPreset,
    sessions,
    setMode,
    setDuration,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    setSelectedTask,
    setDndEnabled,
    setAmbientPreset,
    loadSessions,
    logCompletedSession,
  } = useFocusStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.body.style.overflow = '';
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const totalMins = durations[mode];
  const [customHours, setCustomHours] = useState<string>(String(Math.floor(totalMins / 60)));
  const [customMins, setCustomMins] = useState<string>(String(totalMins % 60));

  useEffect(() => {
    const mins = durations[mode];
    setCustomHours(String(Math.floor(mins / 60)));
    setCustomMins(String(mins % 60));
  }, [mode, durations]);

  useEffect(() => {
    if (user?.id) {
      loadSessions(user.id);
    }
  }, [user?.id, loadSessions]);

  // Timer tick effect
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Document title remaining time update
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatClock(remainingSeconds)} - ${t('focus.title')} | ${t('app.name')}`;
    } else {
      document.title = `${t('focus.title')} | ${t('app.name')}`;
    }
    return () => {
      document.title = t('app.name');
    };
  }, [isRunning, remainingSeconds, t]);

  // Handle timer completion
  useEffect(() => {
    if (remainingSeconds === 0 && isRunning === false) {
      if (mode === 'focus' && user?.id) {
        logCompletedSession(user.id);
        toast.success(t('focus.completedToast'), { actionLabel: t('focus.viewStats') });
      }
    }
  }, [remainingSeconds, isRunning, mode, user?.id, logCompletedSession, t]);

  const progressPercent = ((durationMinutes * 60 - remainingSeconds) / (durationMinutes * 60)) * 100;
  const currentTask = tasks.find((t) => t.id === selectedTaskId);
  const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');

  const todaySessions = sessions.filter((s) => new Date(s.startedAt).toDateString() === new Date().toDateString());
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);

  const presetsForMode = mode === 'focus' ? [25, 50, 90] : mode === 'shortBreak' ? [5, 10] : [15, 30];

  const handleCustomDurationChange = (hStr: string, mStr: string) => {
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    let total = h * 60 + m;
    if (h >= 3) {
      total = 180;
    } else {
      total = Math.max(1, Math.min(180, total));
    }
    setDuration(mode, total);
    setCustomHours(String(Math.floor(total / 60)));
    setCustomMins(String(total % 60));
    if (isRunning) {
      toast.success(t('focus.nextSessionNotice'));
    }
  };

  const pageContent = (
    <>
      {/* Top controls & header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-500 animate-pulse" /> {t('focus.title')}
          </h1>
          <p className="text-sm text-text-muted">{t('focus.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-muted px-4 py-2 rounded-xl border border-border">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-text">{t('focus.doNotDisturb')}</span>
            <Switch checked={dndEnabled} onChange={setDndEnabled} label="" description="" />
          </div>
          {!isFullscreen && (
            <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(true)}>
              {t('focus.fullscreen')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Timer Card */}
      <Card className="relative overflow-hidden p-8 sm:p-12 text-center bg-gradient-to-b from-surface via-surface-muted/50 to-surface border-border shadow-2xl">
        <div className={`absolute inset-0 bg-primary/5 pointer-events-none transition-all duration-1000 ${isRunning ? 'animate-pulse scale-105' : ''}`} />

        <div className="relative z-10 space-y-8 max-w-xl mx-auto">
          {/* Mode switch tabs */}
          <div className="inline-flex flex-wrap justify-center p-1.5 rounded-2xl bg-surface-muted border border-border shadow-inner gap-1">
            {(['focus', 'shortBreak', 'longBreak'] as FocusMode[]).map((m) => {
              const label = t('focus.modeLabel', { name: t(`focus.modes.${m}`), minutes: formatDurationLabel(durations[m], t) });
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${mode === m ? 'bg-primary text-primary-fg shadow-sm' : 'text-text-muted hover:text-text'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Custom Duration & Presets Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
            <span className="text-text-muted font-medium">{t('focus.presetsLabel')}:</span>
            <div className="flex items-center gap-1.5">
              {presetsForMode.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setDuration(mode, p);
                    if (isRunning) {
                      toast.success(t('focus.nextSessionNotice'));
                    }
                  }}
                  className={`px-3 py-1 rounded-lg border font-semibold transition ${durations[mode] === p ? 'bg-primary/15 border-primary text-primary' : 'bg-surface border-border text-text-muted hover:text-text'}`}
                >
                  {formatDurationLabel(p, t)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ms-2">
              <span className="text-text-muted">{t('focus.customDuration')}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="3"
                  aria-label={t('focus.hours')}
                  value={customHours}
                  onChange={(e) => {
                    setCustomHours(e.target.value);
                    handleCustomDurationChange(e.target.value, customMins);
                  }}
                  className="w-12 px-1.5 py-1 rounded-lg border border-border bg-surface text-center font-semibold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  dir="ltr"
                />
                <span aria-label={t('focus.hours')} className="text-text-muted"><bdi dir="ltr">{t('focus.hourShort')}</bdi></span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  aria-label={t('focus.minutes')}
                  value={customMins}
                  onChange={(e) => {
                    setCustomMins(e.target.value);
                    handleCustomDurationChange(customHours, e.target.value);
                  }}
                  className="w-12 px-1.5 py-1 rounded-lg border border-border bg-surface text-center font-semibold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  dir="ltr"
                />
                <span aria-label={t('focus.minutes')} className="text-text-muted"><bdi dir="ltr">{t('focus.minuteShort')}</bdi></span>
              </div>
            </div>
          </div>

          {/* Timer Display */}
          <div className="space-y-2">
            <div className={`${isFullscreen ? 'text-8xl md:text-9xl' : 'text-7xl sm:text-8xl'} font-black tracking-tighter text-text font-mono`} dir="ltr">
              <bdi>{formatClock(remainingSeconds)}</bdi>
            </div>
            <div className="w-full bg-surface-muted h-2.5 rounded-full overflow-hidden border border-border">
              <div className="bg-primary h-full transition-all duration-1000 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRunning ? (
              <Button variant="primary" size="lg" onClick={startTimer} className="px-8 rounded-2xl shadow-glow text-base">
                <Play className="w-5 h-5 fill-current" /> {t('focus.start')}
              </Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={pauseTimer} className="px-8 rounded-2xl text-base">
                <Pause className="w-5 h-5" /> {t('focus.pause')}
              </Button>
            )}
            <Button variant="ghost" size="lg" onClick={resetTimer} className="rounded-2xl">
              <RotateCcw className="w-5 h-5" /> {t('focus.reset')}
            </Button>
          </div>

          {/* Active Task Selector */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-start w-full sm:w-auto">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{t('focus.targetTask')}</p>
              <p className="text-sm font-semibold text-text truncate max-w-xs">
                {currentTask ? currentTask.title : t('focus.noTask')}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTask(e.target.value || null)}
                className="px-3 py-2 rounded-xl bg-surface border border-border text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
              >
                <option value="">{t('focus.selectTask')}</option>
                {openTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              {currentTask && currentTask.status !== 'completed' && (
                <Button size="sm" variant="ghost" onClick={() => toggleComplete(currentTask.id)} title={t('tasks.complete')}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Ambient Sound & Stats Grid (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" /> {t('focus.ambient')}
              </h3>
              <span className="text-xs text-text-muted capitalize">{t(`focus.presets.${ambientPreset}`)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['silence', 'rain', 'forest', 'lofi', 'whitenoise'] as AmbientPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmbientPreset(preset)}
                  className={`p-3 rounded-xl border text-xs font-medium capitalize transition ${
                    ambientPreset === preset 
                      ? 'bg-primary/10 border-primary text-primary font-semibold' 
                      : 'bg-surface-muted border-border text-text-muted hover:text-text'
                  }`}
                >
                  {t(`focus.presets.${preset}`)}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> {t('focus.summary')}
            </h3>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-surface-muted border border-border text-center">
                <p className="text-2xl font-bold text-text" dir="ltr"><bdi>{todaySessions.length}</bdi></p>
                <p className="text-xs text-text-muted">{t('focus.sessions')}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-muted border border-border text-center">
                <p className="text-2xl font-bold text-text" dir="ltr"><bdi>{todayMinutes}</bdi></p>
                <p className="text-xs text-text-muted">{t('focus.minutes')}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-muted border border-border text-center">
                <p className="text-2xl font-bold text-text" dir="ltr"><bdi>7</bdi> <span className="text-xs font-normal text-text-muted">d</span></p>
                <p className="text-xs text-text-muted">{t('focus.streak')}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );

  return isFullscreen
    ? createPortal(
        <div className="fixed inset-0 z-50 bg-bg p-6 sm:p-8 flex flex-col items-center justify-center overflow-hidden" dir="auto">
          <div className="absolute end-4 top-4 z-50">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              aria-label={t('focus.exitFullscreen')}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>{t('focus.exitFullscreen')}</span>
            </Button>
          </div>
          <div className="max-w-3xl w-full mx-auto space-y-6 my-auto overflow-hidden">
            {pageContent}
          </div>
        </div>,
        document.body
      )
    : (
        <div className="max-w-5xl mx-auto space-y-8 pb-12" dir="auto">
          {pageContent}
        </div>
      );
}
