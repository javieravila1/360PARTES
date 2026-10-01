const fs = require('fs');

let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(/import\s*\{\s*Link[^}]*\}\s*from\s*'react-router-dom';/, "import { useNavigate } from 'react-router-dom';");
fs.writeFileSync('src/pages/Login.tsx', login, 'utf8');

let purchases = fs.readFileSync('src/pages/Purchases.tsx', 'utf8');
purchases = purchases.replace(/const\s*\[dueDate,\s*setDueDate\]\s*=\s*useState\(''\);/, "const [dueDate] = useState('');");
purchases = purchases.replace(/const\s*\[amountPaid,\s*setAmountPaid\]\s*=\s*useState\(0\);/, "const [amountPaid] = useState(0);");
fs.writeFileSync('src/pages/Purchases.tsx', purchases, 'utf8');

console.log('Fixed unused variables');
