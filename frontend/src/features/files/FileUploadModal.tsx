import { UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuthStore, selectUser } from '@/store/authStore';
import { HttpError } from '@/api/adapters/http/httpClient';
import { useFileStore } from '@/store/fileStore';
import { useProjectStore } from '@/store/projectStore';
import { toast } from '@/store/toastStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import type { FileType } from '@/types';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  defaultFolder?: string;
}

const DEFAULT_FOLDERS = [
  'Design Assets',
  'Specifications',
  'Source Code',
  'Deliverables',
  'Contracts & Legal',
];

export function FileUploadModal({ open, onClose, defaultFolder }: FileUploadModalProps) {
  const { t } = useTranslation();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const user = useAuthStore(selectUser);
  const projects = useProjectStore((s) => s.projects);
  const uploadFile = useFileStore((s) => s.uploadFile);

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [name, setName] = useState('');
  const [folder, setFolder] = useState(defaultFolder && defaultFolder !== 'all' ? defaultFolder : 'Design Assets');
  const [customFolder, setCustomFolder] = useState('');
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [projectId, setProjectId] = useState<string>('none');
  const [type, setType] = useState<FileType>('document');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('files.nameRequired', 'File name is required'));
      return;
    }
    if (!file) {
      toast.error(t('files.fileRequired', 'A file is required'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('files.errors.fileTooLarge', 'File size exceeds 5MB'));
      return;
    }
    const blockedExt = ['.html', '.htm', '.svg', '.js', '.mjs', '.cjs', '.exe', '.bat', '.cmd', '.sh'];
    const ext = file.name.includes('.') ? file.name.split('.').pop() || 'txt' : 'txt';
    if (
      blockedExt.includes(`.${ext.toLowerCase()}`) ||
      ['text/html', 'image/svg+xml', 'application/javascript', 'text/javascript', 'application/x-msdownload'].includes(
        file.type,
      )
    ) {
      toast.error(t('files.errors.blockedType', 'This file type is blocked'));
      return;
    }

    if (!activeWorkspace || !user) return;

    setSubmitting(true);
    setProgress(0);
    try {
      const selectedProject = projects.find((p) => p.id === projectId);
      const targetFolder = isCustomFolder && customFolder.trim() ? customFolder.trim() : folder;

      await uploadFile(
        {
          workspaceId: activeWorkspace.id,
          name: name.trim() || file.name,
          folder: targetFolder,
          projectId: projectId === 'none' ? null : projectId,
          projectName: selectedProject?.name,
          type,
          extension: ext.toLowerCase(),
          size: file.size,
          uploadedBy: user.id,
          description: description.trim() || undefined,
          file,
        } as any,
        activeWorkspace.id,
        setProgress,
      );

      toast.success(t('files.uploadSuccess', 'File uploaded successfully'));
      setFile(null);
      setProgress(0);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      const key = err instanceof HttpError ? err.message : 'files.errors.uploadFailed';
      toast.error(t(key, t('files.errors.uploadFailed', 'File upload failed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('files.uploadModalTitle', 'Upload New Asset')} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone mock */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/40 bg-surface-2/30 p-6 text-center hover:border-accent/40 transition">
          <UploadCloud className="size-10 text-accent mb-2" />
          <p className="text-sm font-medium">{t('files.dropzoneTitle', 'Drag and drop files here, or click to browse')}</p>
          <p className="mt-1 text-xs text-muted">Supports all major formats (PDF, Figma, Images, Zip, Code) up to 5MB</p>
          <input
            type="file"
            className="mt-3 text-xs"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              if (selected && !name.trim()) {
                setName(selected.name);
              }
            }}
          />
          {file && (
            <p className="mt-2 text-xs text-muted">
              {file.name} ({file.size} bytes)
            </p>
          )}
          {submitting && progress > 0 && (
            <div className="mt-3 w-full">
              <ProgressBar value={progress} label={t('files.uploadProgress', 'Upload progress')} />
            </div>
          )}
        </div>

        <Field label={t('files.fileName', 'File Name')} required>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Design_System_Guidelines.pdf"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('files.folder', 'Folder')}>
            {!isCustomFolder ? (
              <select
                value={folder}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setIsCustomFolder(true);
                  } else {
                    setFolder(e.target.value);
                  }
                }}
                className={inputClass}
              >
                {DEFAULT_FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="__new__">+ {t('files.newFolder', 'New Folder…')}</option>
              </select>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                  placeholder="Folder name"
                  className={inputClass}
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => setIsCustomFolder(false)}>
                  ✕
                </Button>
              </div>
            )}
          </Field>

          <Field label={t('files.fileType', 'File Type')}>
            <select value={type} onChange={(e) => setType(e.target.value as FileType)} className={inputClass}>
              <option value="document">{t('files.typeDocument', 'Document')}</option>
              <option value="design">{t('files.typeDesign', 'Design Asset')}</option>
              <option value="image">{t('files.typeImage', 'Image')}</option>
              <option value="code">{t('files.typeCode', 'Code / Data')}</option>
              <option value="archive">{t('files.typeArchive', 'Archive / Zip')}</option>
              <option value="other">{t('files.typeOther', 'Other')}</option>
            </select>
          </Field>
        </div>

        <Field label={t('files.associatedProject', 'Associated Project (Optional)')}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
            <option value="none">{t('files.noProject', 'General (No specific project)')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('files.description', 'Description (Optional)')}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t('files.descriptionPlaceholder', 'Brief note about this asset…')}
            className={inputClass}
          />
        </Field>

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? t('common.uploading', 'Uploading…') : t('files.upload', 'Upload File')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
