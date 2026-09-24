const fs = require('fs');
const file = 'src/lib/admin/AuthContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<AuthContext\.Provider value=\{\{ currentUser, isLoading, login, logout \}\}>/;
content = content.replace(regex, '<AuthContext.Provider value={{ currentUser, isLoading, networkError, login, logout }}>');

fs.writeFileSync(file, content);
console.log('Fixed AuthContext Provider value');
