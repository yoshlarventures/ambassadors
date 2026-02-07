import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAuthToken, getUserStarsBalance } from '@/lib/exode/client';

const EXODE_SCHOOL_DOMAIN = process.env.NEXT_PUBLIC_EXODE_SCHOOL_DOMAIN || 'yoshlar.exode.biz';
const EXODE_DEFAULT_COURSE_ID = process.env.EXODE_DEFAULT_COURSE_ID || '1779';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user with exode_user_id
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, exode_user_id')
      .eq('id', authUser.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if account is linked
    if (!currentUser.exode_user_id) {
      return NextResponse.json(
        { error: 'Please link your Exode account first', requiresLink: true },
        { status: 400 }
      );
    }

    // Generate auth token from Exode
    const authSession = await generateAuthToken(currentUser.exode_user_id);

    // Auto-sync user's stars balance (don't await to avoid slowing down the response)
    getUserStarsBalance(currentUser.exode_user_id).then(async (starsBalance) => {
      try {
        await supabase
          .from('users')
          .update({
            exode_course_points: starsBalance,
            exode_points_synced_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);
        console.log(`Auto-synced ${starsBalance} points for user ${currentUser.id}`);
      } catch (err) {
        console.error('Failed to auto-sync points:', err);
      }
    });

    // Build iframe URL with auth token - open specific course page
    const coursePath = `/courses/1/${EXODE_DEFAULT_COURSE_ID}`;
    const iframeUrl = `https://${EXODE_SCHOOL_DOMAIN}${coursePath}?___uat=${authSession.token}`;

    return NextResponse.json({
      success: true,
      token: authSession.token,
      expireAt: authSession.expireAt,
      iframeUrl,
    });
  } catch (error) {
    console.error('Error generating Exode auth token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
