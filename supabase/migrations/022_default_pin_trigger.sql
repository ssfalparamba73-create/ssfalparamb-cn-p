SET search_path = public, extensions;

-- Function to set a default PIN for new members if not provided
CREATE OR REPLACE FUNCTION set_default_pin_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pin_hash IS NULL THEN
    -- Set default PIN to the last 4 digits of their phone number
    NEW.pin_hash := crypt(substring(NEW.phone from length(NEW.phone) - 3 for 4), gen_salt('bf'));
    NEW.pin_status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_default_pin_hash ON members;

CREATE TRIGGER trg_set_default_pin_hash
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION set_default_pin_hash();
