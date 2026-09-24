const fs = require('fs');
const file = 'src/app/api/v1/admin/settings/payments/route.ts';
let content = fs.readFileSync(file, 'utf8');

const importRegex = /import type \{ NextRequest \} from "next\/server";/;
content = content.replace(importRegex, 'import type { NextRequest } from "next/server";\nimport { revalidatePath } from "next/cache";');

const oldReturn = `if (error) throw error;
    return createBackendResponse(ok(settings), context.requestId);`;
const newReturn = `if (error) throw error;
    revalidatePath("/pay"); // Instantly update public page cache
    return createBackendResponse(ok(settings), context.requestId);`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync(file, content);
console.log('Added revalidatePath to admin route');
