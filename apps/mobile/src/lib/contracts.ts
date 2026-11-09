export const CONTRACT_VERSION = 'v1' as const;

export type EdgeErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'AI_UNAVAILABLE'
  | 'EMAIL_UNAVAILABLE';

export interface CreateDemoAccountRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreateDemoAccountSuccess {
  id: string;
  password: string;
}

export interface EdgeErrorResponse {
  code: EdgeErrorCode;
}
