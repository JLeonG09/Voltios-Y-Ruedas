import { HTMLAttributes, forwardRef, ChangeEvent } from 'react';

interface SwitchProps extends Omit<HTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked = false, onChange, disabled = false, className = '', ...props }, ref) => {
    return (
      <label className={`inline-flex items-center cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <span className={`inline-block h-5 w-5 rounded-full transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          } bg-white shadow-md`} />
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';