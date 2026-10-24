import type { ProjectService } from '@/api/contracts';
import { SEED_PROJECTS } from '@/data/projects';
import type { Project } from '@/types';
import { createCollection, newId } from './collection';
import { delay } from './delay';

const table = createCollection<Project>('mock.projects', SEED_PROJECTS);

export const mockProjectService: ProjectService = {
  async listByWorkspace(workspaceId) {
    await delay(200);
    return table.read().filter((p) => p.workspaceId === workspaceId);
  },
  async getById(id) {
    await delay(60);
    return table.read().find((p) => p.id === id) ?? null;
  },
  async create(input) {
    await delay(150);
    const project: Project = { ...input, id: newId('p'), createdAt: new Date().toISOString() };
    table.write([project, ...table.read()]);
    return project;
  },
  async update(id, patch) {
    await delay(100);
    const items = table.read();
    const current = items.find((p) => p.id === id);
    if (!current) throw new Error('Project not found');
    const next = { ...current, ...patch };
    table.write(items.map((p) => (p.id === id ? next : p)));
    return next;
  },
  async remove(id) {
    await delay(100);
    table.write(table.read().filter((p) => p.id !== id));
  },
};
