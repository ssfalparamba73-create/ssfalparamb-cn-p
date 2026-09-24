const fs = require('fs');

let file = 'src/components/admin/settings/PaymentConfigManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// Need to import Switch
content = content.replace(/import \{ Select, SelectContent, SelectItem, SelectTrigger, SelectValue \} from "@\/components\/ui\/select";/, 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { Switch } from "@/components/ui/switch";');

// Add defaults
content = content.replace(/includeYear: true,/g, 'includeYear: true,\n  upiEnabled: true,\n  specialEventEnabled: false,');

// Insert new Card
const newCard = `
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader><CardTitle>Payment Methods & Features</CardTitle><CardDescription>Toggle available payment methods and tabs on the public pay page.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">UPI Payments</Label>
              <p className="text-sm text-muted-foreground">Allow users to pay via UPI and QR Code.</p>
            </div>
            <Switch checked={settings.upiEnabled} onCheckedChange={(checked) => update("upiEnabled", checked)} disabled={isLoading || isSaving} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Special Event Tab</Label>
              <p className="text-sm text-muted-foreground">Show the special event tab for custom event contributions.</p>
            </div>
            <Switch checked={settings.specialEventEnabled} onCheckedChange={(checked) => update("specialEventEnabled", checked)} disabled={isLoading || isSaving} />
          </div>
        </CardContent>
      </Card>
`;

content = content.replace(/<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">\s*<CardHeader><CardTitle>UPI & QR Code<\/CardTitle>/, newCard + '\n      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">\n        <CardHeader><CardTitle>UPI & QR Code</CardTitle>');

fs.writeFileSync(file, content);
console.log('Fixed PaymentConfigManager UI');
