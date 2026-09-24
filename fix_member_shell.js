const fs = require('fs');
const file = 'src/components/layout/MemberRouteShell.tsx';
let content = fs.readFileSync(file, 'utf8');

const importRegex = /import \{ MemberDataWarmup \} from "@\/components\/member\/MemberDataWarmup";/;
content = content.replace(importRegex, 'import { MemberDataWarmup } from "@/components/member/MemberDataWarmup";\nimport { BackendApiError } from "@/lib/api/backendClient";');

const oldHook = `  const { data: session, isPending, isError } = useQuery(memberSessionQuery);

  useEffect(() => {
    if (isError) {
      router.replace("/login");
      return;
    }`;

const newHook = `  const { data: session, isPending, error } = useQuery(memberSessionQuery);

  useEffect(() => {
    if (error) {
      // Only force redirect on genuine Auth errors. Network errors just get logged.
      if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) {
        router.replace("/login");
      } else {
        console.warn("Session check failed due to network/server error. Bypassing auto-logout.", error);
      }
      return;
    }`;

if (content.includes('isError')) {
  content = content.replace(oldHook, newHook);
  fs.writeFileSync(file, content);
  console.log('Updated MemberRouteShell');
} else {
  console.log('Could not find MemberRouteShell hook');
}
