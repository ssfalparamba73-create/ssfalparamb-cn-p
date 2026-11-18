-- Return monthly confirmed collection totals for one year without loading
-- individual payment rows into the application server.
CREATE OR REPLACE FUNCTION admin_dashboard_monthly_collections(p_year INTEGER)
RETURNS TABLE (
  month_key TEXT,
  total_collected NUMERIC,
  monthly_dues NUMERIC,
  special_events NUMERIC,
  upi_amount NUMERIC,
  cash_amount NUMERIC,
  admin_amount NUMERIC
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  WITH months AS (
    SELECT generate_series(1, 12) AS month_number
  )
  SELECT
    to_char(make_date(p_year, months.month_number, 1), 'YYYY-MM') AS month_key,
    COALESCE(SUM(payment.amount), 0) AS total_collected,
    COALESCE(SUM(payment.amount) FILTER (WHERE payment.category = 'monthly_dues'), 0) AS monthly_dues,
    COALESCE(SUM(payment.amount) FILTER (WHERE payment.category = 'special_event'), 0) AS special_events,
    COALESCE(SUM(payment.amount) FILTER (WHERE payment.method::TEXT IN ('upi', 'qr_code')), 0) AS upi_amount,
    COALESCE(SUM(payment.amount) FILTER (WHERE payment.method = 'cash_handover'), 0) AS cash_amount,
    COALESCE(SUM(payment.amount) FILTER (WHERE payment.method = 'admin_cash_entry'), 0) AS admin_amount
  FROM months
  LEFT JOIN payments AS payment
    ON payment.status = 'confirmed'
    AND payment.voided_at IS NULL
    AND payment.recorded_at >= (make_date(p_year, months.month_number, 1)::TIMESTAMP AT TIME ZONE 'UTC')
    AND payment.recorded_at < ((make_date(p_year, months.month_number, 1) + INTERVAL '1 month')::TIMESTAMP AT TIME ZONE 'UTC')
  GROUP BY months.month_number
  ORDER BY months.month_number;
$$;

REVOKE ALL ON FUNCTION admin_dashboard_monthly_collections(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_dashboard_monthly_collections(INTEGER) TO service_role;
