import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSocialSource } from '@/lib/social/normalize';

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
    const { platform, handle, url, groupId } = body;

    if (!platform || !groupId) {
      return NextResponse.json(
        { error: 'Missing platform or groupId' },
        { status: 400 }
      );
    }

    if (platform !== 'x' && platform !== 'reddit') {
      return NextResponse.json(
        { error: 'Invalid platform (use x or reddit)' },
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

    // Validate source
    const input = handle || url;

    if (!input) {
      return NextResponse.json(
        { error: 'Missing handle or url' },
        { status: 400 }
      );
    }

    const source = await validateSocialSource(platform, input);

    if (!source) {
      return NextResponse.json(
        { error: 'Invalid or not found' },
        { status: 404 }
      );
    }

    // Upsert source using Prisma
    const { data, error } = await supabase
      .from('SocialFeedSource')
      .upsert(
        {
          groupId,
          platform: source.platform,
          handle: source.handle,
          platformId: null, // Will be populated by background job
          addedById: user.id,
        },
        {
          onConflict: 'groupId_platform_handle',
        }
      );

    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // Log system event
    await supabase.from('SystemEvent').insert({
      groupId,
      userId: user.id,
      command: 'subscribe',
      args: { platform, handle: source.handle },
      status: 'ok',
    });

    return NextResponse.json({
      ok: true,
      source: data,
    });
  } catch (error: any) {
    console.error('Subscribe API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
