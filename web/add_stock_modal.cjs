const fs = require('fs');
let content = fs.readFileSync('src/pages/Products.tsx', 'utf8');

const stateVars = `
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockToAdd, setStockToAdd] = useState(0);
`;
content = content.replace(/const \[showModal, setShowModal\] = useState\(false\);/, stateVars.trim());

const tableButtons = `
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setSelectedProductId(p.id); setStockToAdd(0); setShowStockModal(true); }} className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded text-xs font-bold transition">
                      + Stock
                    </button>
                    <button className="text-blue-600 hover:text-blue-800 ml-2"><Edit size={18} /></button>
                    <button className="text-red-600 hover:text-red-800 ml-2"><Trash2 size={18} /></button>
                  </td>
`;
content = content.replace(/<td className="px-6 py-4 text-right">\s*<button className="text-blue-600 hover:text-blue-800 mr-3"><Edit size=\{18\} \/><\/button>\s*<button className="text-red-600 hover:text-red-800"><Trash2 size=\{18\} \/><\/button>\s*<\/td>/, tableButtons.trim());

const addStockModal = `
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-sm transition-colors">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Incrementar Stock</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cantidad a Ingresar</label>
              <input type="number" min="1" value={stockToAdd} onChange={e => setStockToAdd(Number(e.target.value))} className="block w-full rounded-xl border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-lg text-center font-bold transition-all outline-none" />
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setShowStockModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
              <button type="button" onClick={async () => {
                if (stockToAdd <= 0) return toast.warning('Ingrese una cantidad válida');
                try {
                  await apiClient.patch(\`/products/\${selectedProductId}/stock\`, { quantity: stockToAdd });
                  toast.success('Stock actualizado');
                  setShowStockModal(false);
                  fetchData();
                } catch (e) {
                  toast.error('Error al actualizar stock');
                }
              }} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
`;
content = content.replace(/<\/div>\s*<\/div>\s*\)\}\s*<\/div>/, `</div>\n        </div>\n      )}\n${addStockModal}\n    </div>`);

fs.writeFileSync('src/pages/Products.tsx', content, 'utf8');
console.log('Products updated!');
