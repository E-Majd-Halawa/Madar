import { useEffect, useState } from 'react';
import { ArrowLeft, FolderX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ProjectDetailWorkspace } from '@/features/projects/ProjectDetailWorkspace';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { projectService } from '@/services/projectService';
import { useProjectStore } from '@/store/projectStore';
import type { Project } from '@/types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const storeProjects = useProjectStore((s) => s.projects);
  const storeStatus = useProjectStore((s) => s.status);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const found = storeProjects.find((p) => p.id === id);
    if (found) {
      setProject(found);
      setLoading(false);
      return;
    }

    // Fallback: try fetching directly from projectService
    let active = true;
    void projectService.getById(id).then((res) => {
      if (!active) return;
      setProject(res);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, storeProjects]);

  if (loading && storeStatus === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FolderX className="size-12 text-muted/60 mb-3" />
        <h2 className="text-lg font-bold text-fg">{t('projects.empty')}</h2>
        <p className="text-xs text-muted mt-1 max-w-sm">
          The project you are looking for does not exist or may have been deleted.
        </p>
        <ButtonLink to="/app/projects" variant="primary" size="sm" className="mt-4">
          <ArrowLeft className="size-3.5 me-1.5 rtl:rotate-180" />
          <span>{t('projects.workspace.back')}</span>
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <ProjectDetailWorkspace project={project} />
      <ProjectModal />
    </>
  );
}
