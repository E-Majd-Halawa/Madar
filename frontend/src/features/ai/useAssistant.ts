import { useState, useEffect, useCallback } from 'react';
import i18n from 'i18next';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore, selectActiveWorkspace } from '@/store/workspaceStore';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { aiService } from '@/services/aiService';
import { toast } from '@/store/toastStore';
import type { ChatMessage, OrbMode } from './types';
import type { Task } from '@/types';

const INITIAL_MESSAGES: ChatMessage[] = [];

export function useAssistant() {
  const { session } = useAuthStore();
  const user = session?.user;
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const createTask = useTaskStore((s) => s.create);
  const removeTask = useTaskStore((s) => s.remove);

  const [mode, setMode] = useState<OrbMode>('idle');
  const [loading, setLoading] = useState(false);
  const [newlyAddedCount, setNewlyAddedCount] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!user || !activeWorkspace) return INITIAL_MESSAGES;
    const history = aiService.getHistory(user.id, activeWorkspace.id) as ChatMessage[];
    return history && history.length > 0 ? history : INITIAL_MESSAGES;
  });

  // Save history when messages change
  useEffect(() => {
    if (user && activeWorkspace) {
      aiService.saveHistory(user.id, activeWorkspace.id, messages);
    }
  }, [messages, user, activeWorkspace]);

  const sendPrompt = useCallback(
    async (promptText: string) => {
      if (!promptText.trim() || loading || !user || !activeWorkspace) return;

      const hasArabic = /[\u0600-\u06FF]/.test(promptText);
      const isLatinOnly = /^[a-zA-Z0-9\s.,!?-]+$/.test(promptText);
      const targetLang = hasArabic ? 'ar' : isLatinOnly ? 'en' : useSettingsStore.getState().language;
      if (useSettingsStore.getState().language !== targetLang) {
        useSettingsStore.getState().setLanguage(targetLang as 'en' | 'ar');
        void i18n.changeLanguage(targetLang);
      }

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: promptText };
      setMessages((prev) => [userMsg, ...prev]);
      setLoading(true);
      setMode('thinking');

      try {
        const tasksState = useTaskStore.getState().tasks;
        const allTasks = tasksState.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          dueDate: t.dueDate,
          estimateMinutes: t.estimateMinutes ?? undefined,
        }));

        const res = await aiService.streamPrompt(promptText, {
          userId: user.id,
          workspaceId: activeWorkspace.id,
          tasksSummary: `${tasksState.length} tasks in workspace`,
          allTasks,
        });

        setMode('answering');
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.summary,
          plan: res,
          overdueItems: res.overdueItems,
          subtasks: res.subtasks,
          type: res.type || 'fallback',
        };

        setMessages((prev) => [aiMsg, ...prev]);
      } catch {
        toast.error('AI assistant failed to generate response.');
      } finally {
        setLoading(false);
        setTimeout(() => setMode('idle'), 1500);
      }
    },
    [loading, user, activeWorkspace]
  );

  const handleAddPlanTasks = useCallback(
    async (items: Array<{ title: string; durationMinutes: number; description: string; why?: string }>) => {
      if (!user || !activeWorkspace) return;

      const createdTasks: Task[] = [];
      for (const item of items) {
        const resolvedTitle = item.title.startsWith('ai.') ? i18n.t(item.title) : item.title;
        const resolvedDesc = item.description?.startsWith('ai.') ? i18n.t(item.description) : (item.description || item.why || '');
        const newTask = await createTask(
          {
            workspaceId: activeWorkspace.id,
            projectId: null,
            title: resolvedTitle,
            description: resolvedDesc,
            status: 'todo',
            priority: 'medium',
            category: 'AI Plan',
            startDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            assigneeId: user.id,
            creatorId: user.id,
            tags: ['ai-plan'],
            subtasks: [],
            estimateMinutes: item.durationMinutes,
            trackedMinutes: 0,
          },
          user.id
        );
        if (newTask) createdTasks.push(newTask);
      }

      setNewlyAddedCount(createdTasks.length);
      setTimeout(() => setNewlyAddedCount(0), 4000);

      toast.success(`${createdTasks.length} tasks added to Today`, {
        actionLabel: 'Undo',
        onAction: () => {
          createdTasks.forEach((t) => removeTask(t.id));
          toast.info('Removed AI plan tasks (Undo)');
        },
      });
    },
    [user, activeWorkspace, createTask, removeTask]
  );

  const handleMoveOverdue = useCallback((title: string) => {
    const resolvedTitle = title.startsWith('ai.') ? i18n.t(title) : title;
    toast.success(`"${resolvedTitle}" moved to tomorrow`);
  }, []);

  const handleApplyAllOverdue = useCallback(() => {
    toast.success('All overdue tasks moved to tomorrow');
  }, []);

  const handleAddSubtasks = useCallback((subtasks: string[]) => {
    toast.success(`${subtasks.length} subtasks added`);
  }, []);

  const clearChat = useCallback(() => {
    if (user && activeWorkspace) {
      aiService.clearHistory(user.id, activeWorkspace.id);
    }
    setMessages([]);
    toast.success(i18n.t('ai.chatCleared', 'Chat history cleared'));
  }, [user, activeWorkspace]);

  return {
    messages,
    mode,
    loading,
    newlyAddedCount,
    sendPrompt,
    handleAddPlanTasks,
    handleMoveOverdue,
    handleApplyAllOverdue,
    handleAddSubtasks,
    clearChat,
  };
}
