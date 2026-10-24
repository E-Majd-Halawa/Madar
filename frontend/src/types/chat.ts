import type { Role } from './index';

export interface Attachment {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  kind: 'public' | 'announcements';
  isReadOnly: boolean;
  createdBy: string;
  createdAt: string;
  unreadCount?: number;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  threadRootId?: string;
  replyCount: number;
  reactions: Record<string, string[]>;
  mentions: string[];
  attachments: Attachment[];
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
  type: 'text' | 'system';
  reactions?: Record<string, string[]>;
  attachments?: Attachment[];
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
}

export interface CreateChannelInput {
  name: string;
  description: string;
  kind: 'public' | 'announcements';
  isReadOnly: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeConversationId: string | null;

  channels: Channel[];
  channelMessages: Record<string, ChannelMessage[]>;
  activeChannelId: string | null;
  activeThreadId: string | null;
  typingUsers: Record<string, string[]>;

  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<ChatMessage>;
  setActiveConversation: (id: string | null) => void;
  markAsRead: (conversationId: string) => void;
  createDirectConversation: (otherUserId: string) => Promise<Conversation>;
  startDirectConversation: (otherUserId: string) => Promise<Conversation>;

  loadChannels: () => Promise<void>;
  setActiveChannel: (id: string | null) => void;
  loadChannelMessages: (channelId: string) => Promise<void>;
  sendChannelMessage: (channelId: string, content: string, attachments?: Attachment[], mentions?: string[]) => Promise<ChannelMessage>;
  editChannelMessage: (channelId: string, messageId: string, content: string) => Promise<void>;
  deleteChannelMessage: (channelId: string, messageId: string) => Promise<void>;
  toggleReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
  openThread: (channelId: string, rootMessageId: string) => void;
  closeThread: () => void;
  sendThreadReply: (channelId: string, rootMessageId: string, content: string, attachments?: Attachment[], mentions?: string[]) => Promise<ChannelMessage>;
  createChannel: (input: CreateChannelInput) => Promise<Channel>;
  markChannelRead: (channelId: string) => void;
  setTyping: (channelId: string, isTyping: boolean) => void;

  pinConversation: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  sendDirectMessage: (conversationId: string, content: string, attachments?: Attachment[]) => Promise<ChatMessage>;
  toggleDirectReaction: (conversationId: string, messageId: string, emoji: string) => Promise<ChatMessage>;
  editDirectMessage: (conversationId: string, messageId: string, content: string) => Promise<ChatMessage>;
  deleteDirectMessage: (conversationId: string, messageId: string) => Promise<void>;
}
