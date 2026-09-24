const fs = require('fs');
const file = 'src/lib/admin/AuthContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const importRegex = /import \{ getCurrentSession, loginAdmin, logoutSession \} from "@\/lib\/api\/authClient";/;
content = content.replace(importRegex, 'import { getCurrentSession, loginAdmin, logoutSession } from "@/lib/api/authClient";\nimport { BackendApiError } from "@/lib/api/backendClient";');

const contextTypeRegex = /interface AuthContextType \{[\s\S]*?\}/;
content = content.replace(contextTypeRegex, `interface AuthContextType {
  currentUser: CurrentAdminUser | null;
  isLoading: boolean;
  networkError: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}`);

const providerRegex = /const \[isLoading, setIsLoading\] = useState\(true\);/;
content = content.replace(providerRegex, `const [isLoading, setIsLoading] = useState(true);\n  const [networkError, setNetworkError] = useState(false);`);

const catchRegex = /\.catch\(\(\) => \{\s*if \(active\) setCurrentUser\(null\);\s*\}\)/;
content = content.replace(catchRegex, `.catch((error) => {
        if (active) {
          if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) {
            setCurrentUser(null);
          } else {
            setNetworkError(true);
          }
        }
      })`);

const valueRegex = /value=\{\{\s*currentUser,\s*isLoading,\s*login,\s*logout,\s*\}\}/;
content = content.replace(valueRegex, `value={{ currentUser, isLoading, networkError, login, logout }}`);

fs.writeFileSync(file, content);
console.log('Updated AuthContext');
