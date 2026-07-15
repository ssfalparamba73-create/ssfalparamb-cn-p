SET search_path = public, extensions;

DELETE FROM auth_login_attempts;

UPDATE members SET pin_hash = crypt('1234', gen_salt('bf')) WHERE phone = '8888888888';
UPDATE admin_users SET pin_hash = crypt('1234', gen_salt('bf')) WHERE phone = '9999999999';
