import { useState, useMemo, lazy, Suspense } from 'react';
import { RotateCcw, FileText, Upload, Download, Key } from 'lucide-react';
import { KeyField } from './KeyField';
import { generateKeyPair, derivePubKey, generatePresharedKey } from '../utils/crypto';
import { downloadWireGuardConfig } from '../utils/download';
import { parseWireGuardConfig, generateWireGuardConfig } from '../utils/configParser';
import { ValidatedInput } from './ValidatedInput';
import toast from 'react-hot-toast';
import type { Peer } from '../types/wireguard';
import { Card } from './Card';
import { PeerSection } from './PeerSection';

import { useForm, Controller, useWatch, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { configSchema, type ConfigFormData } from '../utils/validationSchema';

const DEFAULT_PEER: Peer = {
  id: '1',
  publicKey: '',
  endpoint: '',
  allowedIPs: '',
  persistentKeepalive: '',
  presharedKey: '',
  comment: '',
};

// Dynamic import with named export
const QRDisplay = lazy(() =>
  import('./QRDisplay').then((module) => ({ default: module.QRDisplay }))
);

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
          comment: p.comment?.trim() || undefined,
        })),
    });
  }, [isConfigFullyValid, interfacePrivateKey, address, dns, listenPort, mtu, peers]);

  // ====================== Button Styles ======================
  // base styles for all buttons
  const buttonBase =
    'active:scale-[0.985] transition-all duration-200 ' +
    //accessibility focus styles
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950';

  // Common base for most buttons (flex layout + shape + typography + accessibility)
  const commonButton = `${buttonBase} flex items-center gap-2 font-medium rounded-2xl border focus-visible:ring-blue-400`;

  // Small colored buttons base
  const smallButton = `${commonButton} bg-zinc-800 text-sm px-4 py-2.5 md:px-5 shadow-sm`;

  // === Main Small Buttons ===
  const clearAllButton = `${smallButton} border-red-ochre-400/85 text-red-ochre-300 hover:bg-red-ochre-950 hover:text-red-ochre-100 hover:border-red-ochre-400`;

  const loadExampleButton = `${smallButton} border-blue-slate-400/85 text-blue-slate-300 hover:bg-blue-slate-950 hover:text-blue-slate-100 hover:border-blue-slate-400`;

  const uploadConfigButton = `${smallButton} border-amethyst-smoke-500/85 text-amethyst-smoke-300 hover:bg-amethyst-smoke-950 hover:text-amethyst-smoke-100 hover:border-amethyst-smoke-400 cursor-pointer`;

  // === Derive Public Key Button ===
  const derivePublicKeyButton = `${commonButton} border-zinc-700 bg-zinc-900/80 px-6 py-3 text-sm text-zinc-400 
  hover:border-zinc-500 hover:bg-zinc-800 hover:text-white 
  disabled:cursor-not-allowed disabled:opacity-50 
  focus-visible:ring-blue-400`;

  // === Large / Special Buttons ===
  const largeButtonBase = `${buttonBase} w-full rounded-3xl font-semibold text-white focus-visible:ring-blue-400`;

  const downloadButton = `${largeButtonBase} flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-6 text-xl shadow-xl shadow-emerald-500/40 hover:brightness-110 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60`;

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
          comment: 'My Home Server',
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
        const newPeers =
          parsed.peers.length > 0
            ? parsed.peers.map((peer, idx) => ({
                id: (idx + 1).toString(),
                publicKey: peer.publicKey || '',
                endpoint: peer.endpoint || '',
                allowedIPs: peer.allowedIps || '',
                persistentKeepalive: peer.persistentKeepalive?.toString() || '',
                presharedKey: peer.presharedKey || '',
                comment: peer.comment || peer.name || '',
              }))
            : [{ ...DEFAULT_PEER }];

        reset({
          interfacePrivateKey: parsed.interface.privateKey || '',
          address: parsed.interface.address || '',
          dns: parsed.interface.dns || '',
          listenPort: parsed.interface.listenPort?.toString() || '',
          mtu: parsed.interface.mtu?.toString() || '',
          peers: newPeers,
        });

        setInterfacePublicKey('');
        toast.success(`Config loaded successfully with (${newPeers.length} peer(s))`);
      } catch (error) {
        toast.error(
          error instanceof Error ? `Failed to parse: ${error.message}` : 'Failed to parse config'
        );
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* Top Action Bar */}
        <div className="sticky top-3 z-50 mb-8 flex items-center justify-between rounded-3xl border border-white/5 bg-zinc-950/40 px-5 py-4 shadow-2xl shadow-black/60 backdrop-blur-2xl md:mb-12 md:px-6">
          <div className="text-xl font-semibold tracking-tight text-white">
            {/* Desktop Top Action Bar Text */}
            {/* <span className="hidden md:inline">Configuration</span> */}
            {/* Mobile Top Action Bar Text*/}
            {/* <span className="md:hidden">Config</span> */}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={clearAll}
              className={clearAllButton}
              title="Clear all fields and start over"
              aria-label="Clear all fields"
            >
              <RotateCcw size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Clear All</span>
            </button>

            <button
              onClick={loadExample}
              className={loadExampleButton}
              title="Load a sample WireGuard configuration"
              aria-label="Load a sample WireGuard configuration"
            >
              <FileText size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Load Example</span>
            </button>

            <label
              htmlFor="upload-file"
              className={uploadConfigButton}
              role="button"
              tabIndex={0}
              aria-label="Upload an existing .conf file"
              title="Upload an existing .conf file"
            >
              <input
                id="upload-file"
                type="file"
                accept=".conf"
                onChange={handleUploadConfig}
                className="hidden"
                aria-hidden="false"
              />
              <Upload size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Upload .conf</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column - Configuration */}
          <div className="space-y-8 md:space-y-10 lg:col-span-7">
            {/* Interface Card */}
            <Card>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Interface
                </h2>
              </div>

              {/* Private Key */}
              <div className="space-y-8">
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

                {/* Public Key */}
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
                    title="Derive public key from private key"
                    aria-label="Derive public key from private key"
                  >
                    <Key size={18} aria-hidden="true" />
                    Derive Public Key from Private
                  </button>
                </div>

                {/* Address + DNS (Left - More Space) + Listen Port + MTU (Right - Less Space) */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-7">
                  <div className="space-y-6 sm:col-span-5">
                    {/* Address */}
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

                    {/* DNS */}
                    <Controller
                      control={control}
                      name="dns"
                      render={({ field }) => (
                        <ValidatedInput
                          label="DNS Servers"
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={() => trigger('dns')}
                          onFocus={() => trigger('dns')}
                          error={errors.dns?.message}
                          placeholder="1.1.1.1, 9.9.9.9"
                        />
                      )}
                    />
                  </div>

                  {/* Listen Port */}
                  <div className="space-y-6 sm:col-span-2">
                    <Controller
                      control={control}
                      name="listenPort"
                      render={({ field }) => (
                        <ValidatedInput
                          label="Listen Port"
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={() => trigger('listenPort')}
                          onFocus={() => trigger('listenPort')}
                          error={errors.listenPort?.message}
                          placeholder="(random)"
                          type="number"
                        />
                      )}
                    />

                    {/* MTU */}
                    <Controller
                      control={control}
                      name="mtu"
                      render={({ field }) => (
                        <ValidatedInput
                          label="MTU"
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={() => trigger('mtu')}
                          onFocus={() => trigger('mtu')}
                          error={errors.mtu?.message}
                          placeholder="(auto)"
                          type="number"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Peers Section */}
            <PeerSection
              clearClipboardAfterCopy={clearClipboardAfterCopy}
              onGeneratePresharedKeyForPeer={handleGeneratePresharedKeyForPeer}
              defaultPeer={DEFAULT_PEER}
            />
          </div>

          {/* Right Column - QR + Download */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6 lg:top-28">
              <Suspense
                fallback={
                  <Card>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mx-auto mb-8 text-7xl opacity-20 md:text-8xl">📱</div>
                      <h3 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-300">
                        QR Code
                      </h3>
                      <p className="text-zinc-500"> QR Code generator is loading... </p>
                    </div>
                  </Card>
                }
              >
                <QRDisplay config={isConfigFullyValid ? fullConfig : ''} />
              </Suspense>

              <button
                onClick={handleDownloadConfig}
                disabled={!isConfigFullyValid || !fullConfig}
                className={downloadButton}
                title="Download .conf"
                aria-label="Download .conf"
              >
                <Download size={26} aria-hidden="true" />
                Download .conf
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
