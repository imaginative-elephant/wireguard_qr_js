import { useState } from 'react';
import { KeyField } from './KeyField';
import { generateKeyPair, generatePresharedKey, derivePubKey } from '../utils/crypto';
import { validateWireGuardKey } from '../utils/validators';
import toast from 'react-hot-toast';

export default function KeyGenerator() {
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [presharedKey, setPresharedKey] = useState('');

  const handleGenerateKeyPair = async () => {
    try {
      const { privateKey: priv, publicKey: pub } = await generateKeyPair();
      setPrivateKey(priv);
      setPublicKey(pub);
      toast.success('New key pair generated successfully');
    } catch (error) {
      toast.error('Failed to generate key pair');
      console.error(error);
    }
  };

  const handleGeneratePSK = () => {
    try {
      const { presharedKey: psk } = generatePresharedKey();
      setPresharedKey(psk);
      toast.success('Pre-shared key generated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PSK');
    }
  };

  const validateOptionalWireGuardKey = (key: string, fieldName: string) => {
    if (!key.trim()) return { isValid: true };
    return validateWireGuardKey(key, fieldName);
  };

  const handleDerivePublicKey = () => {
    if (!privateKey) {
      toast.error('Please enter a private key first');
      return;
    }
    try {
      const pub = derivePubKey(privateKey);
      setPublicKey(pub);
      toast.success('Public key derived successfully');
    } catch (error) {
      console.error(error);
      toast.error('Invalid private key');
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Key Generator</h2>

      <KeyField
        label="Private Key"
        value={privateKey}
        onChange={setPrivateKey}
        onGenerate={handleGenerateKeyPair}
        isSensitive
        validator={(value) => validateWireGuardKey(value, 'Private Key')}
      />

      <KeyField label="Public Key" value={publicKey} onChange={setPublicKey} readonly />

      <button
        onClick={handleDerivePublicKey}
        disabled={!privateKey}
        className="mb-6 w-full rounded-lg bg-zinc-800 py-2 text-sm transition hover:bg-zinc-700 disabled:opacity-50"
      >
        Derive Public Key from Private
      </button>

      <KeyField
        label="Pre-Shared Key (Optional)"
        value={presharedKey}
        onChange={setPresharedKey}
        onGenerate={handleGeneratePSK}
        isSensitive
        validator={(value) => validateOptionalWireGuardKey(value, 'Pre-Shared Key')}
      />

      <p className="mt-4 text-xs text-zinc-500">
        All keys are generated in your browser. Nothing is sent to any server.
      </p>
    </div>
  );
}
