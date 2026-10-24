export type Role = 'user' | 'moderator' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'suspended' | 'invited';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** epoch ms */
  expiresAt: number;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  /** true only when entered through "Explore Demo" */
  isDemo: boolean;
}

export type WorkspaceType = 'personal' | 'team';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  ownerId: string;
  memberIds: string[];
  color: string;
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ThemeName = 'midnight' | 'obsidian' | 'emerald' | 'ocean' | 'aurora' | 'light';
export type ThemeChoice = ThemeName | 'system';
export type AnimationLevel = 'off' | 'low' | 'medium' | 'high';
export type Language = 'en' | 'ar';
export type DirectionChoice = 'auto' | 'ltr' | 'rtl';

export * from './tasks';
export * from './projects';
export * from './activity';
export * from './preferences';
export * from './notifications';
export * from './files';
export * from './members';
export * from './chat';
