const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{cashfreeError && \(\s*<div className="flex items-center gap-2 text-sm text-destructive bg-destructive\/10 p-3 rounded-lg[^>]+>\s*<AlertCircle className="size-4 shrink-0" \/>\s*<span>\{cashfreeError\}<\/span>\s*<\/div>\s*\)\}/m;

const newErrorBlock = `{cashfreeError && (
              <div className="flex flex-col gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20 w-full animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-2.5 w-full">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <span className="leading-relaxed break-words flex-1">{cashfreeError}</span>
                </div>
                <div className="flex items-center gap-3 pl-7 flex-wrap mt-1">
                  <Link href="/support" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/80 px-3.5 py-2 rounded-lg border border-destructive/20 hover:bg-white transition-colors text-destructive shadow-sm">
                    View Contacts
                  </Link>
                  <Link href="/support" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#25D366]/10 px-3.5 py-2 rounded-lg border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors text-green-700 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <path d="M16.6 14c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.2-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.4 0-.5C10 9 9.3 7.6 9 7c-.1-.4-.3-.3-.5-.3h-.4c-.2 0-.5.1-.7.3-.3.3-.8.8-.8 2s.8 2.3 1 2.5c.2.2 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.6.4.1.8.1 1.2.1.8-.1 1.6-.6 1.9-1.2.3-.6.3-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
                      <path fillRule="evenodd" d="M12.2 3C7.2 3 3.1 7.1 3.1 12c0 1.6.4 3.1 1.1 4.4L3 21l4.8-1.2c1.3.6 2.7 1 4.3 1 5 0 9.1-4.1 9.1-9.1S17.2 3 12.2 3zm0 16.2c-1.4 0-2.7-.4-3.9-1l-.3-.2-2.9.7.8-2.8-.2-.3c-.7-1.2-1.1-2.5-1.1-3.9 0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5z" clipRule="evenodd" />
                    </svg>
                    WhatsApp Admin
                  </Link>
                </div>
              </div>
            )}`;

if (regex.test(content)) {
  content = content.replace(regex, newErrorBlock);
  fs.writeFileSync(file, content);
  console.log('updated');
} else {
  console.log('not found');
}
