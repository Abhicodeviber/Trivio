'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ChatWindow = dynamic(() => import('./ChatWindow'), { ssr: false });

interface Props {
  targetUserId: string;
  targetRole: 'vendor' | 'provider';
  targetName: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ChatButton({ targetUserId, targetRole, targetName, className, style }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={className ?? 'btn btn-outline btn-sm'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}
        onClick={() => setOpen(true)}
      >
        💬 Chat
      </button>

      {open && (
        <ChatWindow
          targetUserId={targetUserId}
          targetRole={targetRole}
          targetName={targetName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
