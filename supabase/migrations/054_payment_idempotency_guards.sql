-- Prevent duplicate active gateway identifiers and duplicate pending intents.
-- Existing confirmed/failed history is preserved.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_order_id
  ON payments(gateway_order_id)
  WHERE gateway_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_payment_id
  ON payments(gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;

-- Keep the newest active intent and close older duplicates without deleting
-- ledger history. This makes the migration safe for existing test data.
WITH ranked_monthly AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY member_id, category
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS row_number
  FROM payments
  WHERE status = 'pending'
    AND category = 'monthly_dues'
    AND member_id IS NOT NULL
    AND voided_at IS NULL
)
UPDATE payments AS p
SET status = 'cancelled',
    notes = concat_ws(' | ', NULLIF(p.notes, ''), 'Cancelled automatically: duplicate pending contribution order')
FROM ranked_monthly AS duplicate
WHERE p.id = duplicate.id
  AND duplicate.row_number > 1;

WITH ranked_events AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY member_id, category, event_id
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS row_number
  FROM payments
  WHERE status = 'pending'
    AND category = 'special_event'
    AND member_id IS NOT NULL
    AND event_id IS NOT NULL
    AND voided_at IS NULL
)
UPDATE payments AS p
SET status = 'cancelled',
    notes = concat_ws(' | ', NULLIF(p.notes, ''), 'Cancelled automatically: duplicate pending contribution order')
FROM ranked_events AS duplicate
WHERE p.id = duplicate.id
  AND duplicate.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_member_monthly_payment
  ON payments(member_id, category)
  WHERE status = 'pending'
    AND category = 'monthly_dues'
    AND member_id IS NOT NULL
    AND voided_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_member_event_payment
  ON payments(member_id, category, event_id)
  WHERE status = 'pending'
    AND category = 'special_event'
    AND member_id IS NOT NULL
    AND event_id IS NOT NULL
    AND voided_at IS NULL;
