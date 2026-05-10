import { useRef } from 'react';

export interface QRGenerationOptions {
  level?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  includeMargin?: boolean;
}

/**
 * Hook to generate QR code ref for downloading
 */
export function useQRCodeRef() {
  return useRef<HTMLDivElement>(null);
}

/**
 * Download QR code as image
 */
export async function downloadQRCode(
  elementRef: React.RefObject<HTMLDivElement | null>,
  filename: string = 'wireguard-qr.png'
): Promise<void> {
  if (!elementRef.current) {
    throw new Error('QR element not found');
  }

  try {
    const canvas = elementRef.current.querySelector('canvas');
    if (!canvas) {
      throw new Error('QR Canvas element not found');
    }

    const url = canvas.toDataURL('image/png', 1.0); //set highest quality
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('QR download failed:', error);
    throw new Error(
      `Failed to download QR code: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      }
    );
  }
}
