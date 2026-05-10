/**
 * Download text content as a file
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  if (!content.trim()) {
    throw new Error('Cannot download empty configuration');
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Download WireGuard config file
 */
export function downloadWireGuardConfig(
  configContent: string,
  filename: string = 'wireguard-client.conf'
): void {
  downloadTextFile(configContent, filename, 'text/plain');
}

/**
 * Trigger file download with base64 encoded content
 */
export function downloadBase64File(
  base64Content: string,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error(err);
    throw new Error('Failed to copy to clipboard', { cause: err });
  }
}
