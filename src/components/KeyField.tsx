import { useState } from 'react';
import { Copy, Eye, EyeOff, AlertCircle, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface KeyFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onGenerate?: () => void;
  placeholder?: string;
  isSensitive?: boolean;
  defaultHidden?: boolean;
  readonly?: boolean;
  generateButtonText?: string;
  showGenerateButton?: boolean;
  error?: string;
  disabled?: boolean | undefined;
  clearClipboardAfterCopy: boolean;
}

export function KeyField({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  onGenerate,
  placeholder = 'Enter key...',
  isSensitive = false,
  defaultHidden = false,
  readonly = false,
  generateButtonText = 'Generate',
  showGenerateButton = true,
  error = '',
  disabled = false,
  clearClipboardAfterCopy,
}: KeyFieldProps) {
  const [showKey, setShowKey] = useState(!defaultHidden && !isSensitive);
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const id = `keyfield-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const copyToClipboard = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      if (isSensitive && clearClipboardAfterCopy) {
        toast.success(`${label} copied! (will clear in 15s)`);
        setTimeout(async () => {
          await navigator.clipboard.writeText('');
          toast('Clipboard cleared for security', { icon: '🛡️' });
        }, 15000);
      } else {
        toast.success(`${label} copied!`);
      }

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const hasError = !!error;
  const isEmpty = !value.trim();

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-semibold tracking-wide text-zinc-200"
        >
          {label}
        </label>

        <div className="flex items-center gap-3">
          {isSensitive && (
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
              aria-label={showKey ? `Hide ${label}` : `Show ${label}`}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showKey ? 'Hide' : 'Show'}</span>
            </button>
          )}

          {onGenerate && showGenerateButton && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={disabled} // disable the button and the field while generating the key
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:opacity-60"
            >
              <Key size={14} />
              {generateButtonText}
            </button>
          )}
        </div>
      </div>

      {/* Input Container */}
      <div className="relative">
        <input
          id={id}
          type={isSensitive && !showKey ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          readOnly={readonly}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          aria-label={label}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`w-full rounded-xl border-2 bg-zinc-950 px-4 py-3 pr-12 font-mono text-[14px] text-white transition-all placeholder:text-zinc-500 focus:outline-none ${
            disabled
              ? 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-400'
              : hasError
                ? 'border-red-600 focus:border-red-500'
                : isEmpty
                  ? 'border-zinc-700 focus:border-zinc-500'
                  : 'border-green-600 focus:border-green-500'
          }`}
        />

        {/* Copy Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 text-zinc-400 transition-colors hover:text-white"
            aria-label={`Copy ${label}`}
          >
            <Copy size={18} className={copied ? 'text-emerald-500' : ''} />
          </button>
        )}

        {/* Validation Error Icon + Tooltip */}
        {hasError && !disabled && (
          <div
            className="absolute inset-y-0 right-12 my-auto flex items-center text-red-500"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <AlertCircle size={18} className="cursor-help" aria-label="Invalid input" />
            {showTooltip && (
              <div className="absolute top-full right-0 z-10 mt-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-xs whitespace-nowrap text-white">
                {error}
                <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 transform border-t border-l border-zinc-600 bg-zinc-800" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-center gap-1 text-sm text-red-400"
          role="alert"
        >
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
