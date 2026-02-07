// Exode LMS API Client
// API Documentation: https://docs.exode.biz

import {
  ExodeUser,
  ExodeAuthSession,
  ExodeFindUserParams,
  ExodeCreateUserParams,
  ExodeUpdateUserParams,
  ExportGenerateParams,
  ExportResult,
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

/**
 * Get user by ID to fetch their profile data including starsBalance
 */
export async function getUserById(userId: number): Promise<ExodeUser | null> {
  try {
    // Use login=id{userId} format to search by user ID
    const response = await fetch(`${EXODE_API_BASE}/user/find?login=id${userId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exode getUserById error:', errorText);
      throw new Error(`Failed to get user: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exode getUserById response:', JSON.stringify(data));
    if (data.payload?.user) {
      return data.payload.user as ExodeUser;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

/**
 * Get user's stars balance (overall points in Exode)
 */
export async function getUserStarsBalance(userId: number): Promise<number> {
  const user = await getUserById(userId);
  return user?.starsBalance || 0;
}

/**
 * Generate an export request for course progress data
 */
export async function generateExport(params: ExportGenerateParams): Promise<string> {
  // Map short format names to Exode API format values
  const formatMap: Record<string, string> = {
    'JSON': 'EXPORT_FORMAT_JSON',
    'CSV': 'EXPORT_FORMAT_CSV',
    'XLSX': 'EXPORT_FORMAT_XLSX',
  };
  const format = formatMap[params.format || 'JSON'] || 'EXPORT_FORMAT_JSON';

  const response = await fetch(`${EXODE_API_BASE}/query-export/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: params.type,
      format,
      variables: params.variables || {},
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Exode generateExport error:', errorText);
    throw new Error(`Failed to generate export: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Exode generateExport response:', JSON.stringify(data));
  // API returns { success, payload: { id: number, uuid: string } }
  // Use UUID for the result endpoint
  if (data.payload?.uuid) {
    return data.payload.uuid;
  }
  if (data.payload?.id) {
    return String(data.payload.id);
  }
  throw new Error('Export ID not returned from Exode API');
}

/**
 * Get the result of an export request
 */
export async function getExportResult(executionUuid: string): Promise<ExportResult> {
  // Use workflow-execution endpoint with UUID in path
  const response = await fetch(`${EXODE_API_BASE}/workflow-execution/${executionUuid}/result`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Exode getExportResult error:', errorText);
    throw new Error(`Failed to get export result: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Exode getExportResult response:', JSON.stringify(data));
  return {
    id: executionUuid,
    status: data.payload?.status || 'Pending',
    progress: data.payload?.completed, // "completed" is the progress field (0-100)
    result: data.payload?.result,
  };
}

/**
 * Poll for export completion and return result
 */
export async function waitForExport(exportId: string, maxAttempts = 30, delayMs = 2000): Promise<ExportResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getExportResult(exportId);

    if (result.status === 'Completed') {
      return result;
    }

    if (result.status === 'Failed') {
      throw new Error('Export failed');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('Export timed out');
}

/**
 * Get user's course points by fetching practice attempts and summing points
 */
export async function getUserCoursePoints(exodeUserId: number, courseId: number): Promise<number> {
  try {
    console.log(`Fetching course points for Exode user ${exodeUserId}, course ${courseId}`);

    // Generate export for user's practice attempts in the course
    const exportId = await generateExport({
      type: 'QUERY_EXPORT_TYPE_COURSE_LESSON_PRACTICE_ATTEMPT_FIND_MANY',
      format: 'JSON',
      variables: {
        filter: {
          userIds: [exodeUserId],
          courseIds: [courseId],
          statuses: ['Verified', 'AutoVerified'], // Only count verified attempts
        },
      },
    });

    console.log(`Export ID: ${exportId}`);

    // Wait for export to complete
    const result = await waitForExport(exportId);
    console.log(`Export result:`, JSON.stringify(result));

    // Check if we have a file URL to download
    if (result.result?.fileUrl) {
      console.log(`Downloading JSON from: ${result.result.fileUrl}`);
      const fileResponse = await fetch(result.result.fileUrl);
      if (!fileResponse.ok) {
        console.error(`Failed to download export file: ${fileResponse.status}`);
        return 0;
      }

      const data = await fileResponse.json();
      console.log(`Downloaded data:`, JSON.stringify(data));

      // The data should be an array of practice attempts
      // Use pointsAmount (numeric) not points (string like "13 / 26")
      if (Array.isArray(data)) {
        const totalPoints = data.reduce((total, row) => total + (row.pointsAmount || 0), 0);
        console.log(`Total points for user ${exodeUserId}: ${totalPoints}`);
        return totalPoints;
      }
    }

    console.log(`No data found for user ${exodeUserId}`);
    return 0;
  } catch (error) {
    console.error(`Error fetching course points for user ${exodeUserId}:`, error);
    return 0;
  }
}
