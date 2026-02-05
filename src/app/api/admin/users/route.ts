import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['regional_leader', 'ambassador']),
  region_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues;
      return NextResponse.json(
        { error: issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email, full_name, password, role, region_id } = validationResult.data;

    // Use admin client to create the user
    const adminClient = createAdminClient();

    // Check if user already exists
    const { data: existingUsers } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Create the auth user with email confirmed
    const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!newAuthUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Update the user's role and region in the users table
    // The database trigger should have already created the user row
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        role,
        region_id: region_id || null,
        full_name, // Ensure full_name is set correctly
      })
      .eq('id', newAuthUser.user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // Try to clean up the auth user if we couldn't update the profile
      await adminClient.auth.admin.deleteUser(newAuthUser.user.id);
      return NextResponse.json(
        { error: 'Failed to set user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newAuthUser.user.id,
        email: newAuthUser.user.email,
        full_name,
        role,
        region_id,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
