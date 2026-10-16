-- Keep dashboard media inside the existing public unit-assets bucket.
-- The application performs signature validation as an additional guard.
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'unit-assets';

CREATE INDEX IF NOT EXISTS idx_payments_member_confirmed_monthly
  ON public.payments (member_id)
  WHERE status = 'confirmed'
    AND category = 'monthly_dues'
    AND voided_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_months_month_payment
  ON public.payment_months (month_key, payment_id);

CREATE OR REPLACE FUNCTION public.member_directory_with_progress(
  p_search TEXT DEFAULT NULL,
  p_blood_group blood_group DEFAULT NULL,
  p_donor_available BOOLEAN DEFAULT NULL,
  p_area TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  member_code TEXT,
  name TEXT,
  phone TEXT,
  area TEXT,
  blood_group blood_group,
  is_blood_donor BOOLEAN,
  donor_available BOOLEAN,
  payment_progress_percent INTEGER,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH runtime AS (
    SELECT
      date_trunc('month', timezone('Asia/Kolkata', now()))::date AS current_month,
      date_trunc('year', timezone('Asia/Kolkata', now()))::date AS current_year
  ),
  filtered AS (
    SELECT
      m.id,
      m.member_code,
      m.name,
      m.phone,
      m.area,
      m.blood_group,
      m.is_blood_donor,
      m.donor_available,
      m.monthly_amount,
      GREATEST(date_trunc('month', timezone('Asia/Kolkata', m.joined_at))::date, r.current_year) AS first_due_month,
      r.current_month
    FROM public.members AS m
    CROSS JOIN runtime AS r
    WHERE m.status = 'active'
      AND (p_blood_group IS NULL OR m.blood_group = p_blood_group)
      AND (p_donor_available IS NULL OR m.donor_available = p_donor_available)
      AND (p_area IS NULL OR m.area = p_area)
      AND (
        NULLIF(btrim(p_search), '') IS NULL
        OR m.name ILIKE '%' || btrim(p_search) || '%'
        OR m.phone ILIKE '%' || btrim(p_search) || '%'
        OR m.member_code ILIKE '%' || btrim(p_search) || '%'
      )
  ),
  monthly_paid AS (
    SELECT
      p.member_id,
      SUM(pm.amount)::numeric AS paid_amount
    FROM public.payments AS p
    JOIN public.payment_months AS pm ON pm.payment_id = p.id
    JOIN filtered AS f ON f.id = p.member_id
    WHERE p.status = 'confirmed'
      AND p.category = 'monthly_dues'
      AND p.voided_at IS NULL
      AND pm.month_key >= to_char(f.first_due_month, 'YYYY-MM')
      AND pm.month_key <= to_char(f.current_month, 'YYYY-MM')
    GROUP BY p.member_id
  ),
  scored AS (
    SELECT
      f.*,
      CASE
        WHEN COALESCE(f.monthly_amount, 0) <= 0 THEN NULL
        WHEN f.first_due_month > f.current_month THEN 0
        ELSE LEAST(
          100,
          ROUND(
            100 * COALESCE(mp.paid_amount, 0)
            / NULLIF(
                f.monthly_amount * (
                  (EXTRACT(YEAR FROM age(f.current_month, f.first_due_month))::integer * 12)
                  + EXTRACT(MONTH FROM age(f.current_month, f.first_due_month))::integer
                  + 1
                ),
                0
              )
          )::integer
        )
      END AS payment_progress_percent
    FROM filtered AS f
    LEFT JOIN monthly_paid AS mp ON mp.member_id = f.id
  )
  SELECT
    s.id,
    s.member_code,
    s.name,
    s.phone,
    s.area,
    s.blood_group,
    s.is_blood_donor,
    s.donor_available,
    s.payment_progress_percent,
    COUNT(*) OVER () AS total_count
  FROM scored AS s
  ORDER BY s.name ASC, s.id ASC
  LIMIT LEAST(GREATEST(p_page_size, 1), 100)
  OFFSET (GREATEST(p_page, 1) - 1) * LEAST(GREATEST(p_page_size, 1), 100);
$$;

REVOKE ALL ON FUNCTION public.member_directory_with_progress(TEXT, blood_group, BOOLEAN, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.member_directory_with_progress(TEXT, blood_group, BOOLEAN, TEXT, INTEGER, INTEGER)
  TO service_role;
