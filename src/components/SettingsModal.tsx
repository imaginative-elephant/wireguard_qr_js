import { X, Clipboard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clearAfterCopy: boolean;
  onToggle: (enabled: boolean) => void;
}

export function SettingsModal({ isOpen, onClose, clearAfterCopy, onToggle }: Props) {
  if (!isOpen) return null;

  const buttonBase =
    'flex items-center justify-center gap-2 ' +
    'active:scale-[0.985] transition-all duration-200' +
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950';

  const doneButton = `${buttonBase} 
  mt-5 w-full border rounded-2xl border-zinc-500/40 bg-zinc-800/75 py-2.75 font-medium text-zinc-100 shadow-lg shadow-black/20 hover:bg-zinc-800/80 hover:border-zinc-400 focus-visible:ring-blue-400`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-8 shadow-2xl">
        {/* Modal Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clipboard className="h-6 w-6 text-blue-400" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-white">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Toggle Clipboard Setting */}
        <div className="flex items-start gap-6">
          {/* Text Content */}
          <div className="flex-1">
            <div className="font-medium text-white">Clear clipboard after copying</div>
            <p id="clear-clipboard-description" className="mt-1 text-sm text-zinc-400">
              Automatically clear sensitive data from clipboard (private keys, etc.) from clipboard
              after 15 seconds
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggle(!clearAfterCopy)}
            className={`relative mt-0.5 h-7 w-14 flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
              clearAfterCopy ? 'bg-blue-600' : 'bg-zinc-700'
            }`}
            role="switch"
            aria-checked={clearAfterCopy}
            aria-label="Toggle auto-clear clipboard"
            aria-describedby="clear-clipboard-description"
          >
            <div
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                clearAfterCopy ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className={doneButton}
          title="Done and close settings"
          aria-label="Done and close settings"
          // "mt-10 w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
