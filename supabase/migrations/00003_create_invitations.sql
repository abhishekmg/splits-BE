-- Invitations
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id),
  invited_email text NOT NULL,
  invited_user_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now() NOT NULL,
  responded_at timestamptz
);

-- Only one pending invitation per group+email
CREATE UNIQUE INDEX idx_invitations_pending
  ON invitations (group_id, invited_email)
  WHERE status = 'pending';

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Invitee can see invitations addressed to them
CREATE POLICY "Users can view invitations for them"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    invited_user_id = auth.uid()
    OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

-- Group admins can send invitations
CREATE POLICY "Group admins can send invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = invitations.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- Invitee can update (accept/decline)
CREATE POLICY "Invitees can respond"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    invited_user_id = auth.uid()
    OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );
