const fs = require('fs');
const file = 'src/components/admin/payments/PaymentsTable.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const getStatusBadge = \(status: string, voided = false\) => \{[\s\S]*?\};\n/m;

const newGetStatusBadge = `const getStatusBadge = (status: string, voided = false) => {
    if (voided) return <Badge className="bg-slate-100 text-slate-600 border-slate-200 shadow-none">Voided</Badge>;
    
    // Map pending to failed (cancelled checkout) as per business rules
    const effectiveStatus = (status === "pending" || status === "cancelled") ? "failed" : status;

    switch (effectiveStatus) {
      case "confirmed":
        return <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 shadow-none">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };\n`;

if (regex.test(content)) {
  content = content.replace(regex, newGetStatusBadge);
  fs.writeFileSync(file, content);
  console.log('Fixed admin payments pending status (regex)');
} else {
  console.log('Could not find admin getStatusBadge');
}
