import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy } from 'lucide-react';
import { downloadQRCode } from '../utils/qr';
import toast from 'react-hot-toast';
import { Card } from './Card';

export interface QRDisplayProps {
  config: string;
  filename?: string;
}

export function QRDisplay({ config, filename = 'wireguard-config' }: QRDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const buttonBase =
    'flex items-center justify-center gap-2 active:scale-[0.985] transition-all duration-200 ' +
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400';
  const qrDownloadButton = `${buttonBase} 
    w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-4 font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white`;
  // 'w-full rounded-2xl bg-gradient-to-r from-porcelain to-zinc-100 py-3 font-medium text-black shadow-lg shadow-black/10 hover:from-slate-100 hover:to-slate-200 transition ';

  const copyConfigButton = `${buttonBase}
    w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-4 font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white`;
  //'w-full border rounded-2xl border-zinc-500/40 bg-zinc-900/75 py-3 font-medium text-zinc-100 shadow-lg shadow-black/20 hover:bg-zinc-800/80 hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:ring-zinc-400';

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
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto mb-8 text-7xl opacity-20 md:text-8xl">📱</div>
          <h3 className="mb-3 text-xl leading-[1.2] font-semibold tracking-tight text-zinc-300 md:text-2xl">
            QR Code Ready
          </h3>
          <p className="text-zinc-500">Complete the required fields to generate the QR code.</p>
        </div>
      </Card>
    );
  }

  return (
    // div className="card flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
    <Card
    //className="card flex h-full flex-col rounded-3xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-sm md:p-8"
    >
      <h2 className="mb-6 text-2xl font-semibold md:text-3xl">QR Code</h2>

      <div
        // className="mb-6 flex flex-1 items-center justify-center rounded-3xl border border-zinc-200 bg-white p-10 shadow-[0_10px_30px_-10px_rgb(0,0,0,0.4)] shadow-inner"
        className="mx-auto mb-8 flex w-full max-w-[280px] items-center justify-center rounded-2xl bg-white p-6 shadow-inner shadow-black/30 md:max-w-[320px] md:p-8"
        ref={qrRef}
      >
        <QRCodeCanvas
          value={config}
          level="H" // High error correction - important for long configs
          size={260}
          marginSize={4}
          className="md:size-[320px]"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleDownloadQR}
          className={qrDownloadButton}
          title="Download QR code as PNG"
          aria-label="Download QR code as PNG"
        >
          <Download size={16} aria-hidden="true" />
          Download QR Code (.png)
        </button>

        <button
          onClick={handleCopyConfig}
          className={copyConfigButton}
          title="Copy config text"
          aria-label="Copy config text"
        >
          <Copy size={16} aria-hidden="true" />
          Copy Config Text
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">
        High error correction • Scan with WireGuard app
      </p>
    </Card>
  );
}
