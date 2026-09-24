const fs = require('fs');
const file = 'src/app/api/v1/settings/payments/route.ts';
let content = fs.readFileSync(file, 'utf8');

const oldReturn = `return createBackendResponse(ok(publicSettings), context.requestId);`;
const newReturn = `const response = createBackendResponse(ok(publicSettings), context.requestId);
    // Cache heavily on Vercel Edge network to prevent database load
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return response;`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync(file, content);
console.log('Added Cache-Control to route.ts');
