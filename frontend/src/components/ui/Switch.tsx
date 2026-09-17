import { HTMLAttributes, forwardRef, ChangeEvent } from 'react';

interface SwitchProps extends Omit<HTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked = false, onChange, disabled = false, className = '', ...props }, ref) => {
    return (
      <label
        className={
          `inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`
        }
      >
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-checked={checked}
          {...props}
        />
        <div
          className={
            `relative w-11 h-6 rounded-full transition-colors duration-200 ` +
            `peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ` +
            `peer-focus-visible:ring-offset-[var(--color-bg)] peer-focus-visible:ring-brand-500 ` +
            `dark:peer-focus-visible:ring-brand-400 ` +
            (checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-surface-300 dark:bg-surface-600')
          }
        >
          <span
            className={
              `absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-md ` +
              `transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`
            }
            aria-hidden="true"
          />
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';
