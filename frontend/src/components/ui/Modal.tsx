import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible dialog built on the native <dialog> element: it traps focus, closes on Esc,
 * restores focus to the opener and is announced as a modal by screen readers.
 * On phones it docks to the bottom as a sheet.
 */
export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap logic
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const dialog = ref.current;
        if (!dialog) return;

        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [],
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialog.showModal();
      // Focus first focusable element
      const focusableElement = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusableElement?.focus();
      document.addEventListener('keydown', handleKeyDown);
    }
    if (!open && dialog.open) {
      dialog.close();
      // Restore focus to the element that opened the modal
      previousActiveElement.current?.focus();
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className={cn(
        'glass m-0 w-full max-w-lg bg-transparent p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        'mt-auto max-h-[92dvh] rounded-b-none rounded-t-2xl sm:m-auto sm:rounded-2xl',
        className,
      )}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p id="modal-description" className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}