import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy } from 'lucide-react';
import { downloadQRCode } from '../utils/qr';
import toast from 'react-hot-toast';

export interface QRDisplayProps {
  config: string;
  filename?: string;
}

export function QRDisplay({ config, filename = 'wireguard-config' }: QRDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const buttonBase =
    'flex items-center justify-center gap-2 ' +
    'active:scale-[0.985] transition-all duration-200  '; // needs a trailing space
  // + ' focus-visible:ring-2 focus-visible:ring-offset-2 ';
  const qrDownloadButton =
    buttonBase +
    'w-full rounded-2xl bg-gradient-to-r from-porcelain to-zinc-100 py-3 font-medium text-black shadow-lg shadow-black/10 hover:from-slate-100 hover:to-slate-200 transition ';

  const copyConfigButton =
    buttonBase +
    'w-full border rounded-2xl border-zinc-500/40 bg-zinc-900/75 py-3 font-medium text-zinc-100 shadow-lg shadow-black/20 hover:bg-zinc-800/80 hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:ring-zinc-400';
  const handleDownloadQR = async () => {
    if (!config) {
      toast.error('No config to download');
      return;
    }
    try {
      await downloadQRCode(qrRef, `${filename}.png`);
      toast.success('QR Code downloaded');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      const msg =
        error instanceof Error
          ? `Failed to download QR code: ${error.message}`
          : 'Failed to download QR code';
      toast.error(msg);
    }
  };

  const handleCopyConfig = async () => {
    if (!config) return;
    try {
      await navigator.clipboard.writeText(config);
      toast.success('Full config copied to clipboard');
    } catch {
      toast.error('Failed to copy config');
    }
  };

  if (!config) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center backdrop-blur-md">
        <div className="mb-4 text-zinc-500">QR Code will appear here</div>
        <p className="text-sm text-zinc-600">
          Complete the Interface and Peer configuration on the left
        </p>
      </div>
    );
  }

  return (
    // div className="card flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
    <div className="card flex h-full flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-8 backdrop-blur-md">
      <h2 className="mb-6 text-xl font-semibold">QR Code</h2>

      <div
        // className="mb-6 flex flex-1 items-center justify-center rounded-2xl bg-white p-6"
        className="mb-6 flex flex-1 items-center justify-center rounded-3xl border border-zinc-200 bg-white p-10 shadow-[0_10px_30px_-10px_rgb(0,0,0,0.4)] shadow-inner"
        ref={qrRef}
      >
        <QRCodeCanvas
          value={config}
          level="H" // High error correction - important for long configs
          size={320}
          marginSize={4}
        />
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={handleDownloadQR} className={qrDownloadButton}>
          <Download size={16} />
          Download QR Code (.png)
        </button>

        <button onClick={handleCopyConfig} className={copyConfigButton}>
          <Copy size={16} />
          Copy Config Text
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">
        High error correction • Scan with WireGuard app
      </p>
    </div>
  );
}
