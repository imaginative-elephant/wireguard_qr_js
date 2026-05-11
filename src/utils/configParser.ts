import { parse, stringify } from 'ini';

type RawIniSection = Record<string, string | number | undefined>;

export interface WireGuardConfig {
  interface: InterfaceConfig;
  peers: PeerConfig[];
}

export interface InterfaceConfig {
  address?: string;
  privateKey?: string;
  dns?: string;
  listenPort?: number;
  mtu?: number;
}

export interface PeerConfig {
  publicKey?: string;
  endpoint?: string;
  allowedIps?: string;
  presharedKey?: string;
  persistentKeepalive?: number;
}

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

/**
 * Generate WireGuard .conf file content from config object
 */
export function generateWireGuardConfig(config: WireGuardConfig): string {
  const output: {
    Interface: Record<string, string | number>;
    Peer?: Array<Record<string, string | number>>;
  } = {
    Interface: {},
  };

  // Add Interface section
  if (config.interface.address) output.Interface.Address = config.interface.address;
  if (config.interface.privateKey) output.Interface.PrivateKey = config.interface.privateKey;
  if (config.interface.dns) output.Interface.DNS = config.interface.dns;
  if (config.interface.listenPort) output.Interface.ListenPort = config.interface.listenPort;
  if (config.interface.mtu) output.Interface.MTU = config.interface.mtu;

  // Add Peer sections
  if (config.peers.length > 0) {
    output.Peer = config.peers.map((peer) => {
      const peerObj: Record<string, string | number> = {};
      if (peer.publicKey) peerObj.PublicKey = peer.publicKey;
      if (peer.endpoint) peerObj.Endpoint = peer.endpoint;
      if (peer.allowedIps) peerObj.AllowedIPs = peer.allowedIps;
      if (peer.presharedKey) peerObj.PresharedKey = peer.presharedKey;
      if (peer.persistentKeepalive) peerObj.PersistentKeepalive = peer.persistentKeepalive;
      return peerObj;
    });
  }

  return stringify(output);
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
