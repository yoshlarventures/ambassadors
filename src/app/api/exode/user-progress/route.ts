import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateExport, waitForExport } from '@/lib/exode/client';

const EXODE_DEFAULT_COURSE_ID = parseInt(process.env.EXODE_DEFAULT_COURSE_ID || '1779', 10);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or regional leader
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, region_id')
      .eq('id', authUser.id)
      .single();

    if (!currentUser || !['admin', 'regional_leader'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get exode_user_id from query params
    const searchParams = request.nextUrl.searchParams;
    const exodeUserId = searchParams.get('exodeUserId');

    if (!exodeUserId) {
      return NextResponse.json({ error: 'exodeUserId is required' }, { status: 400 });
    }

    // Fetch practice attempts for this user
    const exportId = await generateExport({
      type: 'QUERY_EXPORT_TYPE_COURSE_LESSON_PRACTICE_ATTEMPT_FIND_MANY',
      format: 'JSON',
      variables: {
        filter: {
          userIds: [parseInt(exodeUserId, 10)],
          courseIds: [EXODE_DEFAULT_COURSE_ID],
        },
      },
    });

    const result = await waitForExport(exportId, 30, 1000);

    if (result.result?.fileUrl) {
      const fileResponse = await fetch(result.result.fileUrl);
      if (!fileResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 });
      }

      const data = await fileResponse.json();
      return NextResponse.json({
        success: true,
        attempts: Array.isArray(data) ? data : [],
      });
    }

    return NextResponse.json({
      success: true,
      attempts: [],
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
