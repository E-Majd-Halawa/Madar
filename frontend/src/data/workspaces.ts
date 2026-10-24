import type { Workspace } from '@/types';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `u-${String(from + i).padStart(3, '0')}`);

export const SEED_WORKSPACES: Workspace[] = [
  {
    id: 'ws-personal-u-001',
    name: 'Personal Workspace',
    description: 'Your private space for personal tasks and goals.',
    type: 'personal',
    ownerId: 'u-001',
    memberIds: ['u-001'],
    color: '#10b981',
    createdAt: '2026-03-12T08:00:00Z',
  },
  {
    id: 'ws-demo',
    name: 'Demo Workspace',
    description: 'A sample team workspace with projects, tasks and conversations.',
    type: 'team',
    ownerId: 'u-002',
    memberIds: [...range(1, 3), ...range(4, 14)],
    color: '#22d3ee',
    createdAt: '2026-01-20T10:30:00Z',
  },
  {
    id: 'ws-nova',
    name: 'Nova Labs',
    description: 'Product engineering team building the Nova platform.',
    type: 'team',
    ownerId: 'u-002',
    memberIds: [...range(1, 3), ...range(8, 20)],
    color: '#a78bfa',
    createdAt: '2026-02-04T09:15:00Z',
  },
  {
    id: 'ws-design',
    name: 'Design Guild',
    description: 'Designers sharing systems, critiques and research.',
    type: 'team',
    ownerId: 'u-009',
    memberIds: range(10, 22),
    color: '#f59e0b',
    createdAt: '2026-04-18T14:00:00Z',
  },
  {
    id: 'ws-oss',
    name: 'Open Source Crew',
    description: 'Volunteer maintainers shipping community tooling.',
    type: 'team',
    ownerId: 'u-003',
    memberIds: [...range(15, 30), 'u-003'],
    color: '#3b82f6',
    createdAt: '2026-05-02T16:45:00Z',
  },
];
