import { useEffect } from 'react';
import { detectSocialLinks } from '@/lib/social/normalize';

interface AutoSubscribeOptions {
  groupId: string;
  onSubscribed?: (platform: string, handle: string) => void;
}

/**
 * Hook to automatically detect and subscribe to X/Reddit links in messages
 */
export function useSocialAutoSubscribe(
  message: string,
  options: AutoSubscribeOptions
) {
  const { groupId, onSubscribed } = options;

  useEffect(() => {
    if (!message.trim()) return;

    const subscribeToSources = async () => {
      try {
        const sources = await detectSocialLinks(message);

        for (const source of sources) {
          // Call subscribe API
          const res = await fetch('/api/social/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: source.platform,
              handle: source.handle,
              url: source.url,
              groupId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (onSubscribed && data.source) {
              onSubscribed(source.platform, source.handle);
            }
          }
        }
      } catch (error) {
        console.error('Auto-subscribe failed:', error);
      }
    };

    // Only run if message contains potential social links
    if (
      message.includes('twitter.com') ||
      message.includes('x.com') ||
      message.includes('reddit.com') ||
      message.includes('@') ||
      message.includes('r/')
    ) {
      subscribeToSources();
    }
  }, [message, groupId, onSubscribed]);
}

/**
 * Client-side version for immediate UI feedback
 */
export async function autoSubscribeToSocialLinks(
  message: string,
  groupId: string
): Promise<{ platform: string; handle: string }[]> {
  try {
    const sources = await detectSocialLinks(message);
    const subscribed: { platform: string; handle: string }[] = [];

    for (const source of sources) {
      const res = await fetch('/api/social/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: source.platform,
          handle: source.handle,
          url: source.url,
          groupId,
        }),
      });

      if (res.ok) {
        subscribed.push({
          platform: source.platform,
          handle: source.handle,
        });
      }
    }

    return subscribed;
  } catch (error) {
    console.error('Auto-subscribe failed:', error);
    return [];
  }
}
