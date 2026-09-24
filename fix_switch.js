const fs = require('fs');

let file = 'src/components/admin/settings/PaymentConfigManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ Switch \} from "@\/components\/ui\/switch";/g, '');
content = content.replace(/<Switch checked=\{settings\.upiEnabled\} onCheckedChange=\{\(checked\) => update\("upiEnabled", checked\)\} disabled=\{isLoading \|\| isSaving\} \/>/g, '<Select value={settings.upiEnabled ? "yes" : "no"} onValueChange={(v) => update("upiEnabled", v === "yes")} disabled={isLoading || isSaving}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Enabled</SelectItem><SelectItem value="no">Disabled</SelectItem></SelectContent></Select>');

content = content.replace(/<Switch checked=\{settings\.specialEventEnabled\} onCheckedChange=\{\(checked\) => update\("specialEventEnabled", checked\)\} disabled=\{isLoading \|\| isSaving\} \/>/g, '<Select value={settings.specialEventEnabled ? "yes" : "no"} onValueChange={(v) => update("specialEventEnabled", v === "yes")} disabled={isLoading || isSaving}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Visible</SelectItem><SelectItem value="no">Hidden</SelectItem></SelectContent></Select>');

fs.writeFileSync(file, content);
console.log('Fixed switch error');
