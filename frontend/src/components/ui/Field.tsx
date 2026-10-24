import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input's trailing edge (e.g. a show/hide password button). */
  trailing?: ReactNode;
}

export const inputClass =
  'h-10 w-full rounded-xl border bg-surface-2/60 px-3 text-sm placeholder:text-muted/70 transition focus-visible:border-accent';

/** Labelled input with accessible error wiring (aria-invalid + aria-describedby) and RTL support. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, trailing, className, id, dir, ...rest },
  ref,
) {
  const { i18n } = useTranslation();
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const { children, ...inputProps } = rest;
  const isRtl = i18n.dir() === 'rtl';

  return (
    <div className={cn(className)} dir={dir ?? (isRtl ? 'rtl' : 'ltr')}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, trailing && 'pe-10', error && 'border-danger/70')}
          dir={dir}
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 end-0 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Field.displayName = 'Field';