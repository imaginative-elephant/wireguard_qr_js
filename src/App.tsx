import './App.css';
import { ConfigBuilder } from './components/ConfigBuilder';
import { ClipboardPermissionNotice } from './components/ClipboardPermissionNotice';
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';

function App() {
  const [clearClipboardAfterCopy, setClearClipboardAfterCopy] = useState(true);
  const [showClipboardModal, setShowClipboardModal] = useState(false);

  return (
    <div className="app">
      <header className="app-header relative">
        {/* Gear Icon - Top Right Corner */}
        <button
          onClick={() => setShowClipboardModal(true)}
          className="absolute top-6 right-6 z-10 rounded-2xl p-3 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
          title="Clipboard Settings"
          aria-label="Open clipboard settings"
        >
          <Settings size={26} />
        </button>

        {/* Centered Title */}
        <div className="flex flex-col items-center pt-6 pb-4">
          <h1 className="text-3xl font-bold">🔐 WireGuard QR Code Generator</h1>
          <p className="mt-1 text-center text-zinc-400">
            Client-side only • Keys never leave your device
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <ConfigBuilder clearClipboardAfterCopy={clearClipboardAfterCopy} />
        </div>
      </main>

      <footer className="app-footer">
        <div className="mb-6 flex items-center justify-center">
          <ClipboardPermissionNotice />
        </div>
        <p>Remember: Never share your private keys. Always verify configurations before use.</p>
      </footer>

      {/* Modal */}
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
