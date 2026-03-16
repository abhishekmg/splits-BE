-- Settlements (global, not per-group)
CREATE TABLE settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paid_by uuid NOT NULL REFERENCES profiles(id),
  paid_to uuid NOT NULL REFERENCES profiles(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (paid_by != paid_to)
);

-- RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their settlements"
  ON settlements FOR SELECT
  TO authenticated
  USING (paid_by = auth.uid() OR paid_to = auth.uid());

CREATE POLICY "Users can create settlements"
  ON settlements FOR INSERT
  TO authenticated
  WITH CHECK (paid_by = auth.uid());

CREATE POLICY "Settlement creator can delete"
  ON settlements FOR DELETE
  TO authenticated
  USING (paid_by = auth.uid());
