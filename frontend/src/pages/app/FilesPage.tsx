import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Download,
  Eye,
  FileIcon,
  Filter,
  Folder,
  FolderOpen,
  HardDrive,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { inputClass } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  FILE_COLORS,
  FILE_ICONS,
  FilePreviewModal,
  formatFileSize,
} from '@/features/files/FilePreviewModal';
import { FileUploadModal } from '@/features/files/FileUploadModal';
import { useDirectoryStore } from '@/store/directoryStore';
import { useFileStore } from '@/store/fileStore';
import { useProjectStore } from '@/store/projectStore';
import { toast } from '@/store/toastStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import type { FileType, WorkspaceFile } from '@/types';
import { cn } from '@/utils/cn';

type ViewMode = 'grid' | 'table';

export default function FilesPage() {
  const { t } = useTranslation();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const directory = useDirectoryStore((s) => s.byId);
  const loadDirectory = useDirectoryStore((s) => s.load);
  const projects = useProjectStore((s) => s.projects);

  const {
    files,
    storageUsage,
    loading,
    activeFolder,
    selectedType,
    selectedProject,
    searchQuery,
    previewFile,
    isUploadOpen,
    load,
    deleteFile,
    setActiveFolder,
    setSelectedType,
    setSelectedProject,
    setSearchQuery,
    setPreviewFile,
    setIsUploadOpen,
  } = useFileStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    void loadDirectory();
    if (activeWorkspace) {
      void load(activeWorkspace.id);
    }
  }, [activeWorkspace, load, loadDirectory]);

  // Re-filter whenever filter parameters change
  useEffect(() => {
    if (activeWorkspace) {
      void load(activeWorkspace.id);
    }
  }, [activeWorkspace, activeFolder, selectedType, selectedProject, searchQuery, load]);

  // Aggregate available folders and their counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    files.forEach((f) => {
      counts.all = (counts.all || 0) + 1;
      counts[f.folder] = (counts[f.folder] || 0) + 1;
    });
    return counts;
  }, [files]);

  const knownFolders = [
    'all',
    'Design Assets',
    'Specifications',
    'Source Code',
    'Deliverables',
    'Contracts & Legal',
  ];

  // Storage percentage calculation
  const quotaPercent = storageUsage
    ? Math.min(100, (storageUsage.usedBytes / storageUsage.quotaBytes) * 100)
    : 0;

  const [fileToDelete, setFileToDelete] = useState<WorkspaceFile | null>(null);

  const handleDelete = (file: WorkspaceFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setFileToDelete(file);
  };

  const confirmDelete = async () => {
    if (!fileToDelete || !activeWorkspace) return;
    await deleteFile(fileToDelete.id, activeWorkspace.id);
    toast.success(t('workspace.files.deleted', 'File removed successfully'));
    setFileToDelete(null);
  };

  const handleDownload = (file: WorkspaceFile, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`${t('workspace.files.download', 'Downloading')} ${file.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('workspace.files.title', 'Files & Documentation')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('workspace.files.subtitle', 'Upload and access project specifications, mockups, and assets.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsUploadOpen(true)}
            className="gap-2"
          >
            <Plus className="size-4" />
            {t('workspace.files.upload', 'Upload File')}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left sidebar (Folders + Storage) & Right content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left column: Storage Quota & Folder Tree */}
        <div className="space-y-6 lg:col-span-1">
          {/* Storage Quota Card */}
          <div className="glass rounded-2xl p-5 border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <HardDrive className="size-4 text-accent" />
                {t('workspace.files.storageUsage', 'Storage Usage')}
              </span>
              <span className="text-xs font-mono text-muted">
                <bdi>{quotaPercent.toFixed(1)}%</bdi>
              </span>
            </div>

            <ProgressBar value={quotaPercent} label={t('workspace.files.storageUsage', 'Storage Usage')} tone={quotaPercent > 90 ? 'danger' : 'accent'} />

            <div className="flex justify-between text-xs text-muted">
              <span><bdi>{formatFileSize(storageUsage?.usedBytes || 0)}</bdi> {t('workspace.files.used', 'used')}</span>
              <span><bdi>{formatFileSize(storageUsage?.quotaBytes || 10 * 1024 * 1024 * 1024)}</bdi> {t('workspace.files.limit', 'limit')}</span>
            </div>

            {/* Storage By Type Breakdown */}
            {storageUsage && (
              <div className="pt-2 border-t border-border/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full bg-purple-400" />
                    {t('workspace.files.fileTypes.design', 'Design')}
                  </span>
                  <span className="font-mono text-fg"><bdi>{formatFileSize(storageUsage.byType.design)}</bdi></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full bg-blue-400" />
                    {t('workspace.files.fileTypes.document', 'Documents')}
                  </span>
                  <span className="font-mono text-fg"><bdi>{formatFileSize(storageUsage.byType.document)}</bdi></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full bg-cyan-400" />
                    {t('workspace.files.fileTypes.code', 'Code/Data')}
                  </span>
                  <span className="font-mono text-fg"><bdi>{formatFileSize(storageUsage.byType.code)}</bdi></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    {t('workspace.files.fileTypes.image', 'Images')}
                  </span>
                  <span className="font-mono text-fg"><bdi>{formatFileSize(storageUsage.byType.image)}</bdi></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full bg-amber-400" />
                    {t('workspace.files.fileTypes.other', 'Other')}
                  </span>
                  <span className="font-mono text-fg"><bdi>{formatFileSize(storageUsage.byType.archive || 0)}</bdi></span>
                </div>
              </div>
            )}
          </div>

          {/* Folder Navigation */}
          <div className="glass rounded-2xl p-4 border shadow-sm space-y-1">
            <span className="block px-3 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
              {t('workspace.files.foldersTitle', 'Folders')}
            </span>

            {knownFolders.map((folderKey) => {
              const active = activeFolder === folderKey;
              const count = folderCounts[folderKey] || 0;
              const label =
                folderKey === 'all'
                  ? t('workspace.files.folders.all', 'All Folders')
                  : t(`workspace.files.folders.${folderKey}`, folderKey);

              return (
                <button
                  key={folderKey}
                  type="button"
                  onClick={() => setActiveFolder(folderKey)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                    active
                      ? 'bg-accent/15 font-semibold text-accent shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)]'
                      : 'text-muted hover:bg-surface-2 hover:text-fg',
                  )}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {active ? (
                      <FolderOpen className="size-4 shrink-0 text-accent" />
                    ) : (
                      <Folder className="size-4 shrink-0" />
                    )}
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="text-xs font-mono text-muted/70"><bdi>{count}</bdi></span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Toolbar, View switch, and File list/grid */}
        <div className="space-y-4 lg:col-span-3">
          {/* Filter Bar */}
          <div className="glass flex flex-col gap-3 rounded-2xl p-4 border shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('workspace.files.searchPlaceholder', 'Search files, specifications, extensions…')}
                className={cn(inputClass, 'ps-9 py-1.5 text-sm')}
              />
            </div>

            {/* Project dropdown filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className={cn(inputClass, 'py-1.5 text-xs w-36 sm:w-44')}
              >
                <option value="all">{t('calendar.filter.allProjects', 'All Projects')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* View mode toggle */}
              <div className="flex items-center rounded-xl border bg-surface-2/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'grid size-8 place-items-center rounded-lg text-muted transition',
                    viewMode === 'grid' && 'bg-surface text-accent shadow-sm',
                  )}
                  aria-label={t('workspace.files.gridView', 'Grid view')}
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'grid size-8 place-items-center rounded-lg text-muted transition',
                    viewMode === 'table' && 'bg-surface text-accent shadow-sm',
                  )}
                  aria-label={t('workspace.files.listView', 'List view')}
                >
                  <ListIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'all', label: t('common.all', 'All') },
                { key: 'document', label: t('workspace.files.fileTypes.document', 'Documents') },
                { key: 'design', label: t('workspace.files.fileTypes.design', 'Design') },
                { key: 'code', label: t('workspace.files.fileTypes.code', 'Code & Data') },
                { key: 'image', label: t('workspace.files.fileTypes.image', 'Images') },
                { key: 'archive', label: t('workspace.files.fileTypes.other', 'Archives') },
              ] as const
            ).map(({ key, label }) => {
              const active = selectedType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition',
                    active
                      ? 'bg-accent text-accent-fg font-semibold shadow-sm'
                      : 'border border-border/15 bg-surface-2/40 text-muted hover:border-border/30 hover:text-fg',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Files Container */}
          {files.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border">
              <EmptyState
                icon={FileIcon}
                title={t('workspace.files.empty', 'No files found')}
                description={
                  searchQuery
                    ? t('search.noResults', 'No assets match your search and filter criteria.')
                    : t('workspace.files.emptyBody', 'Upload files and documents to share them with your workspace team.')
                }
                action={
                  <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)} className="gap-2 mt-2">
                    <Upload className="size-4" />
                    {t('workspace.files.upload', 'Upload File')}
                  </Button>
                }
              />
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => {
                const Icon = FILE_ICONS[file.type] || FileIcon;
                const colorClass = FILE_COLORS[file.type] || FILE_COLORS.other;
                const uploader = directory[file.uploadedBy];

                return (
                  <motion.div
                    key={file.id}
                    layout
                    onClick={() => setPreviewFile(file)}
                    className="glass group relative flex flex-col justify-between rounded-2xl border p-4.5 transition hover:border-accent/40 hover:shadow-depth cursor-pointer"
                  >
                    <div>
                      {/* Top row: Type Icon and Project Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className={`grid size-11 place-items-center rounded-xl border shadow-sm ${colorClass}`}>
                          <Icon className="size-5.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {file.projectName && (
                            <Badge tone="neutral" className="truncate max-w-[140px] text-[10px]">
                              {file.projectName}
                            </Badge>
                          )}
                          <span className="rounded-md border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono uppercase text-muted">
                            {file.extension}
                          </span>
                        </div>
                      </div>

                      {/* File Name & Folder */}
                      <p className="mt-3.5 font-semibold text-sm line-clamp-1 group-hover:text-accent transition">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted/80">{file.folder}</p>
                    </div>

                    {/* Footer: Size, Uploader, Actions */}
                    <div className="mt-5 flex items-center justify-between border-t border-border/10 pt-3 text-xs text-muted">
                      <div className="flex items-center gap-2">
                        <Avatar name={uploader?.fullName || 'User'} src={uploader?.avatarUrl} size="sm" />
                        <span className="font-mono"><bdi>{formatFileSize(file.size)}</bdi></span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={(e) => handleDownload(file, e)}
                          title={t('workspace.files.download', 'Download')}
                          className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                        >
                          <Download className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(file, e)}
                          title={t('common.delete', 'Delete')}
                          className="grid size-7 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="glass overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="border-b bg-surface-2/40 text-xs text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{t('workspace.files.fileName', 'Name')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('workspace.files.foldersTitle', 'Folder')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('workspace.files.project', 'Project')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('workspace.files.size', 'Size')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('workspace.files.uploader', 'Uploaded By')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('workspace.files.date', 'Date')}</th>
                      <th className="px-4 py-3 text-end font-medium">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {files.map((file) => {
                      const Icon = FILE_ICONS[file.type] || FileIcon;
                      const uploader = directory[file.uploadedBy];

                      return (
                        <tr
                          key={file.id}
                          onClick={() => setPreviewFile(file)}
                          className="hover:bg-surface-2/40 cursor-pointer transition"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon className="size-4 shrink-0 text-accent" />
                              <span className="font-medium text-fg truncate max-w-xs">{file.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{file.folder}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {file.projectName ? (
                              <Badge tone="neutral" className="text-[10px]">{file.projectName}</Badge>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-muted whitespace-nowrap">
                            <bdi>{formatFileSize(file.size)}</bdi>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Avatar name={uploader?.fullName || 'User'} src={uploader?.avatarUrl} size="sm" />
                              <span className="text-xs text-muted truncate">{uploader?.fullName || file.uploadedBy}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            <bdi>{format(parseISO(file.uploadedAt), 'MMM dd, yyyy')}</bdi>
                          </td>
                          <td className="px-4 py-3 text-end whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                title={t('workspace.files.preview', 'Preview')}
                                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                              >
                                <Eye className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDownload(file, e)}
                                title={t('workspace.files.download', 'Download')}
                                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                              >
                                <Download className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(file, e)}
                                title={t('common.delete', 'Delete')}
                                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-400"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <FileUploadModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultFolder={activeFolder !== 'all' ? activeFolder : undefined}
      />

      <ConfirmDialog
        open={!!fileToDelete}
        title={t('workspace.files.deleteConfirmTitle', 'Delete File')}
        message={t('workspace.files.deleteConfirm', 'Are you sure you want to delete this file?')}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
}
