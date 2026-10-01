const fs = require('fs');
let content = fs.readFileSync('src/pages/Products.tsx', 'utf8');

const stateVars = `
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [stockHistory, setStockHistory] = useState([]);
`;
content = content.replace(/const \[showStockModal, setShowStockModal\] = useState\(false\);/, "const [showStockModal, setShowStockModal] = useState(false);\n" + stateVars);

const tableButtons = `
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={async () => { 
                      setSelectedProductId(p.id); 
                      try {
                        const { data } = await apiClient.get(\`/products/\${p.id}/history\`);
                        setStockHistory(data);
                        setShowHistoryModal(true);
                      } catch (e) {
                        toast.error('Error al cargar historial');
                      }
                    }} className="text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs font-bold transition">
                      Historial
                    </button>
                    <button onClick={() => { setSelectedProductId(p.id); setStockToAdd(0); setShowStockModal(true); }} className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded text-xs font-bold transition">
                      + Stock
                    </button>
                    <button className="text-blue-600 hover:text-blue-800 ml-2"><Edit size={18} /></button>
                    <button className="text-red-600 hover:text-red-800 ml-2"><Trash2 size={18} /></button>
                  </td>
`;
content = content.replace(/<td className="px-6 py-4 text-right flex justify-end gap-2">[\s\S]*?<\/td>/, tableButtons.trim());

const addHistoryModal = `
      {/* Modal de Historial */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-lg transition-colors">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center">
              Historial de Stock
            </h2>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
              {stockHistory.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No hay movimientos registrados.</p>
              ) : (
                stockHistory.map((mov, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 flex justify-between items-center">
                    <div>
                      <span className={\`text-xs font-bold px-2 py-0.5 rounded \${mov.movement_type.includes('ENTRADA') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>
                        {mov.movement_type}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">{new Date(mov.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                        {mov.movement_type.includes('ENTRADA') ? '+' : '-'}{mov.quantity}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold">{mov.previous_stock} &rarr; {mov.new_stock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg font-bold">Cerrar</button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*<\/div>\s*\)\}\s*<\/div>/, `</div>\n        </div>\n      )}\n${addHistoryModal}\n    </div>`);

fs.writeFileSync('src/pages/Products.tsx', content, 'utf8');
console.log('Products updated with history!');
