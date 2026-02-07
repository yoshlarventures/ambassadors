// Exode LMS API Types

export interface ExodeUser {
  id: number;
  uuid: string;
  email?: string;
  phone?: string;
  tgId?: number;
  extId?: string;
  active: boolean;
  name?: string;
  surname?: string;
  starsBalance?: number; // User's overall stars/points balance
}

export interface ExodeAuthSession {
  token: string;
  expireAt: string;
}

export interface ExodeFindUserParams {
  email?: string;
  phone?: string;
  tgId?: number;
  extId?: string;
}

export interface ExodeCreateUserParams {
  email?: string;
  phone?: string;
  name?: string;
  surname?: string;
  extId?: string;
  tgId?: number;
}

export interface ExodeUpdateUserParams {
  extId?: string;
  email?: string;
  phone?: string;
  name?: string;
  surname?: string;
}

export interface ExodeApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type SearchByType = 'email' | 'phone' | 'telegram';

// Export API types
export type ExportType =
  | 'QUERY_EXPORT_TYPE_GROUP_MEMBER_FIND_MANY'
  | 'QUERY_EXPORT_TYPE_COURSE_LESSON_PRACTICE_ATTEMPT_FIND_MANY';

export interface ExportGenerateParams {
  type: ExportType;
  format?: 'XLSX' | 'CSV' | 'JSON';
  variables?: {
    filter?: {
      courseIds?: number[];
      userIds?: number[];
      productIds?: number[];
      groupIds?: number[];
      lessonIds?: number[];
      statuses?: string[];
    };
    sort?: {
      field?: string;
      order?: 'ASC' | 'DESC';
    };
  };
}

export interface ExportResult {
  id: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  progress?: number;
  result?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    data?: PracticeAttemptExportRow[];
  };
}

export interface PracticeAttemptExportRow {
  studentName: string;
  phone: string;
  userId: number;
  course: string;
  lesson: string;
  attemptNumber: number;
  status: string;
  correctnessPercent: number;
  points: number;
  deadlineStatus: string;
  curator: string;
  reviewSubmittedAt: string;
  createdAt: string;
  updatedAt: string;
}
