const fs = require('fs');

let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace("import { Link, useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';");
fs.writeFileSync('src/pages/Login.tsx', login, 'utf8');

let purchases = fs.readFileSync('src/pages/Purchases.tsx', 'utf8');
const stateVars = `
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
`;
purchases = purchases.replace(/const \[selectedSupplier, setSelectedSupplier\] = useState\(''\);\s*const \[paymentStatus, setPaymentStatus\] = useState\('PAID'\);\s*const \[invoiceNumber, setInvoiceNumber\] = useState\(''\);/, stateVars.trim());
fs.writeFileSync('src/pages/Purchases.tsx', purchases, 'utf8');
console.log('Fixed Purchases.tsx state vars');
