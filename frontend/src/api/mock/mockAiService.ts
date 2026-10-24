import type { AiService, AiPlanResponse, AiPromptContext } from '@/api/contracts/ai';
import { delay } from './delay';

const STORAGE_PREFIX = 'tf3d.ai.history.';

function normalize(s: string): string {
  if (!s) return '';
  let str = s.toLowerCase();
  // Remove diacritics
  str = str.replace(/[\u064B-\u065F\u0670]/g, '');
  // Unify أ إ آ -> ا
  str = str.replace(/[\u0622\u0623\u0625]/g, '\u0627');
  // ة -> ه
  str = str.replace(/\u0629/g, '\u0647');
  // ى -> ي
  str = str.replace(/\u0649/g, '\u064a');
  // Convert Arabic/Persian digits to English digits
  str = str.replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660));
  str = str.replace(/[\u06f0-\u06f9]/g, (c) => String(c.charCodeAt(0) - 0x06f0));
  return str;
}

function detectIntent(prompt: string): string {
  const norm = normalize(prompt);
  const isGreetingWord = /^(?:hi|hello|hey|greetings|مرحبا|هلا|السلام عليكم|صباح الخير|مساء الخير|اهلاً|أهلاً|السلام|مرحباً)\b/.test(norm) || norm.length <= 5;
  const hasPlanKeywords = /hour|hrs|h|schedule|plan|day|ساع|جدول|خطة|يوم/.test(norm) || /\d/.test(norm);

  if (isGreetingWord && !hasPlanKeywords && !/overdue|late|متأخر|قسّ|قسم|break|split|ملخص|summary|انتاجية|productivity|تركيز|focus|مساعدة|help/.test(norm)) {
    return 'greeting';
  }
  if (/overdue|late|متأخر|متأخره|فائتة|تأخير|متأخرين/.test(norm)) {
    return 'overdue';
  }
  if (/break|subtask|split|قسّ|قسم|تفكيك|جزء|أجزاء|تحليل/.test(norm)) {
    return 'break';
  }
  if (/productivity|summary|ملخص|إنتاجية|انتاجية|تقرير|إحصائيات|احصائيات|stats/.test(norm)) {
    return 'productivity';
  }
  if (/focus|تركيز|عميق|deep work|جلسة|session/.test(norm)) {
    return 'focus';
  }
  if (/help|assistance|مساعدة|مساعده|كيف|ماذا|what can you do|how/.test(norm)) {
    return 'help';
  }
  if (/hour|hrs|h|schedule|plan|day|ساع|جدول|خطة|يوم|\d/.test(norm)) {
    return 'plan';
  }
  return 'unknown';
}

function extractHours(prompt: string): number {
  const norm = normalize(prompt);
  const digitMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hours?|ساع|س)/);
  if (digitMatch) {
    return parseFloat(digitMatch[1]);
  }
  if (/ساعتين|ساعتا|ساعاتين/.test(norm)) return 2;
  if (/ساعة واحدة|ساعة/.test(norm)) return 1;
  if (/ثلاث\s*ساعات|3\s*ساعات/.test(norm)) return 3;
  if (/اربع\s*ساعات|4\s*ساعات/.test(norm)) return 4;
  if (/خمس\s*ساعات|5\s*ساعات/.test(norm)) return 5;
  if (/ست\s*ساعات|6\s*ساعات/.test(norm)) return 6;
  if (/two\s*hours?|2h/.test(norm)) return 2;
  if (/one\s*hour?|1h|an\s*hour/.test(norm)) return 1;
  if (/three\s*hours?|3h/.test(norm)) return 3;
  if (/four\s*hours?|4h/.test(norm)) return 4;
  if (/five\s*hours?|5h/.test(norm)) return 5;
  const anyNum = norm.match(/(\d+(?:\.\d+)?)/);
  if (anyNum && (/hour|hrs|h|ساع|جدول|خطة|يوم|day/.test(norm))) {
    return parseFloat(anyNum[1]);
  }
  return 3;
}

export const mockAiService: AiService = {
  async streamPrompt(
    prompt: string,
    context: AiPromptContext,
    onToken?: (token: string) => void
  ): Promise<AiPlanResponse> {
    await delay(500);
    const intent = detectIntent(prompt);
    let response: AiPlanResponse;

    switch (intent) {
      case 'greeting':
        response = {
          type: 'fallback',
          summary: 'ai.responses.greeting',
          totalMinutes: 0,
          items: [],
        };
        break;
      case 'overdue':
        response = {
          type: 'overdue',
          summary: 'ai.responses.overdue',
          totalMinutes: 0,
          items: [],
          overdueItems: [
            { title: 'ai.overdue.item1.title', daysLate: 3, why: 'ai.overdue.item1.why' },
            { title: 'ai.overdue.item2.title', daysLate: 2, why: 'ai.overdue.item2.why' },
            { title: 'ai.overdue.item3.title', daysLate: 1, why: 'ai.overdue.item3.why' },
          ],
        };
        break;
      case 'break':
        response = {
          type: 'subtasks',
          summary: 'ai.responses.subtasks',
          totalMinutes: 0,
          items: [],
          subtasks: [
            'ai.subtasks.item1',
            'ai.subtasks.item2',
            'ai.subtasks.item3',
            'ai.subtasks.item4',
            'ai.subtasks.item5',
          ],
        };
        break;
      case 'productivity':
        response = {
          type: 'fallback',
          summary: 'ai.responses.productivity',
          totalMinutes: 0,
          items: [],
        };
        break;
      case 'focus':
        response = {
          type: 'fallback',
          summary: 'ai.responses.focus',
          totalMinutes: 0,
          items: [],
        };
        break;
      case 'help':
        response = {
          type: 'fallback',
          summary: 'ai.responses.help',
          totalMinutes: 0,
          items: [],
        };
        break;
      case 'unknown':
        response = {
          type: 'fallback',
          summary: 'ai.responses.unknown',
          totalMinutes: 120,
          items: [
            { title: 'ai.plan.item1.title', durationMinutes: 60, description: 'ai.plan.item1.desc', why: 'ai.plan.item1.why' },
            { title: 'ai.plan.item2.title', durationMinutes: 60, description: 'ai.plan.item2.desc', why: 'ai.plan.item2.why' },
          ],
          suggestionKeys: ['ai.chips.plan', 'ai.chips.overdue', 'ai.chips.breakdown'],
        };
        break;
      case 'plan':
      default: {
        const hours = extractHours(prompt);
        const availMinutes = Math.round(hours * 60);
        const userTasks = context.allTasks?.filter((t) => t.status !== 'completed') ?? [];
        let items = userTasks.slice(0, 4).map((t, idx) => ({
          title: t.title,
          durationMinutes: t.estimateMinutes || (idx === 0 ? 45 : 30),
          description: 'ai.plan.defaultDesc',
          why: idx === 0 ? 'ai.plan.item1.why' : 'ai.plan.defaultWhy',
        }));

        if (items.length === 0) {
          items = [
            { title: 'ai.plan.item1.title', durationMinutes: Math.min(availMinutes, 35), description: 'ai.plan.item1.desc', why: 'ai.plan.item1.why' },
            { title: 'ai.plan.item2.title', durationMinutes: Math.min(availMinutes, 70), description: 'ai.plan.item2.desc', why: 'ai.plan.item2.why' },
            { title: 'ai.plan.item3.title', durationMinutes: Math.min(availMinutes, 40), description: 'ai.plan.item3.desc', why: 'ai.plan.item3.why' },
            { title: 'ai.plan.item4.title', durationMinutes: Math.min(availMinutes, 20), description: 'ai.plan.item4.desc', why: 'ai.plan.item4.why' },
          ];
        }

        const totalMins = items.reduce((acc, curr) => acc + curr.durationMinutes, 0);
        response = {
          type: 'plan',
          summary: 'ai.responses.plan',
          totalMinutes: totalMins,
          items,
        };
        break;
      }
    }

    if (onToken) {
      const text = response.summary;
      for (const char of text) {
        onToken(char);
      }
    }

    return response;
  },

  getHistory(userId: string, workspaceId: string) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + userId + '.' + workspaceId);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveHistory(userId: string, workspaceId: string, messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; plan?: AiPlanResponse; type?: string }>) {
    try {
      localStorage.setItem(STORAGE_PREFIX + userId + '.' + workspaceId, JSON.stringify(messages));
    } catch {
      // ignore
    }
  },

  clearHistory(userId: string, workspaceId: string) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + userId + '.' + workspaceId);
    } catch {
      // ignore
    }
  },
};
