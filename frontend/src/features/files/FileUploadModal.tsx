import { UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore, selectUser } from '@/store/authStore';
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
    if (!activeWorkspace || !user) return;

    setSubmitting(true);
    try {
      const selectedProject = projects.find((p) => p.id === projectId);
      const targetFolder = isCustomFolder && customFolder.trim() ? customFolder.trim() : folder;
      const ext = name.includes('.') ? name.split('.').pop() || 'dat' : 'txt';

      // Random realistic size between 500KB and 25MB
      const randomSize = Math.floor(Math.random() * 24_500_000) + 500_000;

      await uploadFile(
        {
          workspaceId: activeWorkspace.id,
          name: name.trim(),
          folder: targetFolder,
          projectId: projectId === 'none' ? null : projectId,
          projectName: selectedProject?.name,
          type,
          extension: ext.toLowerCase(),
          size: randomSize,
          uploadedBy: user.id,
          description: description.trim() || undefined,
        },
        activeWorkspace.id,
      );

      toast.success(t('files.uploadSuccess', 'File uploaded successfully'));
      setName('');
      setDescription('');
      onClose();
    } catch {
      toast.error(t('common.error', 'Something went wrong'));
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
          <p className="mt-1 text-xs text-muted">Supports all major formats (PDF, Figma, Images, Zip, Code) up to 100MB</p>
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
