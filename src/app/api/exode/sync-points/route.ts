import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserStarsBalance } from '@/lib/exode/client';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or regional leader
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!currentUser || !['admin', 'regional_leader'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use admin client to update all users
    const adminSupabase = createAdminClient();

    // Get all users with linked Exode accounts
    const { data: linkedUsers, error: fetchError } = await adminSupabase
      .from('users')
      .select('id, exode_user_id, full_name')
      .not('exode_user_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching linked users:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!linkedUsers || linkedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No linked users found',
        updated: 0,
      });
    }

    // Sync points for each user
    const results: { userId: string; name: string; points: number; error?: string }[] = [];

    for (const user of linkedUsers) {
      try {
        // Get user's stars balance (overall Exode points)
        const points = await getUserStarsBalance(user.exode_user_id!);

        // Update user's course points in database
        const { error: updateError } = await adminSupabase
          .from('users')
          .update({
            exode_course_points: points,
            exode_points_synced_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          results.push({
            userId: user.id,
            name: user.full_name,
            points: 0,
            error: updateError.message,
          });
        } else {
          results.push({
            userId: user.id,
            name: user.full_name,
            points,
          });
        }
      } catch (error) {
        results.push({
          userId: user.id,
          name: user.full_name,
          points: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => !r.error).length;
    const failCount = results.filter(r => r.error).length;

    return NextResponse.json({
      success: true,
      message: `Synced points for ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}`,
      updated: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error('Error syncing Exode points:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
