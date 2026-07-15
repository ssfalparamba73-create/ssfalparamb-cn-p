import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const [phoneArg, pin] = process.argv.slice(2);
const phone = phoneArg?.replace(/\D/g, "");

if (!phone || !/^\d{4}$/.test(pin || "")) {
  console.error("Usage: node scripts/set-admin-pin.mjs <phone> <4-digit-pin>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: admin, error: adminError } = await supabase
  .from("admin_users")
  .select("id, name, phone, status")
  .eq("phone", phone)
  .single();

if (adminError || !admin) {
  console.error(`Admin not found for phone ${phone}.`);
  process.exit(1);
}

if (admin.status !== "active") {
  console.error(`Admin ${phone} is not active.`);
  process.exit(1);
}

const pinHash = (await bcrypt.hash(pin, 10)).replace(/^\$2[by]\$/, "$2a$");
const { error: updateError } = await supabase
  .from("admin_users")
  .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
  .eq("id", admin.id);

if (updateError) {
  console.error(`PIN update failed: ${updateError.message}`);
  process.exit(1);
}

const { error: attemptsError } = await supabase
  .from("auth_login_attempts")
  .delete()
  .eq("actor_type", "admin")
  .eq("phone", phone);

if (attemptsError) {
  console.error(`PIN was updated, but login-attempt cleanup failed: ${attemptsError.message}`);
  process.exit(1);
}

const { data: verification, error: verificationError } = await supabase.rpc(
  "verify_admin_login",
  { p_phone: phone, p_code: pin }
);

if (verificationError || !verification?.success) {
  console.error(`PIN was updated, but RPC verification failed: ${verificationError?.message || verification?.error || "unknown error"}`);
  process.exit(1);
}

console.log(`Updated the 4-digit PIN for ${admin.name} (${admin.phone}).`);
console.log("Verified admin login through verify_admin_login: yes.");
