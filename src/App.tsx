import { ConfigBuilder } from './components/ConfigBuilder';
import { ClipboardPermissionNotice } from './components/ClipboardPermissionNotice';
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';

function App() {
  const [clearClipboardAfterCopy, setClearClipboardAfterCopy] = useState(true);
  const [showClipboardModal, setShowClipboardModal] = useState(false);

  return (
    // App with background gradient and text styling
    <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,#1e1b4b_0%,#312e81_100%)] text-white">
      {/* App Header */}
      <header className="relative border-b border-white/10 bg-black/20 px-6 py-8 text-center">
        {/* Gear Icon - Top Right Corner */}
        <button
          onClick={() => setShowClipboardModal(true)}
          className="absolute top-5 right-6 z-10 rounded-2xl p-1 text-zinc-400 transition-colors outline-none hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950" // "absolute top-5 right-6 z-10 rounded-2xl p-1 text-zinc-400 hover:bg-zinc-80 transition-all 0 hover:text-white"
          title="Clipboard Settings "
          aria-label="Open clipboard settings"
          aria-expanded={showClipboardModal}
        >
          <Settings size={26} aria-hidden="true" />
        </button>

        {/* Centered Title */}
        <div className="flex flex-col items-center pt-2 pb-0">
          <h1 className="text-3-5xl md:text-4-5xl lg:text-5xl-custom m-0 font-bold tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            {/* md:text-[2.5rem] */}
            🔐 WireGuard QR Code Generator
          </h1>
          {/* don't show on mobile */}
          <p className="mt-2 hidden text-center text-base text-zinc-400 opacity-90 sm:block">
            Client-side only • Keys never leave your device
          </p>
        </div>
      </header>

      {/* App Main Content */}
      <main className="flex-1 px-4 py-8 text-white">
        {/* App Container */}
        <div className="mx-auto max-w-[1200px]">
          <ConfigBuilder clearClipboardAfterCopy={clearClipboardAfterCopy} />
        </div>
      </main>

      {/* App Footer */}
      <footer className="border-t border-white/10 bg-black/20 px-6 py-6 text-center sm:text-xs md:text-sm">
        <div className="mb-6 flex items-center justify-center">
          <ClipboardPermissionNotice className="max-w-xl" />
        </div>
        <p className="m-0 mx-auto max-w-md text-white opacity-90">
          Remember: Never share your private keys. Always verify configurations before use.
        </p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showClipboardModal}
        onClose={() => setShowClipboardModal(false)}
        clearAfterCopy={clearClipboardAfterCopy}
        onToggle={setClearClipboardAfterCopy}
      />
    </div>
  );
}

export default App;
