const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const { initiateCheckout, isProcessing, error: cashfreeError, clearError } = useCashfreeCheckout();',
  'const [isProcessing, setIsProcessing] = useState(false);\n  const [cashfreeError, setCashfreeError] = useState<string | null>(null);'
);

fs.writeFileSync(file, content);
