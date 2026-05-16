// src/types/wireguard.ts

export interface Peer {
  id: string;
  publicKey: string;
  endpoint: string;
  allowedIPs: string;
  persistentKeepalive: string;
  presharedKey: string;
}

export interface PeerError {
  publicKey?: string;
  endpoint?: string;
  allowedIPs?: string;
  presharedKey?: string;
}

export interface ValidationErrors {
  interfacePrivateKey?: string;
  address?: string;
  dns?: string;
  peers: Record<string, PeerError>;
}

export interface InterfaceConfig {
  privateKey?: string;
  address?: string;
  dns?: string;
  listenPort?: number;
  mtu?: number;
}

export interface PeerConfig {
  publicKey?: string;
  presharedKey?: string;
  endpoint?: string;
  allowedIps?: string;
  persistentKeepalive?: number;
  name?: string;
  comment?: string;
}

export interface WireGuardConfig {
  interface: InterfaceConfig;
  peers: PeerConfig[];
}
