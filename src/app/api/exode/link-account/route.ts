import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { findUser, createUser } from '@/lib/exode/client';
import { SearchByType } from '@/lib/exode/types';

const linkAccountSchema = z.object({
  searchBy: z.enum(['email', 'phone', 'telegram']),
  value: z.string().optional(), // For custom phone/telegram input
  searchOnly: z.boolean().optional(), // Only search, don't create
  createIfNotFound: z.boolean().optional(), // Create if not found
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user with all relevant fields
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, email, phone, full_name, exode_user_id')
      .eq('id', authUser.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already linked
    if (currentUser.exode_user_id) {
      return NextResponse.json(
        { error: 'Account is already linked to Exode' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = linkAccountSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues;
      return NextResponse.json(
        { error: issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { searchBy, value, searchOnly, createIfNotFound } = validationResult.data;

    // Get the identifier value based on searchBy type
    let searchParams: { email?: string; phone?: string; tgId?: number } = {};
    let searchValue: string | undefined;

    switch (searchBy as SearchByType) {
      case 'email':
        if (!currentUser.email) {
          return NextResponse.json(
            { error: 'Your account does not have an email address' },
            { status: 400 }
          );
        }
        searchValue = currentUser.email;
        searchParams = { email: searchValue };
        break;

      case 'phone':
        // Use provided value or fallback to user's phone
        searchValue = value || currentUser.phone || undefined;
        if (!searchValue) {
          return NextResponse.json(
            { error: 'Please enter a phone number' },
            { status: 400 }
          );
        }
        searchParams = { phone: searchValue };
        break;

      case 'telegram':
        // Telegram ID from custom input
        searchValue = value;
        if (!searchValue) {
          return NextResponse.json(
            { error: 'Please enter a Telegram ID' },
            { status: 400 }
          );
        }
        // Check if it's a numeric ID or username
        const tgId = parseInt(searchValue.replace('@', ''), 10);
        if (!isNaN(tgId)) {
          searchParams = { tgId };
        } else {
          // For username, we might need different handling
          // For now, try as extId or return error
          return NextResponse.json(
            { error: 'Please enter a numeric Telegram ID (not username)' },
            { status: 400 }
          );
        }
        break;
    }

    // Try to find existing Exode user
    let exodeUser = await findUser(searchParams);

    if (exodeUser) {
      // User exists in Exode - just save their ID in our database to link accounts
      // (No need to update Exode user - linking is one-way)
      console.log('Found Exode user:', exodeUser.id, 'Saving to user:', currentUser.id);

      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          exode_user_id: exodeUser.id,
          exode_linked_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)
        .select('id, exode_user_id');

      console.log('Update result:', { updateData, updateError });

      if (updateError) {
        console.error('Error updating user with exode_user_id:', updateError);
        return NextResponse.json(
          { error: 'Failed to save Exode link' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        linked: true,
        exodeUserId: exodeUser.id,
        isNewAccount: false,
      });
    }

    // User not found in Exode
    if (searchOnly) {
      // Return not found status so user can try another method
      return NextResponse.json(
        { notFound: true, message: `No account found with this ${searchBy}` },
        { status: 404 }
      );
    }

    if (!createIfNotFound) {
      // Default behavior when neither flag is set - don't auto-create
      return NextResponse.json(
        { notFound: true, message: `No account found with this ${searchBy}` },
        { status: 404 }
      );
    }

    // Create new account in Exode
    const nameParts = currentUser.full_name?.split(' ') || ['User'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || undefined;

    const createParams: {
      email?: string;
      phone?: string;
      name?: string;
      surname?: string;
      extId: string;
      tgId?: number;
    } = {
      name: firstName,
      surname: lastName,
      extId: currentUser.id,
    };

    // Add the identifier used for search
    if (searchBy === 'email' && currentUser.email) {
      createParams.email = currentUser.email;
    }
    if (searchBy === 'phone' && searchValue) {
      createParams.phone = searchValue;
    }
    if (searchBy === 'telegram' && searchParams.tgId) {
      createParams.tgId = searchParams.tgId;
    }

    // Also add email if available (good to have for account)
    if (!createParams.email && currentUser.email) {
      createParams.email = currentUser.email;
    }

    try {
      exodeUser = await createUser(createParams);
    } catch (createError) {
      // If extId is already in use, find and link to the existing account
      if (createError instanceof Error && createError.message.includes('ExtIdIsBusy')) {
        console.log('ExtId already in use, searching for existing account...');
        exodeUser = await findUser({ extId: currentUser.id });

        if (!exodeUser) {
          return NextResponse.json(
            { error: 'Account creation failed: external ID conflict' },
            { status: 400 }
          );
        }
        console.log('Found existing Exode account by extId:', exodeUser.id);
      } else {
        throw createError;
      }
    }

    // Save exode_user_id in our database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        exode_user_id: exodeUser.id,
        exode_linked_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id);

    if (updateError) {
      console.error('Error updating user with exode_user_id:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Exode link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      linked: true,
      exodeUserId: exodeUser.id,
      isNewAccount: true,
    });
  } catch (error) {
    console.error('Error linking Exode account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
