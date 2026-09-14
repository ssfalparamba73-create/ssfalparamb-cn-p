import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('payments').select('id, category, method, amount, member_id, payer_phone').eq('receipt_id', 'REC-20260904-32133D98');
  console.log(JSON.stringify(data, null, 2));
}
run();
