import React from 'react';
import { AlertCircle } from 'lucide-react';

const inputBaseClass =
  // `w-full bg-zinc-950 border rounded-xl px-4 py-3 text-[14px] text-white
  //placeholder:text-zinc-500 transition-all outline-none`;
  `w-full rounded-2xl border-2 bg-zinc-950 px-5 py-3.5 text-[15px] text-white transition-all duration-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950`;

interface ValidatedInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  ...props
}) => {
  const id = `validatedinput-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = !!error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold tracking-wide text-zinc-200">
          {label}
        </label>
      )}

      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        aria-label={label}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`${inputBaseClass} ${
          hasError
            ? 'border-red-600 focus:border-red-500 focus:ring-red-500/30'
            : 'border-zinc-700 focus:border-blue-400 focus:ring-blue-400/40'
        }`}
        {...props}
      />

      {error && (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-sm text-red-400"
          role="alert"
        >
          <AlertCircle size={15} className="inline" />
          {error}
        </p>
      )}
    </div>
  );
};
