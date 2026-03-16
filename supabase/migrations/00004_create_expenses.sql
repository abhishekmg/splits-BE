-- Expenses
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by uuid NOT NULL REFERENCES profiles(id),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  split_type text NOT NULL CHECK (split_type IN ('equal', 'percentage', 'exact')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Expense splits
CREATE TABLE expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  owed_amount numeric(12,2) NOT NULL CHECK (owed_amount >= 0),
  percentage numeric(5,2),
  UNIQUE (expense_id, user_id)
);

-- Atomic expense creation function
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_group_id uuid,
  p_paid_by uuid,
  p_description text,
  p_amount numeric,
  p_currency text,
  p_split_type text,
  p_splits jsonb
) RETURNS uuid AS $$
DECLARE
  v_expense_id uuid;
  v_split jsonb;
BEGIN
  -- Insert expense
  INSERT INTO expenses (group_id, paid_by, description, amount, currency, split_type)
  VALUES (p_group_id, p_paid_by, p_description, p_amount, p_currency, p_split_type)
  RETURNING id INTO v_expense_id;

  -- Insert splits
  FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
  LOOP
    INSERT INTO expense_splits (expense_id, user_id, owed_amount, percentage)
    VALUES (
      v_expense_id,
      (v_split->>'user_id')::uuid,
      (v_split->>'owed_amount')::numeric,
      (v_split->>'percentage')::numeric
    );
  END LOOP;

  RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creator can update"
  ON expenses FOR UPDATE
  TO authenticated
  USING (paid_by = auth.uid());

CREATE POLICY "Expense creator or admin can delete"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    paid_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expenses.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- RLS for expense_splits
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view expense splits"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_splits.expense_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can insert expense splits"
  ON expense_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_splits.expense_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creator can delete splits"
  ON expense_splits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_splits.expense_id
      AND e.paid_by = auth.uid()
    )
  );
