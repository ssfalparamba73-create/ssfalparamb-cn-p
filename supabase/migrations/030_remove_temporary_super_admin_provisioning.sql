-- The unit owner has been provisioned. Remove the temporary bootstrap surface;
-- the created admin row, role assignment, and audit record remain intact.

DROP FUNCTION IF EXISTS provision_unit_super_admin(TEXT, TEXT, TEXT);
