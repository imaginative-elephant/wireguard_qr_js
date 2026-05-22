import React from 'react';

const inputBaseClass = `w-full bg-zinc-950 border rounded-xl px-4 py-3 text-[14px] text-white 
   placeholder:text-zinc-500 transition-all outline-none`;

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
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
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputBaseClass} ${
          error ? 'border-red-600 focus:border-red-500' : 'border-zinc-600 focus:border-blue-500'
        }`}
        {...props}
      />

      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
