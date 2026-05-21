import { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, FileText, Upload, Download, Key } from 'lucide-react';
import { KeyField } from './KeyField';
import { QRDisplay } from './QRDisplay';
import { generateKeyPair, derivePubKey, generatePresharedKey } from '../utils/crypto';
import { validateWireGuardKey } from '../utils/validators';
import { downloadWireGuardConfig } from '../utils/download';
import { parseWireGuardConfig, generateWireGuardConfig } from '../utils/configParser';
import { useValidation } from '../hooks/useValidation';
import { ValidatedInput } from './ValidatedInput';
import toast from 'react-hot-toast';
import type { Peer } from '../types/wireguard';

const DEFAULT_PEER: Peer = {
  id: '1',
  publicKey: '',
  endpoint: '',
  allowedIPs: '',
  persistentKeepalive: '',
  presharedKey: '',
};

interface ConfigBuilderProps {
  clearClipboardAfterCopy: boolean;
}

export function ConfigBuilder({ clearClipboardAfterCopy }: ConfigBuilderProps) {
  // Interface
  const [interfacePrivateKey, setInterfacePrivateKey] = useState('');
  const [interfacePublicKey, setInterfacePublicKey] = useState('');
  const [address, setAddress] = useState('');
  const [dns, setDns] = useState('');
  const [listenPort, setListenPort] = useState('');
  const [mtu, setMtu] = useState('');

  // Peers
  const [peers, setPeers] = useState<Peer[]>([{ ...DEFAULT_PEER }]);
  const [nextPeerId, setNextPeerId] = useState(2);

  const {
    errors,
    isValid: isConfigFullyValid,
    markTouched,
  } = useValidation(interfacePrivateKey, address, dns, peers);

  // deligates to centralized config generator from utils, which handles all formatting and optional fields
  const fullConfig = useMemo(() => {
    // Safety guard
    if (!interfacePrivateKey.trim() || !address.trim()) {
      return '';
    }

    const config = generateWireGuardConfig({
      interface: {
        privateKey: interfacePrivateKey.trim(),
        address: address.trim(),
        dns: dns.trim() || undefined,
        listenPort: listenPort ? parseInt(listenPort) : undefined,
        mtu: mtu ? parseInt(mtu) : undefined,
      },
      peers: peers
        .filter((p) => p.publicKey.trim().length > 0) // Only valid peers
        .map((p) => ({
          publicKey: p.publicKey.trim(),
          presharedKey: p.presharedKey.trim() || undefined,
          endpoint: p.endpoint.trim() || undefined,
          allowedIps: p.allowedIPs.trim() || undefined,
          persistentKeepalive: p.persistentKeepalive ? parseInt(p.persistentKeepalive) : undefined,
        })),
    });

    return config;
  }, [interfacePrivateKey, address, dns, listenPort, mtu, peers]);

  // Action Buttons
  const buttonBase =
    'flex items-center justify-center gap-2 border ' +
    'active:scale-[0.985] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 '; // needs a trailing space
  const actionButton = buttonBase + 'rounded-xl px-6 py-3 font-medium ';

  const clearAllButton =
    actionButton +
    'border-red-ochre-600/30 bg-gradient-to-r from-red-ochre-800/70 to-red-ochre-700/70 text-red-ochre-100 shadow-lg shadow-red-ochre-900/20 hover:from-red-ochre-700/80 hover:to-red-ochre-600/80 focus-visible:ring-offset-zinc-950 focus-visible:ring-red-ochre-500/40';

  const loadExampleButton =
    actionButton +
    'border-blue-slate-600/30 bg-gradient-to-r from-blue-slate-800/70 to-blue-slate-500/70 text-blue-slate-100 shadow-lg shadow-blue-slate-900/20 hover:from-blue-slate-700/80 hover:to-blue-slate-600/80 focus-visible:ring-offset-zinc-950 focus-visible:ring-pale-blue-500/40';

  const uploadConfigButton =
    actionButton +
    'col-span-full cursor-pointer rounded-xl border-amethyst-smoke-500/30 bg-gradient-to-r from-amethyst-smoke-700/70 to-amethyst-smoke-600/70 text-amethyst-smoke-100 shadow-lg shadow-amethyst-smoke-800/20 hover:from-amethyst-smoke-600/80 hover:to-amethyst-smoke-500/80 focus-visible:ring-offset-zinc-950 focus-visible:ring-amethyst-smoke-400/40';

  const downloadConfigButton =
    actionButton +
    'col-span-full border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-offset-zinc-950 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60';

  const addPeerButton =
    buttonBase +
    'w-full rounded-2xl border-emerald-600/30 bg-gradient-to-r from-emerald-700/80 to-emerald-600/80 py-4 font-semibold text-emerald-100 shadow-lg shadow-emerald-900/20 hover:from-emerald-600/90 hover:to-emerald-500/90 hover:border-emerald-500 focus-visible:ring-offset-zinc-950 focus-visible:ring-emerald-400';

  const derivePublicKeyButton =
    buttonBase +
    'rounded-xl border-zinc-400/50 bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 px-6 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:from-zinc-800/70 hover:to-zinc-700/70 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-offset-zinc-950 focus-visible:ring-zinc-400';

  const handleGenerateInterfaceKeys = async () => {
    try {
      const { privateKey, publicKey } = await generateKeyPair();
      setInterfacePrivateKey(privateKey);
      setInterfacePublicKey(publicKey);
      toast.success('Interface keys generated');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Failed to generate keys';
      toast.error(message);
    }
  };

  const handleDeriveInterfacePubKey = () => {
    if (!interfacePrivateKey) return toast.error('Enter private key first');
    try {
      const pubKey = derivePubKey(interfacePrivateKey);
      setInterfacePublicKey(pubKey);
      toast.success('Public key derived');
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Invalid private key';
      toast.error(msg);
    }
  };

  const updatePeer = (id: string, updates: Partial<Peer>) => {
    setPeers(peers.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addPeer = () => {
    const newPeer: Peer = { ...DEFAULT_PEER, id: nextPeerId.toString() };
    setPeers([...peers, newPeer]);
    setNextPeerId(nextPeerId + 1);
    toast.success('Peer added');
  };

  const removePeer = (id: string) => {
    if (peers.length === 1) {
      toast.error('Must have at least one peer');
      return;
    }
    setPeers(peers.filter((p) => p.id !== id));
    toast.success('Peer removed');
  };

  const handleGeneratePresharedKeyForPeer = (peerId: string) => {
    try {
      const { presharedKey } = generatePresharedKey();
      updatePeer(peerId, { presharedKey });
      toast.success('Pre-shared key generated');
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Failed to generate pre-shared key';
      toast.error(msg);
    }
  };

  const clearAll = () => {
    setInterfacePrivateKey('');
    setInterfacePublicKey('');
    setAddress('');
    setDns('');
    setMtu('');
    setPeers([{ ...DEFAULT_PEER }]);
    setNextPeerId(2);
    toast.success('Form cleared');
  };

  const loadExample = () => {
    setAddress('10.0.0.2/32');
    setDns('1.1.1.1, 9.9.9.9');
    setPeers([
      {
        id: '1',
        publicKey: '',
        endpoint: 'vpn.example.com:51820',
        allowedIPs: '0.0.0.0/0',
        persistentKeepalive: '',
        presharedKey: '',
      },
    ]);
    setNextPeerId(2);
    toast.success('Example loaded');
  };

  const handleDownloadConfig = () => {
    if (!fullConfig.trim()) {
      toast.error('No config to download');
      return;
    }
    downloadWireGuardConfig(fullConfig, 'wireguard-client.conf');
    toast.success('Config downloaded');
  };

  const handleUploadConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedConfig = parseWireGuardConfig(content);

        // Load interface
        setInterfacePrivateKey(parsedConfig.interface.privateKey || '');
        setInterfacePublicKey(''); // Will be derived if private key exists
        setAddress(parsedConfig.interface.address || '');
        setDns(parsedConfig.interface.dns || '');
        setMtu(parsedConfig.interface.mtu?.toString() || '');

        // Load peers
        if (parsedConfig.peers.length > 0) {
          const loadedPeers: Peer[] = parsedConfig.peers.map((peer, index) => ({
            id: (index + 1).toString(),
            publicKey: peer.publicKey || '',
            endpoint: peer.endpoint || '',
            allowedIPs: peer.allowedIps || '',
            persistentKeepalive: peer.persistentKeepalive?.toString() || '',
            presharedKey: peer.presharedKey || '',
          }));
          setPeers(loadedPeers);
          setNextPeerId(loadedPeers.length + 1);
        }

        toast.success('Config loaded successfully');
      } catch (error) {
        console.error('Failed to parse config:', error);
        const msg =
          error instanceof Error
            ? `Failed to parse WireGuard config file: ${error.message}`
            : 'Failed to parse WireGuard config file';
        toast.error(msg);
      }
    };
    reader.readAsText(file);
    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Left: Config Form */}
        <div className="space-y-8">
          {/* Interface Card */}
          <div className="card rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Interface Configuration
            </h2>

            <div className="space-y-1">
              <KeyField
                label="Private Key"
                value={interfacePrivateKey}
                onChange={setInterfacePrivateKey}
                onGenerate={handleGenerateInterfaceKeys}
                generateButtonText="Generate Keys"
                isSensitive
                defaultHidden={true}
                validator={(value) => validateWireGuardKey(value, 'Private Key')}
                error={errors.interfacePrivateKey}
                onBlur={() => markTouched('interfacePrivateKey')}
                clearClipboardAfterCopy={clearClipboardAfterCopy}
              />

              <KeyField
                label="Public Key"
                value={interfacePublicKey}
                onChange={setInterfacePublicKey}
                readonly
                showGenerateButton={false}
                clearClipboardAfterCopy={clearClipboardAfterCopy}
              />

              <div className="mb-6 flex justify-center">
                <button
                  onClick={handleDeriveInterfacePubKey}
                  disabled={!interfacePrivateKey}
                  className={derivePublicKeyButton}
                >
                  <Key size={14} />
                  Derive Public Key from Private
                </button>
              </div>

              {/* Address + DNS (Left - More Space) + Listen Port + MTU (Right - Less Space) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-7">
                {/* Address + DNS - Takes more space */}
                <div className="space-y-4 sm:col-span-5">
                  <div>
                    <ValidatedInput
                      label="Address"
                      value={address}
                      onChange={setAddress}
                      error={errors.address}
                      fieldName="address"
                      markTouched={markTouched}
                      validateOnChange={true}
                      placeholder="10.0.0.2/32"
                    />
                  </div>
                  <ValidatedInput
                    label="DNS"
                    value={dns}
                    onChange={setDns}
                    error={errors.dns}
                    fieldName="dns"
                    markTouched={markTouched}
                    validateOnChange={false}
                    placeholder="1.1.1.1, 9.9.9.9"
                  />
                </div>
                {/* Listen Port + MTU - Narrower fields */}
                <div className="space-y-4 sm:col-span-2">
                  <div>
                    <ValidatedInput
                      label="Listen Port"
                      value={listenPort}
                      onChange={setListenPort}
                      fieldName="listenPort"
                      markTouched={markTouched}
                      validateOnChange={false}
                      placeholder="(random)"
                      type="number"
                      min="1024"
                      max="65535"
                    />
                  </div>

                  <div className="mt-4"></div>
                  <ValidatedInput
                    label="MTU"
                    value={mtu}
                    onChange={setMtu}
                    fieldName="mtu"
                    markTouched={markTouched}
                    validateOnChange={false}
                    placeholder="(auto)"
                    type="number"
                    min="576"
                    max="1500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==================== PEERS SECTION ==================== */}
          {peers.map((peer, index) => {
            const peerError = errors.peers[peer.id] || {};

            return (
              <div
                key={peer.id}
                className="card rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Peer {index + 1}
                  </h2>
                  {peers.length > 1 && (
                    <button
                      onClick={() => removePeer(peer.id)}
                      className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300"
                      title="Remove this peer"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {/* Public Key */}
                  <KeyField
                    label="Peer Public Key"
                    value={peer.publicKey}
                    onChange={(val) => updatePeer(peer.id, { publicKey: val })}
                    showGenerateButton={false}
                    placeholder="Server's public key"
                    validator={(value) => validateWireGuardKey(value, 'Peer Public Key')}
                    error={peerError.publicKey}
                    onBlur={() => markTouched(`peer-${peer.id}-pub`)}
                    clearClipboardAfterCopy={clearClipboardAfterCopy}
                  />

                  <KeyField
                    label="Pre-Shared Key"
                    value={peer.presharedKey}
                    onChange={(val) => updatePeer(peer.id, { presharedKey: val })}
                    onGenerate={() => handleGeneratePresharedKeyForPeer(peer.id)}
                    generateButtonText="Generate PSK"
                    placeholder="(optional)"
                    isSensitive
                    defaultHidden={true}
                    validator={(value) => validateWireGuardKey(value, 'Pre-Shared Key')}
                    error={peerError.presharedKey}
                    onBlur={() => markTouched(`peer-${peer.id}-psk`)}
                    clearClipboardAfterCopy={clearClipboardAfterCopy}
                  />

                  <div className="mt-6 space-y-4">
                    <div>
                      {/* Endpoint */}
                      <ValidatedInput
                        label="Endpoint (optional)"
                        value={peer.endpoint}
                        onChange={(val) => updatePeer(peer.id, { endpoint: val })}
                        error={peerError.endpoint}
                        fieldName={`peer-${peer.id}-endpoint`}
                        markTouched={markTouched}
                        validateOnChange={false}
                        placeholder="vpn.example.com:51820"
                      />
                    </div>

                    {/* Allowed IPs */}
                    <ValidatedInput
                      label="Allowed IPs"
                      value={peer.allowedIPs}
                      onChange={(val) => updatePeer(peer.id, { allowedIPs: val })}
                      error={peerError.allowedIPs}
                      fieldName={`peer-${peer.id}-allowed`}
                      markTouched={markTouched}
                      validateOnChange={false}
                      placeholder="0.0.0.0/0, ::/0"
                    />
                    {/* <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Allowed IPs
                      </label>
                      <input
                        type="text"
                        value={peer.allowedIPs}
                        onChange={(e) => updatePeer(peer.id, { allowedIPs: e.target.value })}
                        onBlur={() => markTouched(`peer-${peer.id}-allowed`)}
                        placeholder="0.0.0.0/0"
                        className={inputClass(!!peerError.allowedIPs)}
                      />
                      {peerError.allowedIPs && (
                        <p className="mt-1 text-sm text-red-400">{peerError.allowedIPs}</p>
                      )}
                    </div> */}
                    {/* Persistent Keepalive */}
                    <ValidatedInput
                      label="Persistent Keepalive"
                      value={peer.persistentKeepalive}
                      onChange={(val) => updatePeer(peer.id, { persistentKeepalive: val })}
                      fieldName={`peer-${peer.id}-keepalive`}
                      markTouched={markTouched}
                      validateOnChange={false}
                      placeholder="(not recommended)"
                      type="number"
                      min="0"
                      max="120"
                    />

                    {/* <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Persistent Keepalive
                      </label>
                      <input
                        type="number"
                        value={peer.persistentKeepalive}
                        onChange={(e) =>
                          updatePeer(peer.id, { persistentKeepalive: e.target.value })
                        }
                        placeholder="25"
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-950 px-4 py-3 text-[14px] text-white transition-all outline-none placeholder:text-zinc-500 focus:border-blue-500"
                      />
                    </div> */}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Peer Button */}
          <button onClick={addPeer} className={addPeerButton}>
            <Plus size={20} />
            Add Another Peer
          </button>

          {/* Action Buttons */}
          <div className="card rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Actions</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={clearAll}
                className={clearAllButton}
                // className="flex items-center justify-center gap-2 rounded-xl border-red-500/30 bg-zinc-800/80 px-6 py-3 font-medium text-red-400 transition-all duration-200 hover:bg-red-950 hover:border-red-500/50 hover:text-red-300 active:bg-red-900"
              >
                <RotateCcw size={16} />
                Clear All
              </button>
              <button onClick={loadExample} className={loadExampleButton}>
                <FileText size={16} />
                Load Example
              </button>
              <label className={uploadConfigButton}>
                <input
                  type="file"
                  accept=".conf"
                  onChange={handleUploadConfig}
                  className="hidden"
                />
                <Upload size={16} />
                Upload Config (.conf)
              </label>
              <button
                onClick={handleDownloadConfig}
                disabled={!isConfigFullyValid}
                className={downloadConfigButton}
              >
                <Download size={16} />
                Download Config (.conf)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        {/* RIGHT COLUMN - QR DISPLAY */}
        <div className="flex flex-col">
          {isConfigFullyValid && fullConfig ? (
            <QRDisplay config={fullConfig} />
          ) : (
            <div className="card flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-8 text-center">
              <div className="mb-6 text-6xl opacity-30">📱</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-400">QR Code</h3>
              <p className="max-w-xs text-sm text-zinc-500">
                Fill all required fields with valid information.
                <br />
                QR code will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
