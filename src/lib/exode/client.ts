// Exode LMS API Client
// API Documentation: https://docs.exode.biz

import {
  ExodeUser,
  ExodeAuthSession,
  ExodeFindUserParams,
  ExodeCreateUserParams,
  ExodeUpdateUserParams,
} from './types';

const EXODE_API_BASE = 'https://api.exode.biz/saas/v2';

function getConfig() {
  const apiToken = process.env.EXODE_API_TOKEN;
  const sellerId = process.env.EXODE_SELLER_ID;
  const schoolId = process.env.EXODE_SCHOOL_ID;

  if (!apiToken || !sellerId || !schoolId) {
    throw new Error('Missing Exode configuration. Please set EXODE_API_TOKEN, EXODE_SELLER_ID, and EXODE_SCHOOL_ID environment variables.');
  }

  return { apiToken, sellerId, schoolId };
}

function getHeaders() {
  const { apiToken, sellerId, schoolId } = getConfig();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
    'Seller-Id': sellerId,
    'School-Id': schoolId,
  };
}

/**
 * Find an existing user in Exode by email, phone, Telegram ID, or external ID
 */
export async function findUser(params: ExodeFindUserParams): Promise<ExodeUser | null> {
  const queryParams = new URLSearchParams();

  // Use 'login' param for email/phone search
  if (params.email) queryParams.append('login', params.email);
  else if (params.phone) queryParams.append('login', params.phone);
  if (params.tgId) queryParams.append('tgId', params.tgId.toString());
  if (params.extId) queryParams.append('extId', params.extId);

  try {
    const response = await fetch(`${EXODE_API_BASE}/user/find?${queryParams.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exode findUser error:', errorText);
      throw new Error(`Failed to find user: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exode findUser response:', JSON.stringify(data));
    // API returns { success, payload: { user: {...} } }
    // When user not found, payload.user is null
    if (data.payload?.user) {
      return data.payload.user as ExodeUser;
    }
    return null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new user in Exode
 */
export async function createUser(params: ExodeCreateUserParams): Promise<ExodeUser> {
  const body: {
    email?: string;
    phone?: string;
    extId?: string;
    tgId?: number;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  } = {};

  if (params.email) body.email = params.email;
  if (params.phone) body.phone = params.phone;
  if (params.extId) body.extId = params.extId;
  if (params.tgId) body.tgId = params.tgId;

  // Use profile object for name fields
  if (params.name || params.surname) {
    body.profile = {};
    if (params.name) body.profile.firstName = params.name;
    if (params.surname) body.profile.lastName = params.surname;
  }

  const response = await fetch(`${EXODE_API_BASE}/user/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Exode createUser error:', errorText);
    throw new Error(`Failed to create user: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // API returns { success, payload: { user: {...} } }
  if (data.payload?.user) {
    return data.payload.user as ExodeUser;
  }
  return data as ExodeUser;
}

/**
 * Update an existing user in Exode using upsert endpoint
 */
export async function updateUser(userId: number, params: ExodeUpdateUserParams): Promise<ExodeUser> {
  // Use upsert endpoint with the user's existing data to update
  const body = {
    userId,
    ...params,
  };

  const response = await fetch(`${EXODE_API_BASE}/user/upsert`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Exode updateUser error:', errorText);
    throw new Error(`Failed to update user: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // API returns { success, payload: { user: {...} } }
  if (data.payload?.user) {
    return data.payload.user as ExodeUser;
  }
  return data as ExodeUser;
}

/**
 * Generate a JWT authentication token for auto-login
 */
export async function generateAuthToken(userId: number): Promise<ExodeAuthSession> {
  const body = {
    userId,
    forceCreate: false,
  };

  const response = await fetch(`${EXODE_API_BASE}/user/session/auth-token`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Exode generateAuthToken error:', errorText);
    throw new Error(`Failed to generate auth token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Exode generateAuthToken response:', JSON.stringify(data));
  // API might return { success, payload: { session: {...} } } or similar
  if (data.payload?.session) {
    return data.payload.session as ExodeAuthSession;
  }
  if (data.payload) {
    return data.payload as ExodeAuthSession;
  }
  return data as ExodeAuthSession;
}
