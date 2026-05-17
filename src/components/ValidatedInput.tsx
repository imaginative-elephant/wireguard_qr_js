import React from 'react';

const inputBaseClass = `w-full bg-zinc-950 border rounded-xl px-4 py-3 text-[14px] text-white 
   placeholder:text-zinc-500 transition-all outline-none`;

interface ValidatedInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  fieldName: string;
  markTouched: (field: string) => void;
  validateOnChange?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  error,
  fieldName,
  markTouched,
  validateOnChange = true,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (validateOnChange) {
      markTouched(fieldName);
    }
  };

  const handleBlur = () => {
    markTouched(fieldName);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-zinc-300">{label}</label>}

      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${inputBaseClass} ${
          error ? 'border-red-600 focus:border-red-500' : 'border-zinc-600 focus:border-blue-500'
        }`}
        {...props}
      />

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
