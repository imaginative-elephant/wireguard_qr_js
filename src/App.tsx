import './App.css';
import { ConfigBuilder } from './components/ConfigBuilder';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🔐 WireGuard QR Code Generator</h1>
        <p>Client-side only • Keys never leave your device</p>
      </header>

      <main className="app-main">
        <div className="container">
          <ConfigBuilder />
        </div>
      </main>

      <footer className="app-footer">
        <p>Remember: Never share your private keys. Always verify configurations before use.</p>
      </footer>
    </div>
  );
}

export default App;
