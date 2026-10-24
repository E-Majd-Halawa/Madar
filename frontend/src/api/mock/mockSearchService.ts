import type { SearchService, SearchResults, SearchResultBase, SearchOptions, RecentSearch, HighlightRange } from '@/api/contracts/search';
import { SEED_TASKS } from '@/data/tasks';
import { SEED_USERS } from '@/data/users';
import { SEED_PROJECTS } from '@/data/projects';
import { SEED_WORKSPACE_FILES } from '@/data/files';
import { storage } from '@/services/storage/storageAdapter';

// ─── Arabic normalisation helpers ───────────────────────────────────────────
/**
 * Collapse alef variants and strip diacritics for case/accent-insensitive
 * Arabic matching.  English is handled by simple toLowerCase().
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u0627\u0622\u0623\u0625\u0671]/g, '\u0627') // alef variants → bare alef
    .replace(/[\u064B-\u065F\u0670]/g, '')                  // strip diacritics
    .replace(/\u0629/g, '\u0647');                          // teh marbuta → heh
}

// ─── Scoring ─────────────────────────────────────────────────────────────────
function score(
  haystack: string,
  needle: string,
  updatedAt: string,
): { score: number; ranges: HighlightRange[] } {
  const norm = normalise(haystack);
  const nNeedle = normalise(needle);
  if (!nNeedle) return { score: 0, ranges: [] };

  // Exact
  if (norm === nNeedle) {
    const recency = Math.max(0, 30 - daysSince(updatedAt));
    return { score: 100 + recency, ranges: [{ start: 0, end: haystack.length }] };
  }
  // Prefix
  if (norm.startsWith(nNeedle)) {
    const recency = Math.max(0, 20 - daysSince(updatedAt));
    return { score: 80 + recency, ranges: [{ start: 0, end: needle.length }] };
  }
  // Word-boundary match
  const wordIdx = norm.search(new RegExp(`\\b${escapeRe(nNeedle)}`));
  if (wordIdx !== -1) {
    const recency = Math.max(0, 10 - daysSince(updatedAt));
    return { score: 60 + recency, ranges: [{ start: wordIdx, end: wordIdx + needle.length }] };
  }
  // Substring
  const idx = norm.indexOf(nNeedle);
  if (idx !== -1) {
    const recency = Math.max(0, 5 - daysSince(updatedAt));
    return { score: 30 + recency, ranges: [{ start: idx, end: idx + needle.length }] };
  }
  return { score: 0, ranges: [] };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

// ─── Recent search storage ────────────────────────────────────────────────────
const recentKey = (uid: string) => `mock.search.recent.${uid}`;
const MAX_RECENT = 10;

function readRecent(userId: string): RecentSearch[] {
  return storage.get<RecentSearch[]>(recentKey(userId)) ?? [];
}

function writeRecent(userId: string, items: RecentSearch[]): void {
  storage.set(recentKey(userId), items);
}

// ─── Mock data helpers ────────────────────────────────────────────────────────
function getChannelMessages(): Array<{ id: string; channelId: string; channelName: string; content: string; senderId: string; createdAt: string }> {
  try {
    const raw = localStorage.getItem('taskflow.chat.channels') ?? '{}';
    const channelData = JSON.parse(raw) as Record<string, Array<{ id: string; channelId: string; content: string; senderId: string; createdAt: string }>>;
    const channelNames: Record<string, string> = {
      'ch-general': 'General',
      'ch-announcements': 'Announcements',
      'ch-frontend': 'Frontend',
      'ch-backend': 'Backend',
      'ch-design': 'Design',
      'ch-random': 'Random',
    };
    return Object.entries(channelData).flatMap(([channelId, msgs]) =>
      (msgs ?? []).slice(0, 20).map((m) => ({
        ...m,
        channelId,
        channelName: channelNames[channelId] ?? channelId,
      })),
    );
  } catch {
    return [];
  }
}

function getDmMessages(): Array<{ id: string; conversationId: string; content: string; senderId: string; createdAt: string }> {
  try {
    const raw = localStorage.getItem('taskflow.chat') ?? '{}';
    const data = JSON.parse(raw) as { messages?: Record<string, Array<{ id: string; conversationId: string; content: string; senderId: string; createdAt: string }>> };
    return Object.values(data.messages ?? {}).flat().slice(0, 30);
  } catch {
    return [];
  }
}

// ─── Mock implementation ──────────────────────────────────────────────────────
export const mockSearchService: SearchService = {
  async search(query, options) {
    await new Promise((r) => setTimeout(r, 120));

    const { workspaceId, userId, category = 'all', limit = 40 } = options;
    if (!query.trim()) {
      return { query, items: [], counts: { tasks: 0, projects: 0, people: 0, messages: 0, files: 0, events: 0 }, hasMore: false };
    }

    const items: SearchResultBase[] = [];

    // ── Tasks ────────────────────────────────────────────────────────────────
    if (category === 'all' || category === 'tasks') {
      const tasks = SEED_TASKS.filter((t) => t.workspaceId === workspaceId);
      for (const t of tasks) {
        const titleMatch = score(t.title, query, t.updatedAt);
        const descMatch = score(t.description, query, t.updatedAt);
        const best = titleMatch.score >= descMatch.score ? titleMatch : descMatch;
        if (best.score > 0) {
          items.push({
            id: t.id,
            category: 'tasks',
            title: t.title,
            subtitle: t.description || t.status,
            updatedAt: t.updatedAt,
            titleRanges: titleMatch.score > 0 ? titleMatch.ranges : [],
            subtitleRanges: descMatch.score > 0 && descMatch.score >= titleMatch.score ? descMatch.ranges : [],
            score: best.score,
            meta: { status: t.status, priority: t.priority, projectId: t.projectId ?? '' },
          });
        }
      }
    }

    // ── Projects ─────────────────────────────────────────────────────────────
    if (category === 'all' || category === 'projects') {
      const projects = SEED_PROJECTS.filter((p) => p.workspaceId === workspaceId);
      for (const p of projects) {
        const titleMatch = score(p.name, query, p.createdAt);
        const descMatch = score(p.description, query, p.createdAt);
        const best = titleMatch.score >= descMatch.score ? titleMatch : descMatch;
        if (best.score > 0) {
          items.push({
            id: p.id,
            category: 'projects',
            title: p.name,
            subtitle: p.description,
            updatedAt: p.createdAt,
            titleRanges: titleMatch.score > 0 ? titleMatch.ranges : [],
            subtitleRanges: descMatch.score > 0 && descMatch.score >= titleMatch.score ? descMatch.ranges : [],
            score: best.score,
            meta: { status: p.status, color: p.color },
          });
        }
      }
    }

    // ── People ────────────────────────────────────────────────────────────────
    if (category === 'all' || category === 'people') {
      for (const u of SEED_USERS) {
        if (u.id === userId) continue;
        const nameMatch = score(u.fullName, query, u.lastActiveAt);
        const userMatch = score(u.username, query, u.lastActiveAt);
        const emailMatch = score(u.email, query, u.lastActiveAt);
        const best = [nameMatch, userMatch, emailMatch].sort((a, b) => b.score - a.score)[0];
        if (best.score > 0) {
          items.push({
            id: u.id,
            category: 'people',
            title: u.fullName,
            subtitle: `@${u.username}`,
            updatedAt: u.lastActiveAt,
            titleRanges: nameMatch.score > 0 ? nameMatch.ranges : [],
            subtitleRanges: userMatch.score > 0 ? userMatch.ranges : [],
            score: best.score,
            meta: { email: u.email, role: u.role },
          });
        }
      }
    }

    // ── Messages ─────────────────────────────────────────────────────────────
    if (category === 'all' || category === 'messages') {
      const channelMessages = getChannelMessages();
      for (const msg of channelMessages) {
        const m = score(msg.content, query, msg.createdAt);
        if (m.score > 0) {
          const sender = SEED_USERS.find((u) => u.id === msg.senderId);
          items.push({
            id: msg.id,
            category: 'messages',
            title: msg.content.slice(0, 100),
            subtitle: `#${msg.channelName} · ${sender?.fullName ?? msg.senderId}`,
            updatedAt: msg.createdAt,
            titleRanges: m.ranges,
            subtitleRanges: [],
            score: m.score * 0.8,
            meta: { channelId: msg.channelId, senderId: msg.senderId },
          });
        }
      }
      const dmMessages = getDmMessages();
      for (const msg of dmMessages) {
        const m = score(msg.content, query, msg.createdAt);
        if (m.score > 0) {
          const sender = SEED_USERS.find((u) => u.id === msg.senderId);
          items.push({
            id: msg.id,
            category: 'messages',
            title: msg.content.slice(0, 100),
            subtitle: `DM · ${sender?.fullName ?? msg.senderId}`,
            updatedAt: msg.createdAt,
            titleRanges: m.ranges,
            subtitleRanges: [],
            score: m.score * 0.7,
            meta: { conversationId: msg.conversationId, senderId: msg.senderId },
          });
        }
      }
    }

    // ── Files ─────────────────────────────────────────────────────────────────
    if (category === 'all' || category === 'files') {
      const SEED_FILES = SEED_WORKSPACE_FILES;
      for (const f of SEED_FILES) {
        const m = score(f.name, query, f.uploadedAt ?? new Date().toISOString());
        if (m.score > 0) {
          items.push({
            id: f.id,
            category: 'files',
            title: f.name,
            subtitle: f.type,
            updatedAt: f.uploadedAt ?? new Date().toISOString(),
            titleRanges: m.ranges,
            subtitleRanges: [],
            score: m.score,
            meta: { type: f.type, extension: f.extension ?? '' },
          });
        }
      }
    }

    // ── Events (calendar tasks with due dates) ────────────────────────────────
    if (category === 'all' || category === 'events') {
      const tasks = SEED_TASKS.filter((t) => t.workspaceId === workspaceId && t.dueDate);
      for (const t of tasks) {
        const m = score(t.title, query, t.updatedAt);
        if (m.score > 0) {
          items.push({
            id: `evt-${t.id}`,
            category: 'events',
            title: t.title,
            subtitle: t.dueDate ?? '',
            updatedAt: t.updatedAt,
            titleRanges: m.ranges,
            subtitleRanges: [],
            score: m.score * 0.9,
            meta: { dueDate: t.dueDate ?? '', taskId: t.id },
          });
        }
      }
    }

    // Sort by score descending
    items.sort((a, b) => b.score - a.score);
    const paged = items.slice(0, limit);

    const counts = {
      tasks: items.filter((i) => i.category === 'tasks').length,
      projects: items.filter((i) => i.category === 'projects').length,
      people: items.filter((i) => i.category === 'people').length,
      messages: items.filter((i) => i.category === 'messages').length,
      files: items.filter((i) => i.category === 'files').length,
      events: items.filter((i) => i.category === 'events').length,
    } as const;

    return { query, items: paged, counts, hasMore: items.length > limit };
  },

  async getRecentSearches(userId) {
    await new Promise((r) => setTimeout(r, 30));
    return readRecent(userId).slice(0, MAX_RECENT);
  },

  async saveRecentSearch(userId, query) {
    const existing = readRecent(userId).filter((r) => r.query !== query);
    writeRecent(userId, [{ id: `rs-${Date.now()}`, query, timestamp: new Date().toISOString() }, ...existing].slice(0, MAX_RECENT));
  },

  async clearRecentSearches(userId) {
    writeRecent(userId, []);
  },
};
