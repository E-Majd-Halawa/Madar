import type { Attachment, Channel, ChannelMessage, Conversation, CreateChannelInput } from '@/types';
import type { Role } from '@/types';

/**
 * Channels, threads, reactions and direct conversations.
 * Signatures mirror the methods already exposed by `mockChatService`.
 */
export interface ChatService {
  loadChannels(): Promise<Channel[]>;
  getChannel(id: string): Promise<Channel | null>;
  createChannel(input: CreateChannelInput, creatorId: string, role: Role): Promise<Channel>;
  loadChannelMessages(channelId: string): Promise<ChannelMessage[]>;
  sendChannelMessage(
    channelId: string,
    senderId: string,
    senderRole: Role,
    content: string,
    attachments?: Attachment[],
    mentions?: string[],
  ): Promise<ChannelMessage>;
  editChannelMessage(
    channelId: string,
    messageId: string,
    senderId: string,
    content: string,
  ): Promise<ChannelMessage>;
  deleteChannelMessage(
    channelId: string,
    messageId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void>;
  toggleReaction(
    channelId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<ChannelMessage>;
  sendThreadReply(
    channelId: string,
    rootMessageId: string,
    senderId: string,
    senderRole: Role,
    content: string,
    attachments?: Attachment[],
    mentions?: string[],
  ): Promise<ChannelMessage>;
  startDirectConversation(userId: string, otherUserId: string): Promise<Conversation>;
  deleteDirectMessage(
    conversationId: string,
    messageId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void>;
}
