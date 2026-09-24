const fs = require('fs');
const file = 'src/lib/backend/adapters/supabase/mappers/payment.mapper.ts';
let content = fs.readFileSync(file, 'utf8');

const oldMapper = `    status: row.status === "confirmed" ? "COMPLETED" : row.status === "pending" ? "PENDING" : row.status === "refunded" ? "REFUNDED" : row.status === "cancelled" || row.status === "rejected" ? "CANCELLED" : "FAILED",`;
const newMapper = `    status: row.status === "confirmed" ? "COMPLETED" : row.status === "refunded" ? "REFUNDED" : row.status === "cancelled" || row.status === "rejected" || row.status === "pending" ? "FAILED" : "FAILED",`;

if (content.includes(oldMapper)) {
  content = content.replace(oldMapper, newMapper);
  fs.writeFileSync(file, content);
  console.log('Fixed backend mapper');
} else {
  console.log('Could not find backend mapper');
}
