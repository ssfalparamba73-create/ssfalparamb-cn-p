import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('payments').update({ member_id: 'a8a96f1f-69e0-4dea-8a54-f6fd51a0e890' }).eq('payer_phone', '9999999999').is('member_id', null).select('id, amount');
  console.log({ data, error });
}
run();
