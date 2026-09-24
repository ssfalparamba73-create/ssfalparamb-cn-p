const fs = require('fs');

// 1. paymentSettingsClient.ts
let clientFile = 'src/lib/api/paymentSettingsClient.ts';
let clientContent = fs.readFileSync(clientFile, 'utf8');
clientContent = clientContent.replace(/includeYear: boolean;/g, 'includeYear: boolean;\n  upiEnabled: boolean;\n  specialEventEnabled: boolean;');
fs.writeFileSync(clientFile, clientContent);

// 2. admin route
let adminRoute = 'src/app/api/v1/admin/settings/payments/route.ts';
let adminContent = fs.readFileSync(adminRoute, 'utf8');
adminContent = adminContent.replace(/includeYear: true,/g, 'includeYear: true,\n  upiEnabled: true,\n  specialEventEnabled: false,');
adminContent = adminContent.replace(/includeYear: Boolean\(body\.includeYear\),/g, 'includeYear: Boolean(body.includeYear),\n      upiEnabled: body.upiEnabled === undefined ? true : Boolean(body.upiEnabled),\n      specialEventEnabled: Boolean(body.specialEventEnabled),');
fs.writeFileSync(adminRoute, adminContent);

// 3. public route
let publicRoute = 'src/app/api/v1/settings/payments/route.ts';
let publicContent = fs.readFileSync(publicRoute, 'utf8');
publicContent = publicContent.replace(/customMinimum: 10,/g, 'customMinimum: 10,\n  upiEnabled: true,\n  specialEventEnabled: false,');
publicContent = publicContent.replace(/customMinimum: data\?\.value\?\.customMinimum \?\? DEFAULTS\.customMinimum,/g, 'customMinimum: data?.value?.customMinimum ?? DEFAULTS.customMinimum,\n      upiEnabled: data?.value?.upiEnabled ?? DEFAULTS.upiEnabled,\n      specialEventEnabled: data?.value?.specialEventEnabled ?? DEFAULTS.specialEventEnabled,');
fs.writeFileSync(publicRoute, publicContent);

console.log('Fixed F5 APIs');
