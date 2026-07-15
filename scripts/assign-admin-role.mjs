import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const [phoneArg, roleName] = process.argv.slice(2);
const phone = phoneArg?.replace(/\D/g, "");

if (!phone || !roleName) {
  console.error("Usage: node scripts/assign-admin-role.mjs <phone> <role>");
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

let { data: admin, error: adminError } = await supabase
  .from("admin_users")
  .select("id, name, phone, status")
  .eq("phone", phone)
  .single();

if (adminError || !admin) {
  const { data: admins, error: adminsError } = await supabase
    .from("admin_users")
    .select("id, name, phone, status")
    .eq("status", "active");

  if (adminsError) {
    console.error(`Unable to search active admins: ${adminsError.message}`);
    process.exit(1);
  }

  const matches = (admins || []).filter((item) => {
    let digits = item.phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return digits === phone;
  });

  if (matches.length !== 1) {
    console.error(`Expected one active admin matching ${phone}, found ${matches.length}.`);
    process.exit(1);
  }

  admin = matches[0];
}

if (admin.status !== "active") {
  console.error(`Admin ${phone} is not active.`);
  process.exit(1);
}

const { data: role, error: roleError } = await supabase
  .from("roles")
  .select("id, name")
  .eq("name", roleName)
  .single();

if (roleError || !role) {
  console.error(`Role ${roleName} was not found.`);
  process.exit(1);
}

const { error: assignmentError } = await supabase
  .from("admin_user_roles")
  .upsert(
    { admin_id: admin.id, role_id: role.id },
    { onConflict: "admin_id,role_id", ignoreDuplicates: true }
  );

if (assignmentError) {
  console.error(`Role assignment failed: ${assignmentError.message}`);
  process.exit(1);
}

const { data: verification, error: verificationError } = await supabase
  .from("admin_permissions")
  .select("permission_code")
  .eq("admin_id", admin.id);

if (verificationError) {
  console.error(`Role was assigned, but permission verification failed: ${verificationError.message}`);
  process.exit(1);
}

const permissions = new Set((verification || []).map((item) => item.permission_code));
console.log(`Assigned ${role.name} to ${admin.name} (${admin.phone}).`);
console.log(`Verified members.create: ${permissions.has("members.create") ? "yes" : "no"}.`);
console.log(`Verified members.update: ${permissions.has("members.update") ? "yes" : "no"}.`);
