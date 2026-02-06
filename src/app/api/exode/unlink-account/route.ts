import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear exode_user_id from user's profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        exode_user_id: null,
        exode_linked_at: null,
      })
      .eq('id', authUser.id);

    if (updateError) {
      console.error('Error unlinking Exode account:', updateError);
      return NextResponse.json(
        { error: 'Failed to unlink account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      unlinked: true,
    });
  } catch (error) {
    console.error('Error unlinking Exode account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
