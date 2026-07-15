import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1]] = match[2].replace(/^"|"$/g, '');
    }
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function check() {
    const { data } = await supabase.from('members').select('phone, name, pin_hash').eq('phone', '8888888888');
    console.log("Member DB data:", data);
    
    // Also try calling the RPC directly via supabase-js
    const { data: rpcData, error } = await supabase.rpc('verify_member_login', { p_phone: '8888888888', p_pin: '1234' });
    console.log("RPC result:", rpcData, "Error:", error);
}
check();
