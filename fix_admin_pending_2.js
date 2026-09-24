const fs = require('fs');
const file = 'src/components/admin/payments/PaymentsTable.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  const getStatusBadge = (status: string, voided = false) => {`;
const startIdx = content.indexOf(targetStr);

if (startIdx !== -1) {
  const endStr = `  };`; // Might be 2 spaces or 4 spaces
  let endIdx = content.indexOf(`    };\n`, startIdx);
  if (endIdx === -1) endIdx = content.indexOf(`  };\n`, startIdx);
  if (endIdx === -1) endIdx = content.indexOf(`};\n`, startIdx);
  
  if (endIdx !== -1) {
    const endOfEndStr = content.indexOf('\n', endIdx) + 1;
    const oldBlock = content.slice(startIdx, endOfEndStr);
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
  };\n`;
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(file, content);
    console.log('Fixed admin payments pending status (indexOf)');
  } else {
    console.log('Could not find end of getStatusBadge');
  }
} else {
  console.log('Could not find start of getStatusBadge');
}
