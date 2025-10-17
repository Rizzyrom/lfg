import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleAgentQuestion } from '@/lib/agent/handler';

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
    const { question, groupId } = body;

    if (!question || !groupId) {
      return NextResponse.json(
        { error: 'Missing question or groupId' },
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

    // Call agent handler
    const response = await handleAgentQuestion({
      question,
      groupId,
      userId: user.id,
    });

    // Log system event
    await supabase.from('system_event').insert({
      group_id: groupId,
      user_id: user.id,
      command: 'ask',
      args: { question },
      status: 'ok',
    });

    return NextResponse.json({
      answer: response.answer,
      sources: response.sources,
    });
  } catch (error: any) {
    console.error('Agent ask API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
