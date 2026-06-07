import { useRef, useEffect, memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import { KeyField } from './KeyField';
import { ValidatedInput } from './ValidatedInput';
import { Card } from './Card';
import toast from 'react-hot-toast';
import type { Peer } from '../types/wireguard';
import type { ConfigFormData } from '../utils/validationSchema';

interface PeerSectionProps {
  clearClipboardAfterCopy: boolean;
  onGeneratePresharedKeyForPeer: (index: number) => void;
  defaultPeer: Peer;
}

export const PeerSection = memo(function PeerSection({
  clearClipboardAfterCopy,
  onGeneratePresharedKeyForPeer,
  defaultPeer,
}: PeerSectionProps) {
  const {
    control,
    trigger,
    formState: { errors },
  } = useFormContext<ConfigFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'peers',
  });

  const latestPeerRef = useRef<HTMLDivElement>(null);
  const prevPeerCountRef = useRef(fields.length);

  // Auto-focus first input of newly added peer
  useEffect(() => {
    if (fields.length > prevPeerCountRef.current) {
      // New peer was added
      setTimeout(() => {
        if (latestPeerRef.current) {
          const firstInput = latestPeerRef.current.querySelector('input');
          firstInput?.focus();
        }
      }, 80);
    }
    prevPeerCountRef.current = fields.length;
  }, [fields.length]);

  const addPeer = () => {
    const newPeer: Peer = {
      ...defaultPeer,
      id: (fields.length + 1).toString(),
    };
    append(newPeer, { shouldFocus: true });
    toast.success('Peer added');
  };

  const removePeer = (index: number) => {
    if (fields.length === 1) return toast.error('Must have at least one peer');
    remove(index);
    toast.success('Peer removed');
  };

  // ====================== Button Styles ======================
  // base styles for all buttons
  const buttonBase =
    'active:scale-[0.985] transition-all duration-200 ' +
    //accessibility focus styles
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950';

  // === Large / Special Buttons ===
  const largeButtonBase = `${buttonBase} w-full rounded-3xl font-semibold text-white focus-visible:ring-blue-400`;

  const addPeerButton = `${largeButtonBase} hidden md:block border border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-emerald-700 py-5 text-lg shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl`;

  // === Mobile Floating Action Button (Standalone) ===
  const addPeerButtonMobile =
    'fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/50 transition-all duration-200 hover:bg-emerald-500 active:scale-95 md:hidden';

  return (
    <div className="space-y-8">
      {fields.map((field, index) => (
        <Card key={field.id} ref={index === fields.length - 1 ? latestPeerRef : null}>
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 md:h-10 md:w-10">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tighter text-white md:text-3xl">
                Peer {index + 1}
              </h2>
            </div>

            {fields.length > 1 && (
              <button
                onClick={() => removePeer(index)}
                className="rounded-2xl p-3 text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 active:scale-95"
                title="Remove peer"
                aria-label="Remove peer"
              >
                <Trash2 size={22} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="space-y-8">
            {/* Peer Public Key */}
            <Controller
              control={control}
              name={`peers.${index}.publicKey`}
              render={({ field: peerField }) => (
                <KeyField
                  label="Peer Public Key"
                  value={peerField.value || ''}
                  onChange={peerField.onChange}
                  onBlur={peerField.onBlur}
                  onFocus={() => trigger(`peers.${index}.publicKey`)}
                  error={errors.peers?.[index]?.publicKey?.message}
                  defaultHidden={false}
                  clearClipboardAfterCopy={clearClipboardAfterCopy}
                />
              )}
            />

            {/* Pre-Shared Key */}
            <Controller
              control={control}
              name={`peers.${index}.presharedKey`}
              render={({ field: peerField }) => (
                <KeyField
                  label="Pre-Shared Key (optional)"
                  value={peerField.value || ''}
                  onChange={peerField.onChange}
                  onBlur={peerField.onBlur}
                  onFocus={() => trigger(`peers.${index}.presharedKey`)}
                  onGenerate={() => onGeneratePresharedKeyForPeer(index)}
                  generateButtonText="Generate PSK"
                  isSensitive
                  defaultHidden={true}
                  error={errors.peers?.[index]?.presharedKey?.message}
                  clearClipboardAfterCopy={clearClipboardAfterCopy}
                />
              )}
            />
            {/* Endpoint */}
            <Controller
              control={control}
              name={`peers.${index}.endpoint`}
              render={({ field: peerField }) => (
                <ValidatedInput
                  label="Endpoint (optional)"
                  value={peerField.value || ''}
                  onChange={peerField.onChange}
                  onBlur={peerField.onBlur}
                  onFocus={() => trigger(`peers.${index}.endpoint`)}
                  error={errors.peers?.[index]?.endpoint?.message}
                  placeholder="vpn.example.com:51820"
                />
              )}
            />
            {/* Allowed IPs */}
            <Controller
              control={control}
              name={`peers.${index}.allowedIPs`}
              render={({ field: peerField }) => (
                <ValidatedInput
                  label="Allowed IPs"
                  value={peerField.value || ''}
                  onChange={peerField.onChange}
                  onBlur={peerField.onBlur}
                  onFocus={() => trigger(`peers.${index}.allowedIPs`)}
                  error={errors.peers?.[index]?.allowedIPs?.message}
                  placeholder="0.0.0.0/0, ::/0"
                />
              )}
            />

            {/* Persistent Keepalive */}
            <Controller
              control={control}
              name={`peers.${index}.persistentKeepalive`}
              render={({ field: peerField }) => (
                <ValidatedInput
                  label="Persistent Keepalive (optional)"
                  value={peerField.value || ''}
                  onChange={peerField.onChange}
                  onBlur={peerField.onBlur}
                  onFocus={() => trigger(`peers.${index}.persistentKeepalive`)}
                  error={errors.peers?.[index]?.persistentKeepalive?.message}
                  placeholder=""
                  type="number"
                />
              )}
            />

            {/* Comment */}
            <Controller
              control={control}
              name={`peers.${index}.comment`}
              render={({ field: peerField }) => (
                <ValidatedInput
                  label="Comment / Friendly Name (optional)"
                  value={peerField.value || ''}
                  onChange={peerField.onChange}
                  onBlur={peerField.onBlur}
                  onFocus={() => trigger(`peers.${index}.comment`)}
                  error={errors.peers?.[index]?.comment?.message}
                  placeholder={`Peer ${index + 1}`}
                />
              )}
            />
          </div>
        </Card>
      ))}

      {/* Desktop Add Peer Button */}
      <button
        onClick={addPeer}
        className={addPeerButton}
        title="Add another peer"
        aria-label="Add new peer"
      >
        <Plus size={24} aria-hidden="true" className="mr-3 inline" />
        Add Another Peer
      </button>
      {/* Mobile Floating Add Peer Button */}
      <button
        onClick={addPeer}
        className={addPeerButtonMobile}
        aria-label="Add new peer"
        title="Add another peer"
      >
        <Plus size={28} strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  );
});
