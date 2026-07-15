SET search_path = public, extensions;

-- Clear login attempts
DELETE FROM auth_login_attempts;

-- Upsert Member
INSERT INTO members (phone, name, pin_hash, status) 
VALUES ('8888888888', 'Test Member', crypt('1234', gen_salt('bf')), 'active')
ON CONFLICT (phone) DO UPDATE SET pin_hash = crypt('1234', gen_salt('bf')), status = 'active';

-- Upsert Admin
INSERT INTO admin_users (phone, name, pin_hash, status)
VALUES ('9999999999', 'Test Admin', crypt('1234', gen_salt('bf')), 'active')
ON CONFLICT (phone) DO UPDATE SET pin_hash = crypt('1234', gen_salt('bf')), status = 'active';
