import { Info } from 'lucide-react';

interface ClipboardPermissionNoticeProps {
  className?: string;
  variant?: 'subtle' | 'default';
}

export function ClipboardPermissionNotice({
  className = '',
  variant = 'default',
}: ClipboardPermissionNoticeProps) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border bg-zinc-900/50 p-3 text-sm ${
        variant === 'subtle' ? 'border-zinc-700 text-zinc-400' : 'border-zinc-600 text-zinc-300'
      } ${className}`}
      role="note"
      aria-label="Clipboard permission information"
    >
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
      <div>
        <p>
          Copy buttons may prompt for <strong>clipboard access permission</strong>.
        </p>
        <p className="text-zinc-500 sm:mt-1 sm:text-xs md:text-sm">
          This is sometimes triggered by the clipboard clearing function for key data.
        </p>
        <p className="text-zinc-500 sm:mt-1 sm:text-xs md:text-sm">
          (This can be disabled in the settings.)
        </p>
      </div>
    </div>
  );
}
