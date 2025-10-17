import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, messageId, tag, groupId } = body;

    if (!action || !messageId) {
      return NextResponse.json(
        { error: 'Missing action or messageId' },
        { status: 400 }
      );
    }

    // Get message to verify group membership
    const { data: message } = await supabase
      .from('msg')
      .select('group_id, content, attachments')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const messageGroupId = groupId || message.group_id;

    // Verify group membership
    const { data: membership } = await supabase
      .from('group_member')
      .select('role')
      .eq('group_id', messageGroupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    // Handle tag action
    if (action === 'tag') {
      if (!tag || (tag !== '$' && tag !== '#')) {
        return NextResponse.json(
          { error: 'Invalid tag (use $ or #)' },
          { status: 400 }
        );
      }

      const category = tag === '$' ? 'market' : 'news';

      // Update message with tag metadata (store in a tags JSONB column if exists)
      // For now, we'll create a snapshot to feed
      const title =
        category === 'market'
          ? `Market Note - ${new Date().toLocaleDateString()}`
          : `News Item - ${new Date().toLocaleDateString()}`;

      const { error: feedError } = await supabase
        .from('public_feed_item')
        .insert({
          title,
          text: message.content,
          category,
          source: 'chat_tagged_message',
          group_id: messageGroupId,
          link: message.attachments?.[0] || null,
          created_at: new Date().toISOString(),
        });

      if (feedError) {
        return NextResponse.json(
          { error: 'Failed to tag message' },
          { status: 500 }
        );
      }

      // Log system event
      await supabase.from('system_event').insert({
        group_id: messageGroupId,
        user_id: user.id,
        command: 'tag',
        args: { messageId, tag, category },
        status: 'ok',
      });

      return NextResponse.json({
        ok: true,
        tag,
        category,
        message: `Tagged as ${category}`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Chat action API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
