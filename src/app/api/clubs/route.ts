import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createClubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  ambassador_ids: z.array(z.string().uuid('Invalid ambassador ID')).min(1, 'At least one ambassador is required'),
  region_id: z.string().uuid('Invalid region ID'),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user with role and region
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, region_id')
      .eq('id', authUser.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admin and regional_leader can create clubs
    if (currentUser.role !== 'admin' && currentUser.role !== 'regional_leader') {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Regional Leader access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createClubSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues;
      return NextResponse.json(
        { error: issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, ambassador_ids, region_id, description, address } = validationResult.data;

    // Regional leader can only create clubs in their region
    if (currentUser.role === 'regional_leader') {
      if (!currentUser.region_id) {
        return NextResponse.json(
          { error: 'You must be assigned to a region to create clubs' },
          { status: 403 }
        );
      }

      if (region_id !== currentUser.region_id) {
        return NextResponse.json(
          { error: 'You can only create clubs in your assigned region' },
          { status: 403 }
        );
      }

      // Verify all ambassadors belong to the same region and are actually ambassadors
      const { data: ambassadors } = await supabase
        .from('users')
        .select('id, region_id, role')
        .in('id', ambassador_ids);

      if (!ambassadors || ambassadors.length !== ambassador_ids.length) {
        return NextResponse.json(
          { error: 'One or more ambassadors not found' },
          { status: 404 }
        );
      }

      for (const amb of ambassadors) {
        if (amb.role !== 'ambassador') {
          return NextResponse.json(
            { error: 'One or more selected users are not ambassadors' },
            { status: 400 }
          );
        }
        if (amb.region_id !== currentUser.region_id) {
          return NextResponse.json(
            { error: 'All ambassadors must be in your region' },
            { status: 403 }
          );
        }
      }
    }

    // Create the club
    const { data: club, error: createError } = await supabase
      .from('clubs')
      .insert({
        name,
        region_id,
        description: description || null,
        address: address || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating club:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    // Create club_ambassadors entries (all ambassadors have equal control)
    const ambassadorEntries = ambassador_ids.map((ambassador_id) => ({
      club_id: club.id,
      ambassador_id,
      is_primary: false,
    }));

    const { error: ambassadorError } = await supabase
      .from('club_ambassadors')
      .insert(ambassadorEntries);

    if (ambassadorError) {
      // Rollback: delete the club if we couldn't add ambassadors
      await supabase.from('clubs').delete().eq('id', club.id);
      console.error('Error adding ambassadors:', ambassadorError);
      return NextResponse.json(
        { error: ambassadorError.message },
        { status: 400 }
      );
    }

    // Log the activity
    await supabase.from('club_activity_log').insert({
      club_id: club.id,
      user_id: authUser.id,
      action: 'created',
      details: {
        name,
        region_id,
        description: description || null,
        address: address || null,
        ambassador_ids,
      },
    });

    return NextResponse.json({
      success: true,
      club,
    });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
