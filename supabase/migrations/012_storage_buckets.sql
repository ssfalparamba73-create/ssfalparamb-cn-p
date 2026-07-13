INSERT INTO storage.buckets (id, name, public)
VALUES
  ('unit-assets', 'unit-assets', true),
  ('receipt-assets', 'receipt-assets', false),
  ('payment-proofs', 'payment-proofs', false),
  ('member-files', 'member-files', false),
  ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Public read for unit-assets
CREATE POLICY "Public read unit-assets" ON storage.objects FOR SELECT USING (bucket_id = 'unit-assets');

-- Private access for others using app-level identity
CREATE POLICY "Admin full access storage"
ON storage.objects
FOR ALL
USING (
  is_super_admin()
  OR has_permission('settings.update')
)
WITH CHECK (
  is_super_admin()
  OR has_permission('settings.update')
);
