import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Field } from './Field';

/** Password input with a show/hide toggle. LTR so credentials never mirror in Arabic. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<ComponentProps<typeof Field>, 'type' | 'trailing'>>(
  function PasswordField(props, ref) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    return (
      <Field
        ref={ref}
        dir="ltr"
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
            aria-pressed={visible}
            className="grid size-10 place-items-center text-muted hover:text-fg"
          >
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        }
        {...props}
      />
    );
  },
);
