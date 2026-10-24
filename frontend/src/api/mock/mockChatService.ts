import type { Channel, ChannelMessage, Conversation, ChatMessage, CreateChannelInput, Attachment } from '@/types';
import type { Role } from '@/types';
import type { ChatService } from '@/api/contracts/chat';
import { hasPermission } from '@/utils/permissions';

const STORAGE_CHANNELS = 'taskflow.chat.channels';
const STORAGE_CONV = 'taskflow.chat';

const defaultChannels: Channel[] = [
  {
    id: 'ch-general',
    name: 'General',
    slug: 'general',
    description: 'Company-wide announcements and discussion',
    kind: 'public',
    isReadOnly: false,
    createdBy: 'u-002',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'ch-announcements',
    name: 'Announcements',
    slug: 'announcements',
    description: 'Official updates from leadership',
    kind: 'announcements',
    isReadOnly: true,
    createdBy: 'u-002',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'ch-frontend',
    name: 'Frontend',
    slug: 'frontend',
    description: 'React, UI, CSS, accessibility',
    kind: 'public',
    isReadOnly: false,
    createdBy: 'u-001',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'ch-backend',
    name: 'Backend',
    slug: 'backend',
    description: 'Node.js, NestJS, databases, APIs',
    kind: 'public',
    isReadOnly: false,
    createdBy: 'u-002',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'ch-design',
    name: 'Design',
    slug: 'design',
    description: 'Figma, design systems, UX research',
    kind: 'public',
    isReadOnly: false,
    createdBy: 'u-003',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'ch-random',
    name: 'Random',
    slug: 'random',
    description: 'Off-topic, memes, hobbies',
    kind: 'public',
    isReadOnly: false,
    createdBy: 'u-001',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const generateId = (prefix = 'msg') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createSeedChannelMessages = (): Record<string, ChannelMessage[]> => {
  const now = Date.now();
  const root1Id = generateId('chm-root');
  const root2Id = generateId('chm-root');
  const root3Id = generateId('chm-root');

  return {
    'ch-general': [
      {
        id: root1Id,
        channelId: 'ch-general',
        senderId: 'u-002',
        content: 'Welcome everyone to the new workspace chat! Please review the pinned guidelines.',
        createdAt: new Date(now - 86400000 * 5).toISOString(),
        replyCount: 3,
        reactions: { '👍': ['u-001', 'u-003', 'u-004'], '🚀': ['u-001', 'u-005'] },
        mentions: ['u-001'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm-reply'),
        channelId: 'ch-general',
        senderId: 'u-001',
        content: 'Thanks! Glad to be part of the team.',
        createdAt: new Date(now - 86400000 * 5 + 100000).toISOString(),
        threadRootId: root1Id,
        replyCount: 0,
        reactions: { '❤️': ['u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm-reply'),
        channelId: 'ch-general',
        senderId: 'u-003',
        content: 'Excited for what we will build together.',
        createdAt: new Date(now - 86400000 * 5 + 200000).toISOString(),
        threadRootId: root1Id,
        replyCount: 0,
        reactions: {},
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm-reply'),
        channelId: 'ch-general',
        senderId: 'u-004',
        content: 'Indeed! Let me know if anyone needs assistance.',
        createdAt: new Date(now - 86400000 * 5 + 300000).toISOString(),
        threadRootId: root1Id,
        replyCount: 0,
        reactions: { '👍': ['u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-001',
        content: 'Excited to be here! The 3D UI looks super smooth.',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '❤️': ['u-002'], '🔥': ['u-003', 'u-004'] },
        mentions: ['u-002'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-003',
        content: 'Agreed! Let us know if you encounter any layout issues.',
        createdAt: new Date(now - 86400000 * 3).toISOString(),
        replyCount: 0,
        reactions: { '💡': ['u-001'] },
        mentions: ['u-001'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-001',
        content: 'Will do! Working on the new channel features now.',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '👏': ['u-002', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-002',
        content: 'Team lunch on Friday at 1 PM in the main conference room.',
        createdAt: new Date(now - 3600000 * 12).toISOString(),
        replyCount: 0,
        reactions: { '🍔': ['u-001', 'u-003', 'u-004', 'u-005'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-001',
        content: 'Count me in for lunch!',
        createdAt: new Date(now - 3600000 * 10).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-004',
        content: 'Looking forward to catching up with everyone.',
        createdAt: new Date(now - 3600000 * 8).toISOString(),
        replyCount: 0,
        reactions: {},
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-002',
        content: 'Please make sure your timesheets are submitted by end of day Thursday.',
        createdAt: new Date(now - 3600000 * 6).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-001', 'u-003'] },
        mentions: ['u-001'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-003',
        content: 'Reminder about the security audit starting next week.',
        createdAt: new Date(now - 3600000 * 4).toISOString(),
        replyCount: 0,
        reactions: {},
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-general',
        senderId: 'u-001',
        content: 'Thanks for the reminder. All security patches are deployed.',
        createdAt: new Date(now - 3600000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '🎉': ['u-002', 'u-003', 'u-004'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
    ],
    'ch-announcements': [
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-002',
        content: '🚀 TaskFlow 3D v2.0 is now officially live in production! Check out the release notes.',
        createdAt: new Date(now - 86400000 * 10).toISOString(),
        replyCount: 0,
        reactions: { '🎉': ['u-001', 'u-003', 'u-004', 'u-005'], '❤️': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-003',
        content: 'Important security policy update: 2FA is now mandatory for all administrator accounts.',
        createdAt: new Date(now - 86400000 * 7).toISOString(),
        replyCount: 0,
        reactions: { '🔒': ['u-001', 'u-002', 'u-004'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-002',
        content: 'Quarterly town hall meeting scheduled for next Wednesday at 10 AM UTC.',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '📅': ['u-001', 'u-003', 'u-004', 'u-005'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-003',
        content: 'New office guidelines for hybrid work have been published in the documentation portal.',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-002',
        content: 'Please welcome our new senior frontend engineer joining the team next Monday!',
        createdAt: new Date(now - 3600000 * 12).toISOString(),
        replyCount: 0,
        reactions: { '👏': ['u-001', 'u-003', 'u-004', 'u-005'], '🎉': ['u-001', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-003',
        content: 'Reminder to update your emergency contact details in HR system.',
        createdAt: new Date(now - 3600000 * 10).toISOString(),
        replyCount: 0,
        reactions: { 'ℹ️': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-002',
        content: 'All cloud servers will undergo maintenance this Sunday at midnight.',
        createdAt: new Date(now - 3600000 * 8).toISOString(),
        replyCount: 0,
        reactions: { '⚠️': ['u-001', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-003',
        content: 'Check out the new design system guidelines published by @u-003.',
        createdAt: new Date(now - 3600000 * 6).toISOString(),
        replyCount: 0,
        reactions: { '🎨': ['u-001', 'u-002', 'u-004'] },
        mentions: ['u-003'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-002',
        content: 'Donation matching program for this quarter is now open.',
        createdAt: new Date(now - 3600000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '❤️': ['u-001', 'u-003', 'u-005'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-003',
        content: 'Annual feedback survey link has been sent to your emails.',
        createdAt: new Date(now - 3600000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '📝': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-002',
        content: 'Thank you all for an incredible quarter of growth!',
        createdAt: new Date(now - 1800000).toISOString(),
        replyCount: 0,
        reactions: { '🌟': ['u-001', 'u-003', 'u-004', 'u-005'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-announcements',
        senderId: 'u-003',
        content: 'Have a wonderful weekend ahead everyone.',
        createdAt: new Date(now - 600000).toISOString(),
        replyCount: 0,
        reactions: { '🎉': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
    ],
    'ch-frontend': [
      {
        id: root2Id,
        channelId: 'ch-frontend',
        senderId: 'u-001',
        content: 'We should migrate our state persistence to Zustand v5 soon.',
        createdAt: new Date(now - 86400000 * 6).toISOString(),
        replyCount: 2,
        reactions: { '👍': ['u-003', 'u-004'], '🚀': ['u-002'] },
        mentions: ['u-003'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm-reply'),
        channelId: 'ch-frontend',
        senderId: 'u-003',
        content: 'Agreed, Zustand v5 has great TypeScript improvements.',
        createdAt: new Date(now - 86400000 * 6 + 120000).toISOString(),
        threadRootId: root2Id,
        replyCount: 0,
        reactions: { '💯': ['u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm-reply'),
        channelId: 'ch-frontend',
        senderId: 'u-004',
        content: 'Let me check the migration guide first.',
        createdAt: new Date(now - 86400000 * 6 + 240000).toISOString(),
        threadRootId: root2Id,
        replyCount: 0,
        reactions: { '👍': ['u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-003',
        content: 'Tailwind v4 upgrade is also on the roadmap.',
        createdAt: new Date(now - 86400000 * 5).toISOString(),
        replyCount: 0,
        reactions: { '🚀': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-001',
        content: 'Checking accessibility compliance across all modal components with @u-004.',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '♿': ['u-003', 'u-004'] },
        mentions: ['u-004'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-004',
        content: 'Make sure keyboard navigation works correctly with portalled popovers.',
        createdAt: new Date(now - 86400000 * 3).toISOString(),
        replyCount: 0,
        reactions: { '💡': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-001',
        content: 'Tested and verified! Escape key and outside clicks close popovers reliably.',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-004', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-003',
        content: 'React 18 concurrency features are working nicely with our fiber animations.',
        createdAt: new Date(now - 3600000 * 18).toISOString(),
        replyCount: 0,
        reactions: { '✨': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-001',
        content: 'Remember to use logical Tailwind classes (ms-, me-, ps-, pe-) for RTL support.',
        createdAt: new Date(now - 3600000 * 10).toISOString(),
        replyCount: 0,
        reactions: { '💯': ['u-003', 'u-004', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-004',
        content: 'Checking all components for strict RTL compliance now.',
        createdAt: new Date(now - 3600000 * 6).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-003',
        content: 'Great initiative. Let me know if you need code reviews.',
        createdAt: new Date(now - 3600000 * 3).toISOString(),
        replyCount: 0,
        reactions: { '❤️': ['u-004', 'u-001'] },
        mentions: ['u-001'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-frontend',
        senderId: 'u-002',
        content: 'Keep up the fantastic frontend architecture work!',
        createdAt: new Date(now - 1800000).toISOString(),
        replyCount: 0,
        reactions: { '🔥': ['u-001', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
    ],
    'ch-backend': [
      {
        id: root3Id,
        channelId: 'ch-backend',
        senderId: 'u-002',
        content: 'NestJS microservices architecture refactoring is complete.',
        createdAt: new Date(now - 86400000 * 6).toISOString(),
        replyCount: 2,
        reactions: { '🚀': ['u-001', 'u-003', 'u-004'] },
        mentions: ['u-001'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm-reply'),
        channelId: 'ch-backend',
        senderId: 'u-001',
        content: 'Awesome! Service boundaries are much cleaner now.',
        createdAt: new Date(now - 86400000 * 6 + 150000).toISOString(),
        threadRootId: root3Id,
        replyCount: 0,
        reactions: { '👍': ['u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm-reply'),
        channelId: 'ch-backend',
        senderId: 'u-003',
        content: 'Latency tests look great across all endpoints.',
        createdAt: new Date(now - 86400000 * 6 + 300000).toISOString(),
        threadRootId: root3Id,
        replyCount: 0,
        reactions: { '⚡': ['u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-003',
        content: 'PostgreSQL query performance improved by 40% after adding indexes on task filters.',
        createdAt: new Date(now - 86400000 * 5).toISOString(),
        replyCount: 0,
        reactions: { '📈': ['u-002', 'u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-002',
        content: 'Redis caching layer added for session and user profile lookups.',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '⚡': ['u-003', 'u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-001',
        content: 'API rate limiting middleware is working as expected.',
        createdAt: new Date(now - 86400000 * 3).toISOString(),
        replyCount: 0,
        reactions: { '🛡️': ['u-002', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-003',
        content: 'Webhook retry logic added with exponential backoff.',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-002',
        content: 'Database backup scripts tested successfully on staging environment.',
        createdAt: new Date(now - 3600000 * 14).toISOString(),
        replyCount: 0,
        reactions: { '💾': ['u-001', 'u-003', 'u-004'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-001',
        content: 'JWT refresh token rotation is fully secure now with @u-002 help.',
        createdAt: new Date(now - 3600000 * 8).toISOString(),
        replyCount: 0,
        reactions: { '🔐': ['u-002', 'u-003'] },
        mentions: ['u-002'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-003',
        content: 'All unit tests passing with 98% coverage.',
        createdAt: new Date(now - 3600000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '✅': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-002',
        content: 'Fantastic backend engineering standards.',
        createdAt: new Date(now - 1800000).toISOString(),
        replyCount: 0,
        reactions: { '🌟': ['u-001', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-backend',
        senderId: 'u-001',
        content: 'Ready for deployment tomorrow morning.',
        createdAt: new Date(now - 600000).toISOString(),
        replyCount: 0,
        reactions: { '🚀': ['u-002', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
    ],
    'ch-design': [
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-003',
        content: 'Design System v2 Figma library has been updated with new chat components.',
        createdAt: new Date(now - 86400000 * 5).toISOString(),
        replyCount: 0,
        reactions: { '🎨': ['u-001', 'u-002', 'u-004'], '❤️': ['u-001'] },
        mentions: ['u-001'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-001',
        content: 'The flat surface tokens look exceptionally clean in dark mode.',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '✨': ['u-003', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-003',
        content: 'User testing results for the new navigation sidebar are in.',
        createdAt: new Date(now - 86400000 * 3).toISOString(),
        replyCount: 0,
        reactions: { '📊': ['u-001', 'u-004'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-004',
        content: 'Task completion rate increased by 25% with the streamlined layout.',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '🚀': ['u-003', 'u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-003',
        content: 'New iconography guidelines are published in the wiki by @u-004.',
        createdAt: new Date(now - 3600000 * 10).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-001', 'u-002'] },
        mentions: ['u-004'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-001',
        content: 'Colors contrast ratio passes WCAG AAA standards.',
        createdAt: new Date(now - 3600000 * 8).toISOString(),
        replyCount: 0,
        reactions: { '♿': ['u-003', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-003',
        content: 'Spacing tokens have been standardized across all components.',
        createdAt: new Date(now - 3600000 * 6).toISOString(),
        replyCount: 0,
        reactions: { '📐': ['u-001', 'u-004'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-004',
        content: 'Typography scale is looking very harmonious.',
        createdAt: new Date(now - 3600000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '🔤': ['u-003', 'u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-003',
        content: 'Ready for developer handoff.',
        createdAt: new Date(now - 3600000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-001', 'u-002', 'u-004'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-002',
        content: 'Fantastic UI/UX collaboration team.',
        createdAt: new Date(now - 1800000).toISOString(),
        replyCount: 0,
        reactions: { '❤️': ['u-003', 'u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-001',
        content: 'Starting implementation of the new components today.',
        createdAt: new Date(now - 600000).toISOString(),
        replyCount: 0,
        reactions: { '🚀': ['u-003', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-design',
        senderId: 'u-003',
        content: 'Let me know if you need any asset exports.',
        createdAt: new Date(now - 300000).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
    ],
    'ch-random': [
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-001',
        content: 'Coffee or tea? What is everyone fueling up with today?',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '☕': ['u-002', 'u-003', 'u-004'], '🍵': ['u-005'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-002',
        content: 'Strong dark roast espresso all the way!',
        createdAt: new Date(now - 86400000 * 3).toISOString(),
        replyCount: 0,
        reactions: { '🔥': ['u-001', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-003',
        content: 'Green tea for me during afternoon coding sessions.',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '🌿': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-004',
        content: 'Any weekend hiking recommendations near the city, @u-001?',
        createdAt: new Date(now - 3600000 * 15).toISOString(),
        replyCount: 0,
        reactions: { '🏔️': ['u-001', 'u-002'] },
        mentions: ['u-001'],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-001',
        content: 'Pine Valley trail is fantastic this time of year!',
        createdAt: new Date(now - 3600000 * 10).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-004', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-005',
        content: 'Anyone playing the new indie RPG released yesterday?',
        createdAt: new Date(now - 3600000 * 8).toISOString(),
        replyCount: 0,
        reactions: { '🎮': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-002',
        content: 'Yes! The soundtrack is phenomenal.',
        createdAt: new Date(now - 3600000 * 6).toISOString(),
        replyCount: 0,
        reactions: { '🎵': ['u-005', 'u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-003',
        content: 'I am planning to try it out this weekend.',
        createdAt: new Date(now - 3600000 * 4).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-005'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-004',
        content: 'Have fun everyone!',
        createdAt: new Date(now - 3600000 * 2).toISOString(),
        replyCount: 0,
        reactions: { '👋': ['u-001', 'u-002', 'u-003'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-001',
        content: 'Cheers to the weekend!',
        createdAt: new Date(now - 1800000).toISOString(),
        replyCount: 0,
        reactions: { '🥂': ['u-002', 'u-003', 'u-004', 'u-005'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-005',
        content: 'See you all on Monday!',
        createdAt: new Date(now - 600000).toISOString(),
        replyCount: 0,
        reactions: { '👋': ['u-001', 'u-002'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
      {
        id: generateId('chm'),
        channelId: 'ch-random',
        senderId: 'u-002',
        content: 'Goodbye!',
        createdAt: new Date(now - 100000).toISOString(),
        replyCount: 0,
        reactions: { '👍': ['u-001'] },
        mentions: [],
        attachments: [],
        status: 'read',
      },
    ],
  };
};

const loadStorageChannels = (): { channels: Channel[]; channelMessages: Record<string, ChannelMessage[]> } => {
  try {
    const stored = localStorage.getItem(STORAGE_CHANNELS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        channels: parsed.channels || defaultChannels,
        channelMessages: parsed.channelMessages || createSeedChannelMessages(),
      };
    }
  } catch {
    // ignore
  }
  return {
    channels: defaultChannels,
    channelMessages: createSeedChannelMessages(),
  };
};

const saveStorageChannels = (channels: Channel[], channelMessages: Record<string, ChannelMessage[]>) => {
  try {
    localStorage.setItem(STORAGE_CHANNELS, JSON.stringify({ channels, channelMessages }));
  } catch {
    // ignore
  }
};

const loadStorageConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_CONV);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.conversations || [];
    }
  } catch {
    // ignore
  }
  return [];
};

const saveStorageConversations = (conversations: Conversation[], messages: Record<string, ChatMessage[]>) => {
  try {
    localStorage.setItem(STORAGE_CONV, JSON.stringify({ conversations, messages }));
  } catch {
    // ignore
  }
};

export const mockChatService: ChatService = {
  loadChannels: async (): Promise<Channel[]> => {
    await new Promise((r) => setTimeout(r, 200));
    const { channels } = loadStorageChannels();
    return channels;
  },

  getChannel: async (id: string): Promise<Channel | null> => {
    await new Promise((r) => setTimeout(r, 100));
    const { channels } = loadStorageChannels();
    return channels.find((c) => c.id === id) || null;
  },

  createChannel: async (input: CreateChannelInput, creatorId: string, role: Role): Promise<Channel> => {
    await new Promise((r) => setTimeout(r, 200));
    if (!hasPermission(role, 'chat:create_channel')) {
      throw new Error('chat.permissionDenied');
    }

    const trimmed = input.name.trim();
    if (trimmed.length < 2 || trimmed.length > 30 || !/^[a-zA-Z0-9-]+$/.test(trimmed)) {
      throw new Error('chat.channelNameInvalid');
    }

    const slug = trimmed.toLowerCase();
    const { channels, channelMessages } = loadStorageChannels();
    const existing = channels.find((c) => c.slug === slug || c.name.toLowerCase() === slug);
    if (existing) {
      throw new Error('chat.channelNameTaken');
    }

    if (input.isReadOnly && input.kind !== 'announcements') {
      throw new Error('chat.permissionDenied');
    }

    const newChannel: Channel = {
      id: `ch-${generateId('chan')}`,
      name: trimmed,
      slug,
      description: input.description,
      kind: input.kind,
      isReadOnly: input.kind === 'announcements' ? true : input.isReadOnly,
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
    };
    const nextChannels = [...channels, newChannel];
    const nextMessages = { ...channelMessages, [newChannel.id]: [] };
    saveStorageChannels(nextChannels, nextMessages);
    return newChannel;
  },

  loadChannelMessages: async (channelId: string): Promise<ChannelMessage[]> => {
    await new Promise((r) => setTimeout(r, 150));
    const { channelMessages } = loadStorageChannels();
    return channelMessages[channelId] || [];
  },

  sendChannelMessage: async (
    channelId: string,
    senderId: string,
    senderRole: Role,
    content: string,
    attachments: Attachment[] = [],
    mentions: string[] = [],
  ): Promise<ChannelMessage> => {
    await new Promise((r) => setTimeout(r, 250));
    const { channels, channelMessages } = loadStorageChannels();
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) {
      throw new Error('chat.permissionDenied');
    }
    if (channel.kind === 'announcements') {
      if (!hasPermission(senderRole, 'chat:post_in_announcements')) {
        throw new Error('chat.onlyModeratorsCanPost');
      }
    }

    const newMessage: ChannelMessage = {
      id: generateId('chm'),
      channelId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      reactions: {},
      mentions,
      attachments,
      status: 'sending',
    };

    const list = channelMessages[channelId] || [];
    const nextMessages = { ...channelMessages, [channelId]: [...list, newMessage] };
    saveStorageChannels(channels, nextMessages);

    setTimeout(() => {
      try {
        const current = loadStorageChannels();
        const msgs = current.channelMessages[channelId] || [];
        const updated = msgs.map((m) => (m.id === newMessage.id ? { ...m, status: 'sent' as const } : m));
        saveStorageChannels(current.channels, { ...current.channelMessages, [channelId]: updated });
      } catch {
        // ignore
      }
    }, 300);

    return newMessage;
  },

  editChannelMessage: async (
    channelId: string,
    messageId: string,
    senderId: string,
    content: string,
  ): Promise<ChannelMessage> => {
    await new Promise((r) => setTimeout(r, 200));
    const { channels, channelMessages } = loadStorageChannels();
    const list = channelMessages[channelId] || [];
    let updatedMsg: ChannelMessage | null = null;
    const nextList = list.map((m) => {
      if (m.id === messageId) {
        if (m.senderId !== senderId) throw new Error('chat.permissionDenied');
        updatedMsg = { ...m, content, editedAt: new Date().toISOString() };
        return updatedMsg;
      }
      return m;
    });
    if (!updatedMsg) throw new Error('Message not found');
    saveStorageChannels(channels, { ...channelMessages, [channelId]: nextList });
    return updatedMsg;
  },

  deleteChannelMessage: async (
    channelId: string,
    messageId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
    const { channels, channelMessages } = loadStorageChannels();
    const list = channelMessages[channelId] || [];
    const target = list.find((m) => m.id === messageId);
    if (!target) return;
    const isAuthor = target.senderId === requesterId;
    const canDeleteAny = hasPermission(requesterRole, 'chat:delete_any_message');
    if (!isAuthor && !canDeleteAny) {
      throw new Error('chat.permissionDenied');
    }

    const nextList = list.map((m) =>
      m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: '' } : m,
    );
    saveStorageChannels(channels, { ...channelMessages, [channelId]: nextList });
  },

  toggleReaction: async (
    channelId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<ChannelMessage> => {
    await new Promise((r) => setTimeout(r, 150));
    const { channels, channelMessages } = loadStorageChannels();
    const list = channelMessages[channelId] || [];
    let targetMsg: ChannelMessage | null = null;
    const nextList = list.map((m) => {
      if (m.id === messageId) {
        const reactions = { ...m.reactions };
        const users = reactions[emoji] || [];
        if (users.includes(userId)) {
          reactions[emoji] = users.filter((id) => id !== userId);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...users, userId];
        }
        targetMsg = { ...m, reactions };
        return targetMsg;
      }
      return m;
    });
    if (!targetMsg) throw new Error('Message not found');
    saveStorageChannels(channels, { ...channelMessages, [channelId]: nextList });
    return targetMsg;
  },

  sendThreadReply: async (
    channelId: string,
    rootMessageId: string,
    senderId: string,
    senderRole: Role,
    content: string,
    attachments: Attachment[] = [],
    mentions: string[] = [],
  ): Promise<ChannelMessage> => {
    await new Promise((r) => setTimeout(r, 250));
    const { channels, channelMessages } = loadStorageChannels();
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) {
      throw new Error('chat.permissionDenied');
    }
    if (channel.kind === 'announcements') {
      if (!hasPermission(senderRole, 'chat:post_in_announcements')) {
        throw new Error('chat.onlyModeratorsCanPost');
      }
    }

    const list = channelMessages[channelId] || [];
    const reply: ChannelMessage = {
      id: generateId('chm-reply'),
      channelId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
      threadRootId: rootMessageId,
      replyCount: 0,
      reactions: {},
      mentions,
      attachments,
      status: 'sent',
    };

    const nextList = list.map((m) => {
      if (m.id === rootMessageId) {
        return { ...m, replyCount: (m.replyCount || 0) + 1 };
      }
      return m;
    });
    nextList.push(reply);
    saveStorageChannels(channels, { ...channelMessages, [channelId]: nextList });
    return reply;
  },

  startDirectConversation: async (userId: string, otherUserId: string): Promise<Conversation> => {
    await new Promise((r) => setTimeout(r, 150));
    const conversations = loadStorageConversations();
    const existing = conversations.find(
      (c) => c.type === 'direct' && [...c.participantIds].sort().join(',') === [...[userId, otherUserId]].sort().join(','),
    );
    if (existing) return existing;

    const newConv: Conversation = {
      id: `conv-${otherUserId}`,
      type: 'direct',
      participantIds: [userId, otherUserId],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      pinned: false,
      muted: false,
      archived: false,
    };

    const nextConvs = [newConv, ...conversations];
    try {
      const stored = localStorage.getItem(STORAGE_CONV);
      const parsed = stored ? JSON.parse(stored) : { messages: {} };
      saveStorageConversations(nextConvs, parsed.messages || {});
    } catch {
      saveStorageConversations(nextConvs, {});
    }

    return newConv;
  },

  deleteDirectMessage: async (
    conversationId: string,
    messageId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> => {
    await new Promise((r) => setTimeout(r, 150));
    try {
      const stored = localStorage.getItem(STORAGE_CONV);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const conversations = parsed.conversations || [];
      const messages = parsed.messages || {};
      const list = messages[conversationId] || [];
      const msg = list.find((m: ChatMessage) => m.id === messageId);
      if (!msg) return;

      const isAuthor = msg.senderId === requesterId;
      const canDeleteAny = hasPermission(requesterRole, 'chat:delete_any_message');
      if (!isAuthor && !canDeleteAny) {
        throw new Error('chat.permissionDenied');
      }

      const nextList = list.filter((m: ChatMessage) => m.id !== messageId);
      messages[conversationId] = nextList;
      saveStorageConversations(conversations, messages);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'chat.permissionDenied') {
        throw err;
      }
    }
  },
};
