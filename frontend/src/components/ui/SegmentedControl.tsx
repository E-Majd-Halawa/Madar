import { cn } from '@/utils/cn';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

/** Radio group styled as a segmented control - keyboard and screen-reader support come from native radios. */
export function SegmentedControl<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex flex-wrap gap-1 rounded-xl border bg-surface-2/60 p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'cursor-pointer rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg',
              'has-[:checked]:bg-accent has-[:checked]:text-accent-fg',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
