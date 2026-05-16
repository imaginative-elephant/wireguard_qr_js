import { parse } from 'ini';

type RawIniSection = Record<string, string | number | undefined>;
import type { WireGuardConfig } from '../types/wireguard';

/**
 * Parse WireGuard .conf file content
 */
export function parseWireGuardConfig(content: string): WireGuardConfig {
  const data = parse(content) as Record<string, unknown>;

  const config: WireGuardConfig = {
    interface: {},
    peers: [],
  };

  // Parse Interface section
  if (data.Interface) {
    const iface = data.Interface as RawIniSection;
    config.interface = {
      address: typeof iface.Address === 'string' ? iface.Address : undefined,
      privateKey: typeof iface.PrivateKey === 'string' ? iface.PrivateKey : undefined,
      dns: typeof iface.DNS === 'string' ? iface.DNS : undefined,
      listenPort:
        typeof iface.ListenPort === 'string' || typeof iface.ListenPort === 'number'
          ? parseInt(String(iface.ListenPort))
          : undefined,
      mtu:
        typeof iface.MTU === 'string' || typeof iface.MTU === 'number'
          ? parseInt(String(iface.MTU))
          : undefined,
    };
  }

  // Parse Peer sections
  if (data.Peer) {
    const peers = Array.isArray(data.Peer) ? data.Peer : [data.Peer];
    config.peers = peers.map((peer) => {
      const section = peer as RawIniSection;
      return {
        publicKey: typeof section.PublicKey === 'string' ? section.PublicKey : undefined,
        endpoint: typeof section.Endpoint === 'string' ? section.Endpoint : undefined,
        allowedIps: typeof section.AllowedIPs === 'string' ? section.AllowedIPs : undefined,
        presharedKey: typeof section.PresharedKey === 'string' ? section.PresharedKey : undefined,
        persistentKeepalive:
          typeof section.PersistentKeepalive === 'string' ||
          typeof section.PersistentKeepalive === 'number'
            ? parseInt(String(section.PersistentKeepalive))
            : undefined,
      };
    });
  }

  return config;
}

const formatValue = (value: string | number | undefined): string | null => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str ? str : null;
};

/**
 * Maps JavaScript property names to exact WireGuard config key names
 */
const keyMap: Record<string, string> = {
  address: 'Address',
  privateKey: 'PrivateKey',
  dns: 'DNS',
  listenPort: 'ListenPort',
  mtu: 'MTU',

  publicKey: 'PublicKey',
  presharedKey: 'PresharedKey',
  endpoint: 'Endpoint',
  allowedIps: 'AllowedIPs',
  persistentKeepalive: 'PersistentKeepalive',
};
const buildSection = (
  header: string,
  data: Record<string, string | number | undefined>
): string => {
  const lines: string[] = [`[${header}]`];

  Object.entries(data).forEach(([key, value]) => {
    const formattedValue = formatValue(value);
    if (formattedValue === null) return;

    const wgKey = keyMap[key] || key; // Use mapped name or fallback
    lines.push(`${wgKey} = ${formattedValue}`);
  });

  return lines.join('\n');
};

export function generateWireGuardConfig(config: WireGuardConfig): string {
  if (!config.interface.privateKey?.trim() || !config.interface.address?.trim()) {
    return '';
  }

  const sections: string[] = [];

  // === Interface Section ===
  sections.push(
    buildSection('Interface', {
      address: config.interface.address,
      privateKey: config.interface.privateKey,
      dns: config.interface.dns,
      listenPort: config.interface.listenPort,
      mtu: config.interface.mtu,
    })
  );

  // === Peer Sections ===
  config.peers
    .filter((p) => p.publicKey?.trim())
    .forEach((peer, index) => {
      const comment = peer.name || peer.comment || `Peer ${index + 1}`;
      if (comment) sections.push(`# ${comment}`);

      sections.push(
        buildSection('Peer', {
          publicKey: peer.publicKey,
          presharedKey: peer.presharedKey,
          endpoint: peer.endpoint,
          allowedIps: peer.allowedIps,
          persistentKeepalive: peer.persistentKeepalive,
        })
      );
    });

  return sections.join('\n\n');
}

/**
 * Validate WireGuard config
 */
export function validateWireGuardConfig(config: WireGuardConfig): string[] {
  const errors: string[] = [];

  if (!config.interface.privateKey) errors.push('Interface private key is required');
  if (!config.interface.address) errors.push('Interface address is required');

  if (config.peers.length === 0) errors.push('At least one peer is required');

  config.peers.forEach((peer, index) => {
    if (!peer.publicKey) errors.push(`Peer ${index} public key is required`);
    if (!peer.endpoint) errors.push(`Peer ${index} endpoint is required`);
    if (!peer.allowedIps) errors.push(`Peer ${index} allowed IPs is required`);
  });

  return errors;
}
