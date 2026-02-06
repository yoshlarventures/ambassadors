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
