-- Keep each admin's access deterministic: one admin account has exactly one
-- assigned role, and each system role owns only its canonical permissions.

DO $$
BEGIN
  IF EXISTS (
    SELECT admin_id
    FROM admin_user_roles
    GROUP BY admin_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one role per admin while duplicate role assignments exist';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_user_roles_admin_id
  ON admin_user_roles(admin_id);

DELETE FROM role_permissions AS assignment
USING roles AS role
WHERE assignment.role_id = role.id
  AND role.name IN (
    'super_admin',
    'president',
    'secretary',
    'treasurer',
    'collector',
    'viewer'
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
CROSS JOIN permissions AS permission
WHERE role.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
CROSS JOIN permissions AS permission
WHERE role.name = 'president'
  AND permission.code <> 'admin_users.manage'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
JOIN permissions AS permission
  ON permission.code IN (
    'members.view',
    'members.create',
    'members.update',
    'settings.view',
    'settings.update',
    'dashboard.view'
  )
WHERE role.name = 'secretary'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
JOIN permissions AS permission
  ON permission.code IN (
    'payments.view',
    'payments.verify',
    'reports.view',
    'reports.export',
    'dashboard.view'
  )
WHERE role.name = 'treasurer'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
JOIN permissions AS permission
  ON permission.code IN (
    'payments.view',
    'payments.record_cash',
    'members.view',
    'dashboard.view'
  )
WHERE role.name = 'collector'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
JOIN permissions AS permission
  ON permission.code IN (
    'dashboard.view',
    'members.view',
    'payments.view',
    'reports.view'
  )
WHERE role.name = 'viewer'
ON CONFLICT DO NOTHING;
