'use client';

import { useState } from 'react';

interface AttachmentTagMenuProps {
  messageId: string;
  groupId: string;
  onTagged?: (tag: '$' | '#') => void;
}

export default function AttachmentTagMenu({
  messageId,
  groupId,
  onTagged,
}: AttachmentTagMenuProps) {
  const [isTagging, setIsTagging] = useState(false);

  const handleTag = async (tag: '$' | '#') => {
    setIsTagging(true);

    try {
      const res = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tag',
          messageId,
          tag,
          groupId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (onTagged) {
          onTagged(tag);
        }
        // Show success toast
        console.log(`Tagged as ${data.category}`);
      } else {
        console.error('Failed to tag message');
      }
    } catch (error) {
      console.error('Failed to tag:', error);
    } finally {
      setIsTagging(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-tv-panel border border-tv-grid rounded-lg px-2 py-1 shadow-lg">
      <button
        onClick={() => handleTag('$')}
        disabled={isTagging}
        className="flex items-center gap-1.5 px-3 py-2 rounded bg-tv-chip hover:bg-tv-hover active:scale-95 transition-all disabled:opacity-50 min-h-[44px] min-w-[44px] touch-manipulation"
        type="button"
        title="Tag as Market"
      >
        <span className="text-xl">$</span>
        <span className="text-xs font-medium">Market</span>
      </button>

      <button
        onClick={() => handleTag('#')}
        disabled={isTagging}
        className="flex items-center gap-1.5 px-3 py-2 rounded bg-tv-chip hover:bg-tv-hover active:scale-95 transition-all disabled:opacity-50 min-h-[44px] min-w-[44px] touch-manipulation"
        type="button"
        title="Tag as News"
      >
        <span className="text-xl">#</span>
        <span className="text-xs font-medium">News</span>
      </button>
    </div>
  );
}
