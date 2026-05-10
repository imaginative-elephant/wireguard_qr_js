import { useState } from 'react';
import { KeyField } from './KeyField';
import { generateKeyPair, generatePresharedKey, derivePubKey } from '../utils/crypto';
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
      toast.error('Failed to generate PSK');
    }
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
      toast.error('Invalid private key');
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-semibold mb-6 text-white">Key Generator</h2>

      <KeyField
        label="Private Key"
        value={privateKey}
        onChange={setPrivateKey}
        onGenerate={handleGenerateKeyPair}
      />

      <KeyField
        label="Public Key"
        value={publicKey}
        onChange={setPublicKey}
        readonly
      />

      <button
        onClick={handleDerivePublicKey}
        disabled={!privateKey}
        className="w-full mb-6 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition rounded-lg"
      >
        Derive Public Key from Private
      </button>

      <KeyField
        label="Pre-Shared Key (Optional)"
        value={presharedKey}
        onChange={setPresharedKey}
        onGenerate={handleGeneratePSK}
      />

      <p className="text-xs text-zinc-500 mt-4">
        All keys are generated in your browser. Nothing is sent to any server.
      </p>
    </div>
  );
}