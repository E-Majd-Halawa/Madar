import { create } from 'zustand';
import type { ChatMessage, Conversation, ChatState, Channel, ChannelMessage, CreateChannelInput, Attachment } from '@/types';
import { useAuthStore } from './authStore';
import { useDirectoryStore } from './directoryStore';
import { chatService } from '@/services/chatService';
import { hasPermission } from '@/utils/permissions';

const STORAGE_KEY = 'taskflow.chat';

const loadFromStorage = (): { conversations: Conversation[]; messages: Record<string, ChatMessage[]> } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { conversations: [], messages: {} };
};

const saveStorageConversations = (conversations: Conversation[], messages: Record<string, ChatMessage[]>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, messages }));
  } catch {
    // ignore
  }
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const currentUserId = () => useAuthStore.getState().session?.user?.id ?? 'u-001';
const currentUserRole = () => useAuthStore.getState().session?.user?.role ?? 'user';

export const useChatStore = create<ChatState>((set, get) => {
  const initial = loadFromStorage();

  return {
    conversations: initial.conversations,
    messages: initial.messages,
    activeConversationId: null,

    channels: [],
    channelMessages: {},
    activeChannelId: null,
    activeThreadId: null,
    typingUsers: {},

    loadConversations: async () => {
      await new Promise((r) => setTimeout(r, 200));
      const { conversations } = get();
      if (conversations.length === 0) {
        const me = currentUserId();
        const users = Object.values(useDirectoryStore.getState().byId).filter((u) => u.id !== me);
        const demoConversations: Conversation[] = users.slice(0, 8).map((u, i) => ({
          id: `conv-${u.id}`,
          type: 'direct',
          participantIds: [me, u.id],
          lastMessage: {
            id: `msg-${generateId()}`,
            conversationId: `conv-${u.id}`,
            senderId: i % 2 === 0 ? u.id : me,
            content: i % 2 === 0 ? 'Hey! How is the project going?' : 'Going great, thanks for asking.',
            createdAt: new Date(Date.now() - (7 - i) * 3600000).toISOString(),
            read: i % 2 === 0,
            type: 'text',
          },
          unreadCount: i % 3 === 0 ? 1 : 0,
          updatedAt: new Date(Date.now() - (7 - i) * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * (10 + i)).toISOString(),
          pinned: i === 0,
          muted: false,
          archived: false,
        }));
        set({ conversations: demoConversations });
        saveStorageConversations(demoConversations, {});
      }
    },

    loadMessages: async (conversationId: string) => {
      await new Promise((r) => setTimeout(r, 150));
      const { messages } = get();
      if (!messages[conversationId]) {
        const conversation = get().conversations.find((c) => c.id === conversationId);
        if (!conversation) return;

        const otherParticipant = conversation.participantIds.find((id) => id !== currentUserId());
        const demoMessages: ChatMessage[] = Array.from({ length: 12 }, (_, i) => ({
          id: `msg-${conversationId}-${i}`,
          conversationId,
          senderId: i % 2 === 0 ? (otherParticipant ?? currentUserId()) : currentUserId(),
          content: [
            'Hey! How are you?',
            'I\'m doing great! How about you?',
            'Pretty good. Did you see the latest updates?',
            'Yes, the new features look amazing!',
            'When do you think we can ship?',
            'Targeting next week if all tests pass.',
            'Awesome! Let me know if you need help.',
            'Will do. Thanks!',
            'Also, the design review is tomorrow at 2pm.',
            'Got it, I\'ll be there.',
            'Perfect. See you then!',
            'Looking forward to it!',
          ][i],
          createdAt: new Date(Date.now() - (11 - i) * 1800000).toISOString(),
          read: i < 10,
          type: 'text',
          reactions: {},
          attachments: [],
          status: 'read',
        }));

        set((s) => {
          const nextMessages = { ...s.messages, [conversationId]: demoMessages };
          saveStorageConversations(s.conversations, nextMessages);
          return { messages: nextMessages };
        });
      }
    },

    sendMessage: async (conversationId: string, content: string) => {
      const me = currentUserId();
      const newMessage: ChatMessage = {
        id: `msg-${generateId()}`,
        conversationId,
        senderId: me,
        content,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'text',
        reactions: {},
        attachments: [],
        status: 'sending',
      };

      set((s) => {
        const updatedMessages = {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] || []), newMessage],
        };

        const updatedConversations = s.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt, unreadCount: 0 }
            : c,
        );

        saveStorageConversations(updatedConversations, updatedMessages);
        return { messages: updatedMessages, conversations: updatedConversations };
      });

      setTimeout(() => {
        set((s) => {
          const msgs = s.messages[conversationId] || [];
          const updated = msgs.map((m) => (m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m));
          return { messages: { ...s.messages, [conversationId]: updated } };
        });
      }, 400);

      return newMessage;
    },

    setActiveConversation: (id: string | null) => set({ activeConversationId: id }),

    markAsRead: (conversationId: string) => {
      set((s) => {
        const updatedMessages = {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] || []).map((m) => ({ ...m, read: true, status: 'read' as const })),
        };

        const updatedConversations = s.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c,
        );

        saveStorageConversations(updatedConversations, updatedMessages);
        return { messages: updatedMessages, conversations: updatedConversations };
      });
    },

    createDirectConversation: async (otherUserId: string) => {
      return get().startDirectConversation(otherUserId);
    },

    startDirectConversation: async (otherUserId: string) => {
      const me = currentUserId();
      const existing = get().conversations.find(
        (c) => c.type === 'direct' && [...c.participantIds].sort().join(',') === [...[me, otherUserId]].sort().join(','),
      );

      if (existing) return existing;

      const newConv = await chatService.startDirectConversation(me, otherUserId);

      set((s) => {
        const updated = [newConv, ...s.conversations.filter((c) => c.id !== newConv.id)];
        saveStorageConversations(updated, s.messages);
        return { conversations: updated };
      });

      return newConv;
    },

    // Channels
    loadChannels: async () => {
      const channels = await chatService.loadChannels();
      set({ channels });
    },

    setActiveChannel: (id: string | null) => {
      set({ activeChannelId: id, activeThreadId: null });
      if (id) {
        get().loadChannelMessages(id);
        get().markChannelRead(id);
      }
    },

    loadChannelMessages: async (channelId: string) => {
      const messages = await chatService.loadChannelMessages(channelId);
      set((s) => ({
        channelMessages: { ...s.channelMessages, [channelId]: messages },
      }));
    },

    sendChannelMessage: async (channelId: string, content: string, attachments: Attachment[] = [], mentions: string[] = []) => {
      const me = currentUserId();
      const role = currentUserRole();
      const channel = get().channels.find((c) => c.id === channelId);
      if (!channel) {
        throw new Error('chat.permissionDenied');
      }
      if (channel.kind === 'announcements') {
        if (!hasPermission(role, 'chat:post_in_announcements')) {
          throw new Error('chat.onlyModeratorsCanPost');
        }
      }

      const msg = await chatService.sendChannelMessage(channelId, me, role, content, attachments, mentions);
      set((s) => {
        const list = s.channelMessages[channelId] || [];
        return {
          channelMessages: { ...s.channelMessages, [channelId]: [...list, msg] },
        };
      });

      // Typing simulation after sending: one other real user from directory store appears in typingUsers for 1 to 2 seconds starting ~500ms after sending
      setTimeout(() => {
        const directoryUsers = Object.values(useDirectoryStore.getState().byId).filter((u) => u.id !== me);
        if (directoryUsers.length > 0) {
          const randomUser = directoryUsers[Math.floor(Math.random() * directoryUsers.length)];
          set((s) => {
            const current = s.typingUsers[channelId] || [];
            return {
              typingUsers: { ...s.typingUsers, [channelId]: Array.from(new Set([...current, randomUser.id])) },
            };
          });
          setTimeout(() => {
            set((s) => {
              const current = s.typingUsers[channelId] || [];
              return {
                typingUsers: { ...s.typingUsers, [channelId]: current.filter((id) => id !== randomUser.id) },
              };
            });
          }, 1500); // 1.5 seconds
        }
      }, 500);

      return msg;
    },

    editChannelMessage: async (channelId: string, messageId: string, content: string) => {
      const me = currentUserId();
      const updated = await chatService.editChannelMessage(channelId, messageId, me, content);
      set((s) => {
        const list = s.channelMessages[channelId] || [];
        return {
          channelMessages: {
            ...s.channelMessages,
            [channelId]: list.map((m) => (m.id === messageId ? updated : m)),
          },
        };
      });
    },

    deleteChannelMessage: async (channelId: string, messageId: string) => {
      const me = currentUserId();
      const role = currentUserRole();
      const list = get().channelMessages[channelId] || [];
      const target = list.find((m) => m.id === messageId);
      if (target) {
        const isAuthor = target.senderId === me;
        const canDeleteAny = hasPermission(role, 'chat:delete_any_message');
        if (!isAuthor && !canDeleteAny) {
          throw new Error('chat.permissionDenied');
        }
      }

      await chatService.deleteChannelMessage(channelId, messageId, me, role);
      set((s) => {
        const l = s.channelMessages[channelId] || [];
        return {
          channelMessages: {
            ...s.channelMessages,
            [channelId]: l.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: '' } : m)),
          },
        };
      });
    },

    toggleReaction: async (channelId: string, messageId: string, emoji: string) => {
      const me = currentUserId();
      const updated = await chatService.toggleReaction(channelId, messageId, me, emoji);
      set((s) => {
        const list = s.channelMessages[channelId] || [];
        return {
          channelMessages: {
            ...s.channelMessages,
            [channelId]: list.map((m) => (m.id === messageId ? updated : m)),
          },
        };
      });
    },

    openThread: (channelId: string, rootMessageId: string) => {
      set({ activeChannelId: channelId, activeThreadId: rootMessageId });
    },

    closeThread: () => {
      set({ activeThreadId: null });
    },

    sendThreadReply: async (channelId: string, rootMessageId: string, content: string, attachments: Attachment[] = [], mentions: string[] = []) => {
      const me = currentUserId();
      const role = currentUserRole();
      const channel = get().channels.find((c) => c.id === channelId);
      if (!channel) {
        throw new Error('chat.permissionDenied');
      }
      if (channel.kind === 'announcements') {
        if (!hasPermission(role, 'chat:post_in_announcements')) {
          throw new Error('chat.onlyModeratorsCanPost');
        }
      }

      const reply = await chatService.sendThreadReply(channelId, rootMessageId, me, role, content, attachments, mentions);
      set((s) => {
        const list = s.channelMessages[channelId] || [];
        const updatedList = list.map((m) => (m.id === rootMessageId ? { ...m, replyCount: (m.replyCount || 0) + 1 } : m));
        updatedList.push(reply);
        return {
          channelMessages: { ...s.channelMessages, [channelId]: updatedList },
        };
      });
      return reply;
    },

    createChannel: async (input: CreateChannelInput) => {
      const me = currentUserId();
      const role = currentUserRole();
      if (!hasPermission(role, 'chat:create_channel')) {
        throw new Error('chat.permissionDenied');
      }

      const trimmed = input.name.trim();
      if (trimmed.length < 2 || trimmed.length > 30 || !/^[a-zA-Z0-9-]+$/.test(trimmed)) {
        throw new Error('chat.channelNameInvalid');
      }

      const slug = trimmed.toLowerCase();
      const existing = get().channels.find((c) => c.slug === slug || c.name.toLowerCase() === slug);
      if (existing) {
        throw new Error('chat.channelNameTaken');
      }

      if (input.isReadOnly && input.kind !== 'announcements') {
        throw new Error('chat.permissionDenied');
      }

      const channel = await chatService.createChannel(input, me, role);
      set((s) => ({
        channels: [...s.channels, channel],
        channelMessages: { ...s.channelMessages, [channel.id]: [] },
      }));
      return channel;
    },

    markChannelRead: (channelId: string) => {
      set((s) => ({
        channels: s.channels.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c)),
      }));
    },

    setTyping: (channelId: string, isTyping: boolean) => {
      const me = currentUserId();
      set((s) => {
        const current = s.typingUsers[channelId] || [];
        const next = isTyping ? Array.from(new Set([...current, me])) : current.filter((id) => id !== me);
        return {
          typingUsers: { ...s.typingUsers, [channelId]: next },
        };
      });
      if (isTyping) {
        setTimeout(() => {
          set((s) => {
            const current = s.typingUsers[channelId] || [];
            return {
              typingUsers: { ...s.typingUsers, [channelId]: current.filter((id) => id !== me) },
            };
          });
        }, 3000);
      }
    },

    // DM additional actions
    pinConversation: async (conversationId: string) => {
      set((s) => {
        const updated = s.conversations.map((c) =>
          c.id === conversationId ? { ...c, pinned: !c.pinned } : c,
        );
        saveStorageConversations(updated, s.messages);
        return { conversations: updated };
      });
    },

    muteConversation: async (conversationId: string) => {
      set((s) => {
        const updated = s.conversations.map((c) =>
          c.id === conversationId ? { ...c, muted: !c.muted } : c,
        );
        saveStorageConversations(updated, s.messages);
        return { conversations: updated };
      });
    },

    archiveConversation: async (conversationId: string) => {
      set((s) => {
        const updated = s.conversations.map((c) =>
          c.id === conversationId ? { ...c, archived: !c.archived } : c,
        );
        saveStorageConversations(updated, s.messages);
        return { conversations: updated };
      });
    },

    deleteConversation: async (conversationId: string) => {
      set((s) => {
        const updated = s.conversations.filter((c) => c.id !== conversationId);
        const nextMsgs = { ...s.messages };
        delete nextMsgs[conversationId];
        saveStorageConversations(updated, nextMsgs);
        return {
          conversations: updated,
          messages: nextMsgs,
          activeConversationId: s.activeConversationId === conversationId ? null : s.activeConversationId,
        };
      });
    },

    sendDirectMessage: async (conversationId: string, content: string, attachments: Attachment[] = []) => {
      const me = currentUserId();
      const newMessage: ChatMessage = {
        id: `msg-${generateId()}`,
        conversationId,
        senderId: me,
        content,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'text',
        reactions: {},
        attachments,
        status: 'sending',
      };

      set((s) => {
        const updatedMessages = {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] || []), newMessage],
        };
        const updatedConversations = s.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt, unreadCount: 0 }
            : c,
        );
        saveStorageConversations(updatedConversations, updatedMessages);
        return { messages: updatedMessages, conversations: updatedConversations };
      });

      setTimeout(() => {
        set((s) => {
          const msgs = s.messages[conversationId] || [];
          const updated = msgs.map((m) => (m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m));
          return { messages: { ...s.messages, [conversationId]: updated } };
        });
      }, 400);

      return newMessage;
    },

    toggleDirectReaction: async (conversationId: string, messageId: string, emoji: string) => {
      const me = currentUserId();
      let target: ChatMessage | null = null;
      set((s) => {
        const list = s.messages[conversationId] || [];
        const nextList = list.map((m) => {
          if (m.id === messageId) {
            const reactions = { ...(m.reactions || {}) };
            const users = reactions[emoji] || [];
            if (users.includes(me)) {
              reactions[emoji] = users.filter((id) => id !== me);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = [...users, me];
            }
            target = { ...m, reactions };
            return target;
          }
          return m;
        });
        const updatedMessages = { ...s.messages, [conversationId]: nextList };
        saveStorageConversations(s.conversations, updatedMessages);
        return { messages: updatedMessages };
      });
      if (!target) throw new Error('Message not found');
      return target;
    },

    editDirectMessage: async (conversationId: string, messageId: string, content: string) => {
      const me = currentUserId();
      let target: ChatMessage | null = null;
      set((s) => {
        const list = s.messages[conversationId] || [];
        const nextList = list.map((m) => {
          if (m.id === messageId) {
            if (m.senderId !== me) throw new Error('chat.permissionDenied');
            target = { ...m, content };
            return target;
          }
          return m;
        });
        const updatedMessages = { ...s.messages, [conversationId]: nextList };
        saveStorageConversations(s.conversations, updatedMessages);
        return { messages: updatedMessages };
      });
      if (!target) throw new Error('Message not found');
      return target;
    },

    deleteDirectMessage: async (conversationId: string, messageId: string) => {
      const me = currentUserId();
      const role = currentUserRole();
      const list = get().messages[conversationId] || [];
      const msg = list.find((m) => m.id === messageId);
      if (msg) {
        const isAuthor = msg.senderId === me;
        const canDeleteAny = hasPermission(role, 'chat:delete_any_message');
        if (!isAuthor && !canDeleteAny) {
          throw new Error('chat.permissionDenied');
        }
      }

      await chatService.deleteDirectMessage(conversationId, messageId, me, role);
      set((s) => {
        const l = s.messages[conversationId] || [];
        const nextList = l.filter((m) => m.id !== messageId);
        const updatedMessages = { ...s.messages, [conversationId]: nextList };
        saveStorageConversations(s.conversations, updatedMessages);
        return { messages: updatedMessages };
      });
    },
  };
});
