import { parse, stringify } from 'ini'

export interface WireGuardConfig {
  interface: InterfaceConfig
  peers: PeerConfig[]
}

export interface InterfaceConfig {
  address?: string
  privateKey?: string
  dns?: string
  listenPort?: number
  mtu?: number
}

export interface PeerConfig {
  publicKey?: string
  endpoint?: string
  allowedIps?: string
  presharedKey?: string
  persistentKeepalive?: number
}

/**
 * Parse WireGuard .conf file content
 */
export function parseWireGuardConfig(content: string): WireGuardConfig {
  const data = parse(content) as Record<string, any>

  const config: WireGuardConfig = {
    interface: {},
    peers: [],
  }

  // Parse Interface section
  if (data.Interface) {
    const iface = data.Interface as Record<string, any>
    config.interface = {
      address: iface.Address,
      privateKey: iface.PrivateKey,
      dns: iface.DNS,
      listenPort: iface.ListenPort ? parseInt(iface.ListenPort) : undefined,
      mtu: iface.MTU ? parseInt(iface.MTU) : undefined,
    }
  }

  // Parse Peer sections
  if (data.Peer) {
    const peers = Array.isArray(data.Peer) ? data.Peer : [data.Peer]
    config.peers = peers.map((peer: Record<string, any>) => ({
      publicKey: peer.PublicKey,
      endpoint: peer.Endpoint,
      allowedIps: peer.AllowedIPs,
      presharedKey: peer.PresharedKey,
      persistentKeepalive: peer.PersistentKeepalive
        ? parseInt(peer.PersistentKeepalive)
        : undefined,
    }))
  }

  return config
}

/**
 * Generate WireGuard .conf file content from config object
 */
export function generateWireGuardConfig(config: WireGuardConfig): string {
  const output: Record<string, any> = {
    Interface: {},
  }

  // Add Interface section
  if (config.interface.address)
    output.Interface.Address = config.interface.address
  if (config.interface.privateKey)
    output.Interface.PrivateKey = config.interface.privateKey
  if (config.interface.dns) output.Interface.DNS = config.interface.dns
  if (config.interface.listenPort)
    output.Interface.ListenPort = config.interface.listenPort
  if (config.interface.mtu) output.Interface.MTU = config.interface.mtu

  // Add Peer sections
  if (config.peers.length > 0) {
    output.Peer = config.peers.map((peer) => {
      const peerObj: Record<string, any> = {}
      if (peer.publicKey) peerObj.PublicKey = peer.publicKey
      if (peer.endpoint) peerObj.Endpoint = peer.endpoint
      if (peer.allowedIps) peerObj.AllowedIPs = peer.allowedIps
      if (peer.presharedKey) peerObj.PresharedKey = peer.presharedKey
      if (peer.persistentKeepalive)
        peerObj.PersistentKeepalive = peer.persistentKeepalive
      return peerObj
    })
  }

  return stringify(output)
}

/**
 * Validate WireGuard config
 */
export function validateWireGuardConfig(config: WireGuardConfig): string[] {
  const errors: string[] = []

  if (!config.interface.privateKey)
    errors.push('Interface private key is required')
  if (!config.interface.address)
    errors.push('Interface address is required')

  if (config.peers.length === 0) errors.push('At least one peer is required')

  config.peers.forEach((peer, index) => {
    if (!peer.publicKey) errors.push(`Peer ${index} public key is required`)
    if (!peer.endpoint) errors.push(`Peer ${index} endpoint is required`)
    if (!peer.allowedIps) errors.push(`Peer ${index} allowed IPs is required`)
  })

  return errors
}
