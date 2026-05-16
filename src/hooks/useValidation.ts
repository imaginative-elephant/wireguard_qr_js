import { useMemo, useState, useCallback } from 'react';
import {
  validateWireGuardKey,
  validateEndpoint,
  validateAllowedIPs,
  validateDNS,
  validateAddress,
} from '../utils/validators';
import type { Peer, PeerError, ValidationErrors } from '../types/wireguard';

export function useValidation(
  interfacePrivateKey: string,
  address: string,
  dns: string,
  peers: Peer[]
) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const errors = useMemo<ValidationErrors>(() => {
    const err: ValidationErrors = { peers: {} };

    // Interface validation
    // Private Key (Required)
    if (touched.interfacePrivateKey) {
      if (!interfacePrivateKey.trim()) {
        err.interfacePrivateKey = 'Private Key is required';
      } else {
        const result = validateWireGuardKey(interfacePrivateKey, 'Private Key');
        if (!result.isValid) err.interfacePrivateKey = result.error;
      }
    }

    // Address (Required)
    if (touched.address || address.trim()) {
      if (!address.trim()) {
        err.address = 'Address is required';
      } else {
        const result = validateAddress(address);
        if (!result.isValid) {
          err.address = result.error || 'Invalid Address (use CIDR format, e.g. 10.0.0.2/32)';
        }
      }
    }

    if (dns.trim() || touched.dns) {
      const result = validateDNS(dns);
      if (!result.isValid) err.dns = result.error;
    }

    // === Peers validation
    peers.forEach((peer) => {
      const peerErr: PeerError = {};
      err.peers[peer.id] = peerErr;

      // Peer Public Key (Required)
      if (peer.publicKey.trim() || touched[`peer-${peer.id}-pub`]) {
        if (!peer.publicKey.trim()) {
          peerErr.publicKey = 'Public Key is required';
        } else {
          const result = validateWireGuardKey(peer.publicKey, 'Peer Public Key');
          if (!result.isValid) peerErr.publicKey = result.error;
        }
      }

      // Endpoint
      if (peer.endpoint.trim() || touched[`peer-${peer.id}-endpoint`]) {
        const epResult = validateEndpoint(peer.endpoint);
        if (!epResult.isValid) peerErr.endpoint = epResult.error;
      }

      // Allowed IPs
      if (peer.allowedIPs.trim() || touched[`peer-${peer.id}-allowed`]) {
        const ipResult = validateAllowedIPs(peer.allowedIPs);
        if (!ipResult.isValid) peerErr.allowedIPs = ipResult.error;
      }

      // Preshared Key
      if (peer.presharedKey.trim() || touched[`peer-${peer.id}-psk`]) {
        const pskResult = validateWireGuardKey(peer.presharedKey, 'Pre-Shared Key');
        if (!pskResult.isValid) peerErr.presharedKey = pskResult.error;
      }
    });

    return err;
  }, [interfacePrivateKey, address, dns, peers, touched]);

  const isValid = useMemo(() => {
    // Interface checks
    if (!interfacePrivateKey.trim() || !!errors.interfacePrivateKey) return false;
    if (!address.trim() || !!errors.address) return false;
    // DNS is optional but must be valid if filled
    if (dns.trim() && !!errors.dns) return false;

    // All peers must be valid
    return peers.every((peer) => {
      const peerErr = errors.peers[peer.id] || {};
      return (
        peer.publicKey.trim().length > 0 &&
        !peerErr.publicKey &&
        // Endpoint and AllowedIPs are optional in reality, but you can make them required
        (!peer.endpoint.trim() || !peerErr.endpoint) &&
        (!peer.allowedIPs.trim() || !peerErr.allowedIPs) &&
        (!peer.presharedKey.trim() || !peerErr.presharedKey)
      );
    });
  }, [errors, interfacePrivateKey, address, dns, peers]);

  // const isValid = useMemo(() => {
  //   return (
  //     !errors.interfacePrivateKey && interfacePrivateKey.trim().length > 0 &&
  //     !errors.address && address.trim().length > 0 &&
  //     !errors.dns && dns.trim().length > 0 &&
  //     Object.values(errors.peers).every(
  //       (p) => !p.publicKey && !p.endpoint && !p.allowedIPs && !p.presharedKey
  //     ) &&
  //     Object.values(peers).every(
  //       (p) => p.publicKey.trim().length > 0 &&
  //         p.endpoint.trim().length > 0 &&
  //         p.allowedIPs.trim().length > 0
  //     )
  //   );
  // }, [errors]);

  // const isValid = useMemo(() => {
  //   return (
  //     !errors.interfacePrivateKey &&
  //     interfacePrivateKey.trim().length > 0 &&
  //     !errors.address &&
  //     address.trim().length > 0 &&
  //     !errors.dns &&
  //     dns.trim().length > 0 &&
  //     peers.every((peer) => {
  //       return (
  //         peer.publicKey?.trim().length > 0 &&
  //         !errors.peers[peer.id].publicKey &&
  //         peer.endpoint?.trim().length > 0 &&
  //         !errors.peers[peer.id].endpoint &&
  //         peer.allowedIPs?.trim().length > 0 &&
  //         !errors.peers[peer.id].presharedKey
  //       );
  //     })

  //   );
  // }, [errors]);

  return { errors, isValid, markTouched };
}
