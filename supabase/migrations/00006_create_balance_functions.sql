-- Get balances within a specific group for a user
-- Positive = others owe you. Negative = you owe others.
CREATE OR REPLACE FUNCTION get_group_balances(p_group_id uuid, p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  amount numeric,
  currency text
) AS $$
BEGIN
  RETURN QUERY
  WITH debts AS (
    -- Money owed TO p_user_id (they paid, others owe)
    SELECT
      es.user_id AS other_user,
      e.currency,
      SUM(es.owed_amount) AS debt_amount
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    WHERE e.group_id = p_group_id
      AND e.paid_by = p_user_id
      AND es.user_id != p_user_id
    GROUP BY es.user_id, e.currency

    UNION ALL

    -- Money p_user_id owes others (others paid, they owe)
    SELECT
      e.paid_by AS other_user,
      e.currency,
      -SUM(es.owed_amount) AS debt_amount
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    WHERE e.group_id = p_group_id
      AND es.user_id = p_user_id
      AND e.paid_by != p_user_id
    GROUP BY e.paid_by, e.currency
  ),
  netted AS (
    SELECT
      d.other_user,
      d.currency,
      SUM(d.debt_amount) AS net_amount
    FROM debts d
    GROUP BY d.other_user, d.currency
    HAVING SUM(d.debt_amount) != 0
  )
  SELECT
    n.other_user AS user_id,
    p.email,
    p.display_name,
    n.net_amount AS amount,
    n.currency
  FROM netted n
  JOIN profiles p ON p.id = n.other_user
  ORDER BY n.currency, ABS(n.net_amount) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get overall net balances across all groups, accounting for settlements
CREATE OR REPLACE FUNCTION get_overall_balances(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  amount numeric,
  currency text
) AS $$
BEGIN
  RETURN QUERY
  WITH debts AS (
    -- Money owed TO p_user_id from expenses
    SELECT
      es.user_id AS other_user,
      e.currency,
      SUM(es.owed_amount) AS debt_amount
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    WHERE e.paid_by = p_user_id
      AND es.user_id != p_user_id
    GROUP BY es.user_id, e.currency

    UNION ALL

    -- Money p_user_id owes from expenses
    SELECT
      e.paid_by AS other_user,
      e.currency,
      -SUM(es.owed_amount) AS debt_amount
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    WHERE es.user_id = p_user_id
      AND e.paid_by != p_user_id
    GROUP BY e.paid_by, e.currency

    UNION ALL

    -- Settlements made BY p_user_id (reduces what they owe)
    SELECT
      s.paid_to AS other_user,
      s.currency,
      SUM(s.amount) AS debt_amount
    FROM settlements s
    WHERE s.paid_by = p_user_id
    GROUP BY s.paid_to, s.currency

    UNION ALL

    -- Settlements made TO p_user_id (reduces what others owe)
    SELECT
      s.paid_by AS other_user,
      s.currency,
      -SUM(s.amount) AS debt_amount
    FROM settlements s
    WHERE s.paid_to = p_user_id
    GROUP BY s.paid_by, s.currency
  ),
  netted AS (
    SELECT
      d.other_user,
      d.currency,
      SUM(d.debt_amount) AS net_amount
    FROM debts d
    GROUP BY d.other_user, d.currency
    HAVING SUM(d.debt_amount) != 0
  )
  SELECT
    n.other_user AS user_id,
    p.email,
    p.display_name,
    n.net_amount AS amount,
    n.currency
  FROM netted n
  JOIN profiles p ON p.id = n.other_user
  ORDER BY n.currency, ABS(n.net_amount) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
