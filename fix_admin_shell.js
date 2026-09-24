const fs = require('fs');
const file = 'src/components/admin/layout/AdminLayoutShell.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookRegex = /const \{ currentUser, isLoading \} = useAuth\(\);/;
content = content.replace(hookRegex, 'const { currentUser, isLoading, networkError } = useAuth();');

const effectRegex = /useEffect\(\(\) => \{\s*if \(isLoading\) return;\s*if \(\!currentUser\) \{\s*router\.replace\(\`\/admin\/login\?next=\$\{encodeURIComponent\(pathname\)\}\`\);\s*return;\s*\}\s*if \(\!canAccess\) router\.replace\("\/admin\/dashboard"\);\s*\}, \[canAccess, currentUser, isLoading, pathname, router\]\);/;
content = content.replace(effectRegex, `useEffect(() => {
    if (isLoading || networkError) return;
    if (!currentUser) {
      router.replace(\`/admin/login?next=\${encodeURIComponent(pathname)}\`);
      return;
    }
    if (!canAccess) router.replace("/admin/dashboard");
  }, [canAccess, currentUser, isLoading, networkError, pathname, router]);`);

const returnRegex = /return \(\s*<div className="min-h-screen/;
content = content.replace(returnRegex, `if (networkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-red-100 dark:border-red-900/30">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Connection Error</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Unable to verify your session due to a network or server issue. Please check your internet connection.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen`);

fs.writeFileSync(file, content);
console.log('Updated AdminLayoutShell');
