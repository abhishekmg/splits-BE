export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Invitation {
  id: string;
  group_id: string;
  invited_by: string;
  invited_email: string;
  invited_user_id: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  description: string;
  amount: number;
  currency: string;
  split_type: 'equal' | 'percentage' | 'exact';
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  owed_amount: number;
  percentage: number | null;
}

export interface Settlement {
  id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  currency: string;
  note: string | null;
  created_at: string;
}
