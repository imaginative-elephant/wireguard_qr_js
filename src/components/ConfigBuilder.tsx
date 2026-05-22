// src/components/ConfigBuilder.tsx
import { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, FileText, Upload, Download, Key } from 'lucide-react';
import { KeyField } from './KeyField';
import { QRDisplay } from './QRDisplay';
import { generateKeyPair, derivePubKey, generatePresharedKey } from '../utils/crypto';
import { downloadWireGuardConfig } from '../utils/download';
import { parseWireGuardConfig, generateWireGuardConfig } from '../utils/configParser';
import { ValidatedInput } from './ValidatedInput';
import toast from 'react-hot-toast';
import type { Peer } from '../types/wireguard';

import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { configSchema, type ConfigFormData } from '../utils/validationSchema';

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
  const [interfacePublicKey, setInterfacePublicKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      interfacePrivateKey: '',
      address: '',
      dns: '',
      listenPort: '',
      mtu: '',
      peers: [{ ...DEFAULT_PEER }],
    },
  });

  const {
    control,
    formState: { errors, isValid: formIsValid },
    setValue,
    reset,
    trigger,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'peers',
  });

  const values = useWatch({ control });
  const interfacePrivateKey = values.interfacePrivateKey ?? '';
  const address = values.address ?? '';
  const dns = values.dns ?? '';
  const listenPort = values.listenPort ?? '';
  const mtu = values.mtu ?? '';
  const peers = useMemo(() => (values.peers as Peer[]) ?? [], [values.peers]);

  const isConfigFullyValid = useMemo(() => {
    return (
      formIsValid &&
      interfacePrivateKey.trim().length > 0 &&
      address.trim().length > 0 &&
      peers.every((p) => p?.publicKey?.trim().length > 0)
    );
  }, [formIsValid, interfacePrivateKey, address, peers]);

  const fullConfig = useMemo(() => {
    if (!isConfigFullyValid) return '';

    return generateWireGuardConfig({
      interface: {
        privateKey: interfacePrivateKey.trim(),
        address: address.trim(),
        dns: dns.trim() || undefined,
        listenPort: listenPort ? parseInt(listenPort) : undefined,
        mtu: mtu ? parseInt(mtu) : undefined,
      },
      peers: peers
        .filter((p) => p?.publicKey?.trim().length > 0)
        .map((p) => ({
          publicKey: p.publicKey.trim(),
          presharedKey: p.presharedKey?.trim() || undefined,
          endpoint: p.endpoint?.trim() || undefined,
          allowedIps: p.allowedIPs?.trim() || undefined,
          persistentKeepalive: p.persistentKeepalive ? parseInt(p.persistentKeepalive) : undefined,
        })),
    });
  }, [isConfigFullyValid, interfacePrivateKey, address, dns, listenPort, mtu, peers]);

  // ====================== Button Styles ======================
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
  //'cursor-pointer border-amethyst-smoke-500/30 bg-gradient-to-r from-amethyst-smoke-700/70 to-amethyst-smoke-600/70 text-amethyst-smoke-100 shadow-lg shadow-amethyst-smoke-800/20 hover:from-amethyst-smoke-600/80 hover:to-amethyst-smoke-500/80 focus-visible:ring-offset-zinc-950 focus-visible:ring-amethyst-smoke-400/40';

  const downloadConfigButton =
    actionButton +
    'col-span-full border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-offset-zinc-950 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60';
  //'border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-offset-zinc-950 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60';

  const addPeerButton =
    buttonBase +
    'w-full rounded-2xl border-emerald-600/30 bg-gradient-to-r from-emerald-700/80 to-emerald-600/80 py-4 font-semibold text-emerald-100 shadow-lg shadow-emerald-900/20 hover:from-emerald-600/90 hover:to-emerald-500/90 hover:border-emerald-500 focus-visible:ring-offset-zinc-950 focus-visible:ring-emerald-400';

  const derivePublicKeyButton =
    buttonBase +
    'rounded-xl border-zinc-400/50 bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 px-6 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:from-zinc-800/70 hover:to-zinc-700/70 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-offset-zinc-950 focus-visible:ring-zinc-400';

  // ====================== Handlers ======================

  const handleGenerateInterfaceKeys = async () => {
    setIsGenerating(true);
    try {
      const { privateKey, publicKey } = await generateKeyPair();
      setValue('interfacePrivateKey', privateKey, { shouldValidate: true, shouldTouch: true });
      setInterfacePublicKey(publicKey);
      trigger('interfacePrivateKey');
      toast.success('Interface keys generated');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate keys');
    } finally {
      setIsGenerating(false);
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
      toast.error(error instanceof Error ? error.message : 'Invalid private key');
    }
  };

  const updatePeer = (index: number, updates: Partial<Peer>) => {
    if (!peers[index]) return;
    const newPeer = { ...peers[index], ...updates } as Peer;
    setValue(`peers.${index}`, newPeer, {
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const addPeer = () => {
    const newPeer: Peer = { ...DEFAULT_PEER, id: (fields.length + 1).toString() };
    append(newPeer);
    toast.success('Peer added');
  };

  const removePeer = (index: number) => {
    if (fields.length === 1) {
      toast.error('Must have at least one peer');
      return;
    }
    remove(index);
    toast.success('Peer removed');
  };

  const handleGeneratePresharedKeyForPeer = (index: number) => {
    try {
      const { presharedKey } = generatePresharedKey();
      setValue(`peers.${index}.presharedKey`, presharedKey, {
        shouldValidate: true,
        shouldTouch: true,
      });
      toast.success('Pre-shared key generated');
    } catch {
      toast.error('Failed to generate pre-shared key');
    }
  };

  const clearAll = () => {
    reset({
      interfacePrivateKey: '',
      address: '',
      dns: '',
      listenPort: '',
      mtu: '',
      peers: [{ ...DEFAULT_PEER }],
    });
    setInterfacePublicKey('');
    toast.success('Form cleared');
  };

  const loadExample = () => {
    reset({
      interfacePrivateKey: '',
      address: '10.0.0.2/32',
      dns: '1.1.1.1, 9.9.9.9',
      listenPort: '',
      mtu: '',
      peers: [
        {
          id: '1',
          publicKey: '',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
          persistentKeepalive: '',
          presharedKey: '',
        },
      ],
    });
    setInterfacePublicKey('');
    toast.success('Example loaded');
  };

  const handleDownloadConfig = () => {
    if (!fullConfig?.trim()) {
      toast.error('Please fix all validation errors first');
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
        const parsed = parseWireGuardConfig(content);

        reset({
          interfacePrivateKey: parsed.interface.privateKey || '',
          address: parsed.interface.address || '',
          dns: parsed.interface.dns || '',
          listenPort: parsed.interface.listenPort?.toString() || '',
          mtu: parsed.interface.mtu?.toString() || '',
          peers:
            parsed.peers.length > 0
              ? parsed.peers.map((peer, idx) => ({
                  id: (idx + 1).toString(),
                  publicKey: peer.publicKey || '',
                  endpoint: peer.endpoint || '',
                  allowedIPs: peer.allowedIps || '',
                  persistentKeepalive: peer.persistentKeepalive?.toString() || '',
                  presharedKey: peer.presharedKey || '',
                }))
              : [{ ...DEFAULT_PEER }],
        });
        setInterfacePublicKey('');
        toast.success('Config loaded successfully');
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? `Failed to parse config: ${error.message}`
            : 'Failed to parse config file'
        );
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="space-y-8">
          {/* Interface Card */}
          <div className="card rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Interface Configuration
            </h2>

            <div className="space-y-6">
              <KeyField
                label="Private Key"
                value={interfacePrivateKey}
                onChange={(v) =>
                  setValue('interfacePrivateKey', v, { shouldValidate: true, shouldTouch: true })
                }
                onBlur={() => trigger('interfacePrivateKey')}
                onFocus={() => trigger('interfacePrivateKey')}
                onGenerate={handleGenerateInterfaceKeys}
                generateButtonText={isGenerating ? 'Generating...' : 'Generate Keys'}
                isSensitive
                defaultHidden={true}
                error={errors.interfacePrivateKey?.message}
                disabled={isGenerating}
                clearClipboardAfterCopy={clearClipboardAfterCopy}
              />

              <KeyField
                label="Public Key"
                value={interfacePublicKey}
                readonly
                showGenerateButton={false}
                clearClipboardAfterCopy={clearClipboardAfterCopy}
              />

              <div className="flex justify-center">
                <button
                  onClick={handleDeriveInterfacePubKey}
                  disabled={!interfacePrivateKey}
                  className={derivePublicKeyButton}
                >
                  <Key size={14} className="mr-2" />
                  Derive Public Key from Private
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-7">
                <div className="space-y-4 sm:col-span-5">
                  <Controller
                    control={control}
                    name="address"
                    render={({ field }) => (
                      <ValidatedInput
                        label="Address"
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={() => trigger('address')}
                        onFocus={() => trigger('address')}
                        error={errors.address?.message}
                        placeholder="10.0.0.2/32"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="dns"
                    render={({ field }) => (
                      <ValidatedInput
                        label="DNS"
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.dns?.message}
                        placeholder="1.1.1.1, 9.9.9.9"
                      />
                    )}
                  />
                </div>

                <div className="space-y-4 sm:col-span-2">
                  <Controller
                    control={control}
                    name="listenPort"
                    render={({ field }) => (
                      <ValidatedInput
                        label="Listen Port"
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.listenPort?.message}
                        placeholder="(random)"
                        type="number"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="mtu"
                    render={({ field }) => (
                      <ValidatedInput
                        label="MTU"
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.mtu?.message}
                        placeholder="(auto)"
                        type="number"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Peers Section */}
          <div className="space-y-8">
            {fields.map((field, index) => {
              const peer = peers[index] || DEFAULT_PEER;

              return (
                <div
                  key={field.id}
                  className="card rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      Peer {index + 1}
                    </h2>
                    {fields.length > 1 && (
                      <button
                        onClick={() => removePeer(index)}
                        className="rounded-lg p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
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
                      onChange={(v) => updatePeer(index, { publicKey: v })}
                      onBlur={() => trigger(`peers.${index}.publicKey`)}
                      onFocus={() => trigger(`peers.${index}.publicKey`)}
                      error={errors.peers?.[index]?.publicKey?.message}
                      defaultHidden={false}
                      clearClipboardAfterCopy={clearClipboardAfterCopy}
                    />

                    <KeyField
                      label="Pre-Shared Key (optional)"
                      value={peer.presharedKey}
                      onChange={(v) => updatePeer(index, { presharedKey: v })}
                      onGenerate={() => handleGeneratePresharedKeyForPeer(index)}
                      generateButtonText="Generate PSK"
                      isSensitive
                      defaultHidden={true}
                      error={errors.peers?.[index]?.presharedKey?.message}
                      clearClipboardAfterCopy={clearClipboardAfterCopy}
                    />

                    <div className="mt-6 space-y-4">
                      {/* Endpoint */}
                      <ValidatedInput
                        label="Endpoint (optional)"
                        value={peer.endpoint}
                        onChange={(v) => updatePeer(index, { endpoint: v })}
                        onBlur={() => trigger(`peers.${index}.endpoint`)}
                        error={errors.peers?.[index]?.endpoint?.message}
                        placeholder="vpn.example.com:51820"
                      />

                      {/* Allowed IPs */}
                      <ValidatedInput
                        label="Allowed IPs"
                        value={peer.allowedIPs}
                        onChange={(v) => updatePeer(index, { allowedIPs: v })}
                        onBlur={() => trigger(`peers.${index}.allowedIPs`)}
                        error={errors.peers?.[index]?.allowedIPs?.message}
                        placeholder="0.0.0.0/0, ::/0"
                      />

                      {/* Persistent Keepalive */}
                      <ValidatedInput
                        label="Persistent Keepalive (optional)"
                        value={peer.persistentKeepalive}
                        onChange={(v) => updatePeer(index, { persistentKeepalive: v })}
                        onBlur={() => trigger(`peers.${index}.persistentKeepalive`)}
                        error={errors.peers?.[index]?.persistentKeepalive?.message}
                        placeholder=""
                        type="number"
                      />
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
          </div>

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
                disabled={!isConfigFullyValid || !fullConfig}
                className={downloadConfigButton}
              >
                <Download size={16} />
                Download Config (.conf)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        {/* QR DISPLAY */}
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
