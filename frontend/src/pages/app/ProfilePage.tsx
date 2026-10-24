import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore, selectActiveWorkspace } from '@/store/workspaceStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { toast } from '@/store/toastStore';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, MapPin, Globe, Calendar, Clock, CheckCircle2, TrendingUp, Award, Edit3, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { session } = useAuthStore();
  const user = session?.user;
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState('Senior Product Engineer crafting high-performance productivity tools and 3D web experiences.');
  const [location, setLocation] = useState('San Francisco, CA');
  const [website, setWebsite] = useState('https://taskflow3d.dev');

  const userTasks = tasks.filter((task) => !user || task.assigneeId === user.id || task.creatorId === user?.id);
  const completedTasks = userTasks.filter((task) => task.status === 'completed');
  const completionRate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;
  const userProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    toast.success('Profile updated', { actionLabel: 'Saved' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header / Cover banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-surface border border-border p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 end-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-48 h-48" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <Avatar src={user?.avatarUrl} name={user?.fullName || 'User'} className="w-24 h-24 sm:w-32 sm:h-32 text-2xl shadow-xl ring-4 ring-surface" />
            <div className="absolute bottom-1 end-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center text-xs text-white font-bold" title="Online">
              ✓
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">{user?.fullName || 'Demo User'}</h1>
              <Badge tone="accent" className="capitalize">{user?.role || 'user'}</Badge>
              {user?.id === 'u-001' && <Badge tone="warning">Demo Account</Badge>}
            </div>
            <p className="text-sm text-text-muted">@{user?.username || 'user'} · Joined October 2024</p>
            <p className="text-sm text-text max-w-xl">{bio}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user?.email || 'user@taskflow3d.dev'}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {location}</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {website}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Timezone: UTC-7</span>
            </div>
          </div>
          <div>
            {!isEditing ? (
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit Profile
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex items-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Modal/Card if editing */}
      {isEditing && (
        <Card className="p-6 border-primary/50 shadow-lg">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Edit Profile Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
              <Field label="Username">
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
              <Field label="Location">
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
              <Field label="Website">
                <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
            </div>
            <Field label="Bio">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" variant="primary" className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Productivity Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{completedTasks.length}</p>
            <p className="text-xs text-text-muted">Tasks Completed</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{completionRate}%</p>
            <p className="text-xs text-text-muted">Completion Rate</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">18.5 hrs</p>
            <p className="text-xs text-text-muted">Focus Time</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">7 day</p>
            <p className="text-xs text-text-muted">Productivity Streak</p>
          </div>
        </Card>
      </div>

      {/* Workspaces & Projects breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">Workspaces ({workspaces.length})</h3>
          <div className="space-y-3">
            {workspaces.map((ws) => (
              <div key={ws.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {ws.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{ws.name}</p>
                    <p className="text-xs text-text-muted capitalize">{ws.ownerId === user?.id ? 'Owner' : 'Member'} · {ws.type}</p>
                  </div>
                </div>
                {ws.id === activeWorkspace?.id && <Badge tone="accent">Active</Badge>}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">Active Projects ({userProjects.length})</h3>
          <div className="space-y-3">
            {userProjects.slice(0, 3).map((proj) => (
              <div key={proj.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color || '#3b82f6' }} />
                  <div>
                    <p className="text-sm font-medium text-text">{proj.name}</p>
                    <p className="text-xs text-text-muted capitalize">Status: {proj.status}</p>
                  </div>
                </div>
                <span className="text-xs text-text-muted">{proj.memberIds.length} members</span>
              </div>
            ))}
            {userProjects.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">No projects in this workspace.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
