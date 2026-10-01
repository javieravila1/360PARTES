const fs = require('fs');

let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace("import { Link, useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';");
fs.writeFileSync('src/pages/Login.tsx', login, 'utf8');

let purchases = fs.readFileSync('src/pages/Purchases.tsx', 'utf8');
purchases = purchases.replace("import { Search, Plus, Trash2, PackagePlus, Truck, Calendar, DollarSign, Receipt } from 'lucide-react';", "import { Trash2, PackagePlus, Receipt } from 'lucide-react';");
purchases = purchases.replace("const [dueDate, setDueDate] = useState('');", "");
purchases = purchases.replace("const [amountPaid, setAmountPaid] = useState(0);", "");
fs.writeFileSync('src/pages/Purchases.tsx', purchases, 'utf8');

let sales = fs.readFileSync('src/pages/Sales.tsx', 'utf8');
sales = sales.replace("import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Landmark, User, Calendar, Tag, Filter } from 'lucide-react';", "import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Landmark, User, Calendar } from 'lucide-react';");
fs.writeFileSync('src/pages/Sales.tsx', sales, 'utf8');

console.log('Fixed TS6133 errors');
