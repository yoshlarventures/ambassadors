import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admin can delete clubs
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete clubs' },
        { status: 403 }
      );
    }

    // Get club name for logging
    const { data: club } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', clubId)
      .single();

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Delete the club (cascades to club_ambassadors, club_members, etc.)
    const { error: deleteError } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);

    if (deleteError) {
      console.error('Error deleting club:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Club "${club.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const updateClubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters').optional(),
  ambassador_ids: z.array(z.string().uuid('Invalid ambassador ID')).min(1, 'At least one ambassador is required').optional(),
  region_id: z.string().uuid('Invalid region ID').optional(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
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

    // Only admin and regional_leader can update clubs
    if (currentUser.role !== 'admin' && currentUser.role !== 'regional_leader') {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Regional Leader access required' },
        { status: 403 }
      );
    }

    // Get the existing club
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Regional leader can only update clubs in their region
    if (currentUser.role === 'regional_leader') {
      if (!currentUser.region_id) {
        return NextResponse.json(
          { error: 'You must be assigned to a region to update clubs' },
          { status: 403 }
        );
      }

      if (existingClub.region_id !== currentUser.region_id) {
        return NextResponse.json(
          { error: 'You can only update clubs in your assigned region' },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateClubSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues;
      return NextResponse.json(
        { error: issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, ambassador_ids, region_id, description, address } = validationResult.data;

    // If changing region, regional leader cannot change to a different region
    if (region_id && currentUser.role === 'regional_leader' && region_id !== currentUser.region_id) {
      return NextResponse.json(
        { error: 'You can only set clubs to your assigned region' },
        { status: 403 }
      );
    }

    // If changing ambassadors, validate and update
    if (ambassador_ids) {
      // Get current ambassadors for this club
      const { data: currentAssignments } = await supabase
        .from('club_ambassadors')
        .select('ambassador_id')
        .eq('club_id', clubId);

      const currentAmbassadorIds = new Set(
        (currentAssignments || []).map((a) => a.ambassador_id)
      );

      // For regional leader: verify all new ambassadors are in their region
      const newAmbassadorIds = ambassador_ids.filter(
        (id) => !currentAmbassadorIds.has(id)
      );
      if (currentUser.role === 'regional_leader' && newAmbassadorIds.length > 0) {
        const { data: ambassadors } = await supabase
          .from('users')
          .select('id, region_id, role')
          .in('id', newAmbassadorIds);

        if (!ambassadors || ambassadors.length !== newAmbassadorIds.length) {
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

      // Delete existing ambassadors and insert new ones
      const { error: deleteError } = await supabase
        .from('club_ambassadors')
        .delete()
        .eq('club_id', clubId);

      if (deleteError) {
        console.error('Error removing old ambassadors:', deleteError);
        return NextResponse.json(
          { error: deleteError.message },
          { status: 400 }
        );
      }

      // All ambassadors have equal control
      const ambassadorEntries = ambassador_ids.map((ambassador_id) => ({
        club_id: clubId,
        ambassador_id,
        is_primary: false,
      }));

      const { error: insertError } = await supabase
        .from('club_ambassadors')
        .insert(ambassadorEntries);

      if (insertError) {
        console.error('Error adding new ambassadors:', insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (region_id !== undefined) updateData.region_id = region_id;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;

    // Only update club if there are fields to update
    let club = existingClub;
    if (Object.keys(updateData).length > 0) {
      const { data: updatedClub, error: updateError } = await supabase
        .from('clubs')
        .update(updateData)
        .eq('id', clubId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating club:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
      club = updatedClub;
    }

    // Log the activity
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (name !== undefined && name !== existingClub.name) {
      changes.name = { from: existingClub.name, to: name };
    }
    if (region_id !== undefined && region_id !== existingClub.region_id) {
      changes.region_id = { from: existingClub.region_id, to: region_id };
    }
    if (description !== undefined && description !== existingClub.description) {
      changes.description = { from: existingClub.description, to: description };
    }
    if (address !== undefined && address !== existingClub.address) {
      changes.address = { from: existingClub.address, to: address };
    }
    if (ambassador_ids) {
      changes.ambassadors = { from: 'previous', to: ambassador_ids };
    }

    if (Object.keys(changes).length > 0) {
      await supabase.from('club_activity_log').insert({
        club_id: clubId,
        user_id: authUser.id,
        action: 'updated',
        details: changes,
      });
    }

    return NextResponse.json({
      success: true,
      club,
    });
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
