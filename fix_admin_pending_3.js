const fs = require('fs');
const file = 'src/components/admin/payments/PaymentsTable.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `  const getStatusBadge = (status: string, voided = false) => {`;
const endStr = `  const getCategoryIcon = (category: string) => {`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const oldBlock = content.slice(startIdx, endIdx);
  const newBlock = `  const getStatusBadge = (status: string, voided = false) => {
    if (voided) return <Badge className="bg-slate-100 text-slate-600 border-slate-200 shadow-none">Voided</Badge>;
    const effectiveStatus = (status === "pending" || status === "cancelled") ? "failed" : status;
    switch (effectiveStatus) {
      case "confirmed":
        return <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 shadow-none">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };\n\n`;
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content);
  console.log('Fixed admin payments pending status (substring)');
} else {
  console.log('Could not find start or end');
}
