import { Copy, Check, AlertCircle, Key } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { isValidWireGuardKey } from '../utils/crypto';

interface KeyFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onGenerate?: () => void;
  readonly?: boolean;
  placeholder?: string;
  showGenerateButton?: boolean;
  generateButtonText?: string;
}

export function KeyField({
  label,
  value,
  onChange,
  onGenerate,
  readonly = false,
  placeholder,
  showGenerateButton = true,
  generateButtonText = "Generate",
}: KeyFieldProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const copyToClipboard = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 1800);
  };

  const isValid = value.length === 0 || isValidWireGuardKey(value);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2.5">
        <label className="text-sm font-semibold text-zinc-200 tracking-wide">
          {label}
        </label>

        {onGenerate && showGenerateButton && (
          <button
            onClick={onGenerate}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all duration-200 shadow-sm flex items-center gap-1.5"
          >
            <Key size={12} />
            {generateButtonText}
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readonly}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={`w-full font-mono bg-zinc-950 border-2 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 transition-all focus:outline-none ${
            value
              ? isValid
                ? 'border-green-600 focus:border-green-500'
                : 'border-red-600 focus:border-red-500'
              : 'border-zinc-700 focus:border-zinc-500'
          }`}
        />

        {value && (
          <button
            onClick={copyToClipboard}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            title="Copy to clipboard"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
        )}

        {value && !isValid && (
          <div
            className="absolute right-12 top-1/2 -translate-y-1/2"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <AlertCircle className="text-red-500 cursor-help" size={18} />
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-zinc-800 text-white text-xs rounded-lg whitespace-nowrap z-10 border border-zinc-600">
                Invalid WireGuard key format
                <div className="absolute -top-1 right-3 w-2 h-2 bg-zinc-800 border-l border-t border-zinc-600 transform rotate-45"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}