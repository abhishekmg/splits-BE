import { SplitType, InvitationStatus } from './enums';

// Auth
export interface SignupRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    display_name: string | null;
  };
  access_token: string;
  refresh_token: string;
}

// Groups
export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

// Invitations
export interface SendInvitationRequest {
  group_id: string;
  email: string;
}

export interface RespondInvitationRequest {
  status: 'accepted' | 'declined';
}

// Expenses
export interface SplitDetail {
  user_id: string;
  amount?: number;       // For exact splits
  percentage?: number;   // For percentage splits
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  currency: string;
  split_type: SplitType;
  splits: SplitDetail[];
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  currency?: string;
  split_type?: SplitType;
  splits?: SplitDetail[];
}

// Settlements
export interface CreateSettlementRequest {
  paid_to: string;
  amount: number;
  currency: string;
  note?: string;
}

// Balances
export interface BalanceEntry {
  user_id: string;
  email: string;
  display_name: string | null;
  amount: number;
  currency: string;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  limit: number;
  offset: number;
}

// Standard API response
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
