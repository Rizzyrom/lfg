'use client';

import { useState, useCallback } from 'react';
import Message from './Message';
import AttachmentTagMenu from './AttachmentTagMenu';

interface EnhancedMessageProps {
  id: string;
  username: string;
  ciphertext: string;
  mediaPtr?: string | null;
  timestamp: string;
  isOwn: boolean;
  currentUserId?: string;
  groupId: string;
  reactions?: any[];
  replyTo?: any;
  onReply?: (message: { id: string; username: string; ciphertext: string }) => void;
}

export default function EnhancedMessage(props: EnhancedMessageProps) {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tag, setTag] = useState<'$' | '#' | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Long press handlers for attachment tagging
  const handleAttachmentTouchStart = useCallback((e: React.TouchEvent) => {
    if (!props.mediaPtr) return;

    const timer = setTimeout(() => {
      setShowTagMenu(true);
    }, 700); // 0.7 second long press
    setLongPressTimer(timer);
  }, [props.mediaPtr]);

  const handleAttachmentTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Context menu for desktop
  const handleAttachmentContextMenu = useCallback((e: React.MouseEvent) => {
    if (!props.mediaPtr) return;
    e.preventDefault();
    setShowTagMenu(true);
  }, [props.mediaPtr]);

  const handleTagged = useCallback((newTag: '$' | '#') => {
    setTag(newTag);
    setShowTagMenu(false);
  }, []);

  return (
    <div className="relative">
      {/* Render original message */}
      <div
        onTouchStart={props.mediaPtr ? handleAttachmentTouchStart : undefined}
        onTouchEnd={props.mediaPtr ? handleAttachmentTouchEnd : undefined}
        onTouchMove={props.mediaPtr ? handleAttachmentTouchEnd : undefined}
        onContextMenu={props.mediaPtr ? handleAttachmentContextMenu : undefined}
      >
        <Message {...props} />
      </div>

      {/* Tag chip (if tagged) */}
      {tag && (
        <div className="ml-4 mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-tv-chip border border-tv-grid">
          <span>{tag}</span>
          <span>{tag === '$' ? 'Market' : 'News'}</span>
        </div>
      )}

      {/* Tag menu (shows on long press) */}
      {showTagMenu && (
        <>
          {/* Click-away overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTagMenu(false)}
            onTouchStart={() => setShowTagMenu(false)}
          />

          {/* Tag menu */}
          <div className="absolute top-0 left-0 z-50 animate-fade-in">
            <AttachmentTagMenu
              messageId={props.id}
              groupId={props.groupId}
              onTagged={handleTagged}
            />
          </div>
        </>
      )}
    </div>
  );
}
