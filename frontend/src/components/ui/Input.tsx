import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  forwardRef,
  isValidElement,
  useId,
} from 'react';
import { ChevronDown } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const labelClasses = 'block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5';
const helperClasses = 'mt-1.5 text-sm text-surface-500 dark:text-surface-400';
const errorClasses =
  'mt-1.5 text-sm text-danger-600 dark:text-danger-400 flex items-center gap-1';

const fieldBase =
  'w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-surface-900 ' +
  'text-surface-900 dark:text-surface-100 ' +
  'placeholder:text-surface-400 dark:placeholder:text-surface-500 ' +
  'transition-colors duration-200 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ' +
  'disabled:bg-surface-50 dark:disabled:bg-surface-800 ' +
  'disabled:text-surface-500 dark:disabled:text-surface-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-70';

const fieldOk =
  'border-surface-300 dark:border-surface-700 ' +
  'hover:border-surface-400 dark:hover:border-surface-500 ' +
  'focus-visible:border-brand-500 focus-visible:ring-brand-500/25 ' +
  'dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/30 ' +
  'disabled:hover:border-surface-300 dark:disabled:hover:border-surface-700';

const fieldError =
  'border-danger-500 dark:border-danger-400 ' +
  'focus-visible:border-danger-500 focus-visible:ring-danger-500/25 ' +
  'dark:focus-visible:border-danger-400 dark:focus-visible:ring-danger-400/30';

const ErrorIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

// Un icono a la derecha puede ser interactivo (p. ej. el botón del ojo para
// mostrar/ocultar contraseña). Si es un <button>, se re-habilita el pointer
// events que el contenedor desactiva para no bloquear el clic del input.
const esIconoInteractivo = (node: React.ReactNode): boolean =>
  isValidElement(node) &&
  (node.type === 'button' || (node.type as { displayName?: string })?.displayName === 'IconButton');

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, disabled, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`${fieldBase} ${error ? fieldError : fieldOk} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
              {esIconoInteractivo(rightIcon) ? (
                <span className="pointer-events-auto">{rightIcon}</span>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className={errorClasses} role="alert">
            <ErrorIcon />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'label' | 'error' | 'helperText'> & {
    label?: string;
    error?: string;
    helperText?: string;
  }
>(({ label, error, helperText, className = '', id, disabled, ...props }, ref) => {
  const autoId = useId();
  const inputId = id || autoId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        disabled={disabled}
        className={`${fieldBase} py-3 resize-y min-h-[100px] ${error ? fieldError : fieldOk} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className={errorClasses} role="alert">
          <ErrorIcon />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className={helperClasses}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, leftIcon, className = '', id, disabled, ...props }, ref) => {
    const autoId = useId();
    const selectId = id || autoId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className={labelClasses}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`${fieldBase} appearance-none pr-10 ${leftIcon ? 'pl-10' : ''} ${error ? fieldError : fieldOk} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        {error && (
          <p id={errorId} className={errorClasses} role="alert">
            <ErrorIcon />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Switch } from './Switch';
