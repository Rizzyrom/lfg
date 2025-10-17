import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeCommand } from '@/lib/commands/exec';

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
    const { text, groupId, messageId } = body;

    if (!text || !groupId) {
      return NextResponse.json(
        { error: 'Missing text or groupId' },
        { status: 400 }
      );
    }

    // Verify group membership
    const { data: membership } = await supabase
      .from('group_member')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    // Execute command
    const result = await executeCommand({
      groupId,
      userId: user.id,
      messageId,
      raw: text,
    });

    return NextResponse.json({
      status: result.status,
      systemMessage: {
        type: 'system',
        content: result.message,
        detail: result.detail,
        data: result.data,
      },
    });
  } catch (error: any) {
    console.error('Command API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
