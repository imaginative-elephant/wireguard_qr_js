import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { KeyField } from './KeyField';
import { QRDisplay } from './QRDisplay';
import { generateKeyPair, derivePubKey, generatePresharedKey } from '../utils/crypto';
import toast from 'react-hot-toast';

interface Peer {
  id: string;
  publicKey: string;
  endpoint: string;
  allowedIPs: string;
  persistentKeepalive: string;
  presharedKey: string;
}

const DEFAULT_PEER: Peer = {
  id: '1',
  publicKey: '',
  endpoint: '',
  allowedIPs: '',
  persistentKeepalive: '25',
  presharedKey: '',
};

export function ConfigBuilder() {
  // Interface
  const [interfacePrivateKey, setInterfacePrivateKey] = useState('');
  const [interfacePublicKey, setInterfacePublicKey] = useState('');
  const [address, setAddress] = useState('');
  const [dns, setDns] = useState('');
  const [mtu, setMtu] = useState('');

  // Peers
  const [peers, setPeers] = useState<Peer[]>([{ ...DEFAULT_PEER }]);
  const [nextPeerId, setNextPeerId] = useState(2);

  const [fullConfig, setFullConfig] = useState('');

  useEffect(() => {
    let config = '[Interface]\n';
    if (interfacePrivateKey) config += `PrivateKey = ${interfacePrivateKey}\n`;
    if (address) config += `Address = ${address}\n`;
    if (dns) config += `DNS = ${dns}\n`;
    if (mtu) config += `MTU = ${mtu}\n`;

    peers.forEach((peer) => {
      config += '\n[Peer]\n';
      if (peer.publicKey) config += `PublicKey = ${peer.publicKey}\n`;
      if (peer.presharedKey) config += `PresharedKey = ${peer.presharedKey}\n`;
      if (peer.endpoint) config += `Endpoint = ${peer.endpoint}\n`;
      if (peer.allowedIPs) config += `AllowedIPs = ${peer.allowedIPs}\n`;
      if (peer.persistentKeepalive) config += `PersistentKeepalive = ${peer.persistentKeepalive}\n`;
    });

    setFullConfig(config.trim());
  }, [interfacePrivateKey, address, dns, mtu, peers]);

  const handleGenerateInterfaceKeys = async () => {
    try {
      const { privateKey, publicKey } = await generateKeyPair();
      setInterfacePrivateKey(privateKey);
      setInterfacePublicKey(publicKey);
      toast.success('Interface keys generated');
    } catch (error) {
      toast.error('Failed to generate keys');
    }
  };

  const handleDeriveInterfacePubKey = () => {
    if (!interfacePrivateKey) return toast.error('Enter private key first');
    try {
      const pubKey = derivePubKey(interfacePrivateKey);
      setInterfacePublicKey(pubKey);
      toast.success('Public key derived');
    } catch {
      toast.error('Invalid private key');
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
      toast.error('Failed to generate pre-shared key');
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
    setDns('1.1.1.1, 8.8.8.8');
    setPeers([
      {
        id: '1',
        publicKey: '',
        endpoint: 'vpn.example.com:51820',
        allowedIPs: '0.0.0.0/0',
        persistentKeepalive: '25',
        presharedKey: '',
      },
    ]);
    setNextPeerId(2);
    toast.success('Example loaded');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: Config Form */}
        <div className="space-y-8">
          {/* Interface Card */}
          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Interface Configuration
            </h2>

            <div className="space-y-1">
              <KeyField
                label="Private Key"
                value={interfacePrivateKey}
                onChange={setInterfacePrivateKey}
                onGenerate={handleGenerateInterfaceKeys}
                generateButtonText="Generate Keys"
              />

              <KeyField
                label="Public Key"
                value={interfacePublicKey}
                onChange={setInterfacePublicKey}
                readonly
                showGenerateButton={false}
              />

              <div className="flex justify-center mb-6">
                <button
                  onClick={handleDeriveInterfacePubKey}
                  disabled={!interfacePrivateKey}
                  className="px-6 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 border border-zinc-700"
                >
                  Derive Public Key from Private
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block font-medium">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="10.0.0.2/32"
                    className="w-full bg-zinc-950 border border-zinc-600 focus:border-blue-500
                             text-white placeholder:text-zinc-500 rounded-xl px-4 py-3
                             text-[14px] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block font-medium">DNS</label>
                  <input
                    type="text"
                    value={dns}
                    onChange={(e) => setDns(e.target.value)}
                    placeholder="1.1.1.1, 8.8.8.8"
                    className="w-full bg-zinc-950 border border-zinc-600 focus:border-blue-500
                             text-white placeholder:text-zinc-500 rounded-xl px-4 py-3
                             text-[14px] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm text-zinc-400 mb-2 block font-medium">MTU (optional)</label>
                <input
                  type="text"
                  value={mtu}
                  onChange={(e) => setMtu(e.target.value)}
                  placeholder="1420"
                  className="w-full bg-zinc-950 border border-zinc-600 focus:border-blue-500
                           text-white placeholder:text-zinc-500 rounded-xl px-4 py-3
                           text-[14px] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Peers Section */}
          {peers.map((peer, index) => (
            <div key={peer.id} className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Peer {index + 1}
                </h2>
                {peers.length > 1 && (
                  <button
                    onClick={() => removePeer(peer.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200"
                    title="Remove this peer"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <KeyField
                  label="Peer Public Key"
                  value={peer.publicKey}
                  onChange={(val) => updatePeer(peer.id, { publicKey: val })}
                  showGenerateButton={false}
                  placeholder="Server's public key"
                />

                <KeyField
                  label="Pre-Shared Key (Optional)"
                  value={peer.presharedKey}
                  onChange={(val) => updatePeer(peer.id, { presharedKey: val })}
                  onGenerate={() => handleGeneratePresharedKeyForPeer(peer.id)}
                  generateButtonText="Generate PSK"
                  placeholder="Leave empty for no pre-shared key"
                />

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="text-sm text-zinc-300 mb-2 block font-medium">Endpoint</label>
                    <input
                      type="text"
                      value={peer.endpoint}
                      onChange={(e) => updatePeer(peer.id, { endpoint: e.target.value })}
                      placeholder="vpn.example.com:51820"
                      className="w-full bg-zinc-950 border border-zinc-600 focus:border-blue-500
                               text-white placeholder:text-zinc-500 rounded-xl px-4 py-3
                               text-[14px] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-300 mb-2 block font-medium">Allowed IPs</label>
                    <input
                      type="text"
                      value={peer.allowedIPs}
                      onChange={(e) => updatePeer(peer.id, { allowedIPs: e.target.value })}
                      placeholder="0.0.0.0/0"
                      className="w-full bg-zinc-950 border border-zinc-600 focus:border-blue-500
                               text-white placeholder:text-zinc-500 rounded-xl px-4 py-3
                               text-[14px] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-300 mb-2 block font-medium">Persistent Keepalive</label>
                    <input
                      type="number"
                      value={peer.persistentKeepalive}
                      onChange={(e) =>
                        updatePeer(peer.id, { persistentKeepalive: e.target.value })
                      }
                      placeholder="25"
                      className="w-full bg-zinc-950 border border-zinc-600 focus:border-blue-500
                               text-white placeholder:text-zinc-500 rounded-xl px-4 py-3
                               text-[14px] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Peer Button */}
          <button
            onClick={addPeer}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Another Peer
          </button>

          {/* Action Buttons */}
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4 text-white">Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={clearAll}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all duration-200 border border-zinc-700"
              >
                Clear All
              </button>
              <button
                onClick={loadExample}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-200"
              >
                Load Example
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <QRDisplay config={fullConfig} />
        </div>
      </div>
    </div>
  );
}

