import { useState } from 'react';
import { Download, ExternalLink, FileArchive, FileCode, FileIcon, FileImage, FileText, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useDirectoryStore } from '@/store/directoryStore';
import { useFileStore } from '@/store/fileStore';
import { toast } from '@/store/toastStore';
import { useWorkspaceStore, selectActiveWorkspace } from '@/store/workspaceStore';
import type { FileType, WorkspaceFile } from '@/types';

interface FilePreviewModalProps {
  file: WorkspaceFile | null;
  onClose: () => void;
}

export const FILE_ICONS: Record<FileType, typeof FileText> = {
  document: FileText,
  design: FileIcon,
  image: FileImage,
  archive: FileArchive,
  code: FileCode,
  other: FileIcon,
};

export const FILE_COLORS: Record<FileType, string> = {
  document: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  design: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  image: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  archive: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  code: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  other: 'text-muted bg-surface-2 border-border/20',
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const { t } = useTranslation();
  const deleteFile = useFileStore((s) => s.deleteFile);
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const directory = useDirectoryStore((s) => s.byId);

  if (!file) return null;

  const Icon = FILE_ICONS[file.type] || FileIcon;
  const colorClass = FILE_COLORS[file.type] || FILE_COLORS.other;
  const uploader = directory[file.uploadedBy];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownload = () => {
    toast.success(`${t('files.downloading', 'Downloading')} ${file.name}`);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!activeWorkspace) return;
    await deleteFile(file.id, activeWorkspace.id);
    toast.success(t('files.deleted', 'File removed successfully'));
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.info(t('common.copied', 'Link copied to clipboard'));
  };

  return (
    <Modal open={!!file} onClose={onClose} title={file.name} description={file.folder} className="max-w-xl">
      <div className="space-y-6">
        {/* Preview Card */}
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-surface-2/40 p-8 text-center">
          <div className={`grid size-20 place-items-center rounded-2xl border shadow-lg ${colorClass}`}>
            <Icon className="size-10" />
          </div>
          <p className="mt-4 font-semibold text-lg">{file.name}</p>
          <p className="mt-1 text-xs text-muted">.{file.extension.toUpperCase()} · {formatFileSize(file.size)}</p>
          {file.description && (
            <p className="mt-3 max-w-md text-sm text-muted">{file.description}</p>
          )}
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-4 rounded-xl border bg-surface-2/20 p-4 text-sm">
          <div>
            <span className="block text-xs text-muted mb-1">{t('files.folder', 'Folder')}</span>
            <span className="font-medium">{file.folder}</span>
          </div>
          <div>
            <span className="block text-xs text-muted mb-1">{t('files.project', 'Project')}</span>
            <span className="font-medium">
              {file.projectName ? (
                <Badge tone="accent">{file.projectName}</Badge>
              ) : (
                <span className="text-muted">{t('files.general', 'Workspace General')}</span>
              )}
            </span>
          </div>
          <div>
            <span className="block text-xs text-muted mb-1">{t('files.uploadedBy', 'Uploaded By')}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Avatar name={uploader?.fullName || 'User'} src={uploader?.avatarUrl} size="sm" />
              <span className="font-medium text-xs truncate">{uploader?.fullName || file.uploadedBy}</span>
            </div>
          </div>
          <div>
            <span className="block text-xs text-muted mb-1">{t('files.uploadDate', 'Uploaded Date')}</span>
            <span className="font-medium text-xs">
              {format(parseISO(file.uploadedAt), 'MMM dd, yyyy · HH:mm')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="danger" size="sm" onClick={handleDelete} className="gap-1.5">
            <Trash2 className="size-4" />
            {t('common.delete', 'Delete')}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyLink} className="gap-1.5">
              <ExternalLink className="size-4" />
              {t('common.share', 'Copy Link')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="size-4" />
              {t('files.download', 'Download')}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('files.deleteConfirmTitle', 'Delete File')}
        message={t('files.deleteConfirm', 'Are you sure you want to delete this file?')}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Modal>
  );
}
