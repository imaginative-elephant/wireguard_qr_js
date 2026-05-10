import { useState } from 'react';
import { generateWireGuardConfig } from '../utils/configParser';
import { downloadWireGuardConfig } from '../utils/download';

interface ConfigFormProps {
  keys: {
    privateKey: string;
    publicKey: string;
  };
  onConfigGenerated?: (config: string) => void;
}

export function ConfigForm({ keys, onConfigGenerated }: ConfigFormProps) {
  const [address, setAddress] = useState('10.200.200.3/32');
  const [dns, setDns] = useState('8.8.8.8');
  const [serverPublicKey, setServerPublicKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [allowedIps, setAllowedIps] = useState('0.0.0.0/0, ::/0');
  const [persistentKeepalive, setPersistentKeepalive] = useState('21');
  const [presharedKey, setPresharedKey] = useState('');

  const handleGenerateConfig = () => {
    if (!serverPublicKey || !endpoint) {
      alert('Please fill in server public key and endpoint');
      return;
    }

    const config = generateWireGuardConfig({
      interface: {
        address,
        privateKey: keys.privateKey,
        dns,
      },
      peers: [
        {
          publicKey: serverPublicKey,
          endpoint,
          allowedIps,
          presharedKey: presharedKey || undefined,
          persistentKeepalive: parseInt(persistentKeepalive),
        },
      ],
    });

    onConfigGenerated?.(config);
  };

  const handleDownloadConfig = () => {
    if (!serverPublicKey || !endpoint) {
      alert('Please fill in server public key and endpoint');
      return;
    }

    const config = generateWireGuardConfig({
      interface: {
        address,
        privateKey: keys.privateKey,
        dns,
      },
      peers: [
        {
          publicKey: serverPublicKey,
          endpoint,
          allowedIps,
          presharedKey: presharedKey || undefined,
          persistentKeepalive: parseInt(persistentKeepalive),
        },
      ],
    });

    downloadWireGuardConfig(config);
  };

  return (
    <div className="config-form">
      <h2>Configuration</h2>

      <div className="form-section">
        <h3>Interface Settings</h3>

        <div className="form-group">
          <label>Client Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="10.200.200.3/32"
          />
        </div>

        <div className="form-group">
          <label>DNS</label>
          <input
            type="text"
            value={dns}
            onChange={(e) => setDns(e.target.value)}
            placeholder="8.8.8.8"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Peer (Server) Settings</h3>

        <div className="form-group">
          <label>Server Public Key *</label>
          <input
            type="text"
            value={serverPublicKey}
            onChange={(e) => setServerPublicKey(e.target.value)}
            placeholder="Server public key (base64)"
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label>Endpoint *</label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="vpn.example.com:51820"
          />
        </div>

        <div className="form-group">
          <label>Allowed IPs</label>
          <input
            type="text"
            value={allowedIps}
            onChange={(e) => setAllowedIps(e.target.value)}
            placeholder="0.0.0.0/0, ::/0"
          />
        </div>

        <div className="form-group">
          <label>Persistent Keepalive (seconds)</label>
          <input
            type="number"
            value={persistentKeepalive}
            onChange={(e) => setPersistentKeepalive(e.target.value)}
            placeholder="21"
          />
        </div>

        <div className="form-group">
          <label>Pre-Shared Key (Optional)</label>
          <input
            type="password"
            value={presharedKey}
            onChange={(e) => setPresharedKey(e.target.value)}
            placeholder="Leave empty if not using PSK"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="form-actions">
        <button onClick={handleGenerateConfig} className="btn-primary">
          Generate QR Code
        </button>
        <button onClick={handleDownloadConfig} className="btn-secondary">
          Download Config
        </button>
      </div>
    </div>
  );
}
