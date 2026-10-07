
import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { PackagePlus, Receipt, AlertCircle, CheckCircle2, DollarSign, Calendar, List } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Purchases() {
  const [activeTab, setActiveTab] = useState('GASTOS');

  // --- ESTADOS GASTOS ---
  const [expenses, setExpenses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = expenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  const [expenseForm, setExpenseForm] = useState({
    category: 'OTROS',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'TRANSFER'
  });

  // --- ESTADOS COMPRAS (DEUDAS A PROVEEDORES) ---
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);

  const [debtForm, setDebtForm] = useState({
    supplier_id: '',
    concept: 'Compra de mercancía',
    total_amount: '',
    credit_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: ''
  });

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, debt: any, amount: string, date: string }>({
    isOpen: false, debt: null, amount: '', date: new Date().toISOString().split('T')[0]
  });

  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean, debt: any }>({
    isOpen: false, debt: null
  });

  const fetchData = async () => {
    try {
      const [expRes, supRes, debtsRes] = await Promise.all([
        apiClient.get('/cash/expenses'),
        apiClient.get('/contacts/suppliers'),
        apiClient.get('/debts/?debt_type=PAYABLE')
      ]);
      setExpenses(expRes.data);
      setSuppliers(supRes.data);
      setDebts(debtsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => {
    if (currentBusiness) {
      fetchData();
    }
  }, [currentBusiness]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...expenseForm,
        amount: Number(expenseForm.amount)
      };
      if (payload.amount <= 0) return toast.warning('Ingrese un monto válido');
      await apiClient.post('/cash/expenses', payload);
      toast.success('Gasto registrado');
      setExpenseForm({ ...expenseForm, description: '', amount: '' });
      fetchData();
    } catch (error) {
      toast.error('Error al registrar gasto');
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtForm.supplier_id) return toast.warning('Seleccione un proveedor');
    try {
      const supplier = suppliers.find(s => s.id === debtForm.supplier_id);
      const payload = {
        debt_type: 'PAYABLE',
        concept: debtForm.concept,
        contact_name: supplier?.company_name || 'Proveedor',
        total_amount: Number(debtForm.total_amount),
        credit_date: debtForm.credit_date || null,
        due_date: debtForm.due_date || null,
        notes: debtForm.notes
      };
      if (payload.total_amount <= 0) return toast.warning('Ingrese un monto válido');
      await apiClient.post('/debts/', payload);
      toast.success('Crédito registrado exitosamente');
      setDebtForm({ ...debtForm, total_amount: '', due_date: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error('Error al registrar la deuda');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        amount: Number(paymentModal.amount),
        payment_date: paymentModal.date
      };
      if (payload.amount <= 0) return toast.warning('Ingrese un monto válido');
      await apiClient.post(`/debts/${paymentModal.debt.id}/payments`, payload);
      toast.success('Abono registrado');
      setPaymentModal({ isOpen: false, debt: null, amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al registrar el abono');
    }
  };

  const pendingDebts = debts.filter(d => d.status !== 'PAID');
  const finishedDebts = debts.filter(d => d.status === 'PAID');

  return (
    <div className="flex flex-col h-full gap-6 font-sans text-slate-800 dark:text-slate-100">

      <div className="flex gap-4">
        <button onClick={() => setActiveTab('GASTOS')} className={`px-6 py-3 rounded-xl font-bold flex items-center transition-colors ${activeTab === 'GASTOS' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><Receipt className="mr-2" size={20} /> Gastos Generales</button>
        <button onClick={() => setActiveTab('COMPRAS')} className={`px-6 py-3 rounded-xl font-bold flex items-center transition-colors ${activeTab === 'COMPRAS' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><PackagePlus className="mr-2" size={20} /> Gastos a Proveedores</button>
      </div>

      {activeTab === 'GASTOS' && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Registrar Gasto</h2>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200 dark:text-slate-300">Fecha</label>
                <input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} className="w-full border dark:border-slate-600 bg-transparent rounded-xl p-3 dark:text-white outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200 dark:text-slate-300">Monto</label>
                <input
                  type="number"
                  step="any"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full border dark:border-slate-600 bg-transparent rounded-xl p-3 dark:text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Ej. 1500.50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200 dark:text-slate-300">Categoría</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full border dark:border-slate-600 bg-transparent rounded-xl p-3 dark:text-white outline-none focus:border-blue-500">
                  <option value="SERVICIOS">Servicios (Luz, Agua, Internet)</option>
                  <option value="NOMINA">Nómina / Empleados</option>
                  <option value="ARRIENDO">Arriendo</option>
                  <option value="OTROS">Otros Gastos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200 dark:text-slate-300">Descripción</label>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className="w-full border dark:border-slate-600 bg-transparent rounded-xl p-3 dark:text-white outline-none focus:border-blue-500" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md mt-4 transition">Guardar Gasto</button>
            </form>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Historial de Gastos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr><th className="p-4 rounded-tl-xl text-slate-600 dark:text-slate-300 font-semibold text-sm">Fecha</th><th className="p-4 text-slate-600 dark:text-slate-300 font-semibold text-sm">Categoría</th><th className="p-4 text-slate-600 dark:text-slate-300 font-semibold text-sm">Descripción</th><th className="p-4 rounded-tr-xl text-slate-600 dark:text-slate-300 font-semibold text-sm text-right">Monto</th></tr>
                </thead>
                <tbody>
                  {currentItems.map(exp => (
                    <tr key={exp.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="p-4 text-slate-700 dark:text-slate-200 dark:text-slate-300 font-medium text-sm">{exp.expense_date}</td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-200 dark:text-slate-300 text-sm">{exp.category}</td>
                      <td className="p-4 text-slate-700 dark:text-slate-200 dark:text-slate-300 text-sm">{exp.description}</td>
                      <td className="p-4 text-right text-rose-500 font-black">${exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No hay gastos registrados</td></tr>}
                </tbody>
              </table>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
          <span className="text-sm text-slate-600 font-medium">Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, expenses.length)} de {expenses.length}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

            </div>
          </div>
        </div>
      )}

      {activeTab === 'COMPRAS' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white flex items-center">
              <DollarSign className="mr-2 text-indigo-500" /> Registrar Gasto/Crédito con Proveedor
            </h2>
            <form onSubmit={handleCreateDebt} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Proveedor</label>
                <select value={debtForm.supplier_id} onChange={e => setDebtForm({ ...debtForm, supplier_id: e.target.value })} className="w-full border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none">
                  <option value="">Seleccione...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Monto Total</label>
                <input type="number" step="any" value={debtForm.total_amount} onChange={e => setDebtForm({ ...debtForm, total_amount: e.target.value })} className="w-full border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Fecha de Crédito</label>
                <input type="date" value={debtForm.credit_date} onChange={e => setDebtForm({ ...debtForm, credit_date: e.target.value })} className="w-full border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Fecha Límite</label>
                <input type="date" value={debtForm.due_date} onChange={e => setDebtForm({ ...debtForm, due_date: e.target.value })} className="w-full border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Concepto</label>
                <input type="text" value={debtForm.concept} onChange={e => setDebtForm({ ...debtForm, concept: e.target.value })} className="w-full border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none" required />
              </div>
              <div className="md:col-span-5">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition">Crear Registro</button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deudas Pendientes */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[600px]">
              <h3 className="text-lg font-bold mb-4 flex items-center text-amber-600"><AlertCircle className="mr-2" /> Créditos Pendientes</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {pendingDebts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">No hay deudas pendientes</div>
                ) : pendingDebts.map(debt => {
                  const progress = Math.min(100, Math.round((debt.paid_amount / debt.total_amount) * 100));
                  const isOverdue = debt.due_date && new Date(debt.due_date) < new Date();
                  return (
                    <div key={debt.id} className={`p-5 rounded-2xl border transition-all ${isOverdue ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{debt.contact_name}</h4>
                          <p className="text-xs text-slate-500">{debt.concept}</p>
                          <p className="text-xs text-slate-500 font-bold mt-1">Crédito: {new Date(debt.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-800 dark:text-white">${debt.total_amount.toLocaleString()}</p>
                          {debt.due_date && <p className={`text-xs font-bold mt-1 ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}><Calendar size={12} className="inline mr-1" /> Vence: {debt.due_date}</p>}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-emerald-600">Pagado: ${debt.paid_amount.toLocaleString()}</span>
                          <span className="text-amber-600">Resta: ${debt.balance.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between">
                        <button onClick={() => setDetailsModal({ isOpen: true, debt })} className="text-sm text-indigo-600 dark:text-indigo-400 font-bold flex items-center hover:underline">
                          <List size={16} className="mr-1" /> Detalles
                        </button>
                        <button onClick={() => setPaymentModal({ isOpen: true, debt, amount: '', date: new Date().toISOString().split('T')[0] })} className="text-sm bg-slate-800 dark:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 transition">
                          Abonar Dinero
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deudas Finalizadas */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[600px]">
              <h3 className="text-lg font-bold mb-4 flex items-center text-emerald-600"><CheckCircle2 className="mr-2" /> Créditos Finalizados</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {finishedDebts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">No hay créditos finalizados</div>
                ) : finishedDebts.map(debt => {
                  const lastPayment = debt.payments && debt.payments.length > 0
                    ? debt.payments[debt.payments.length - 1].payment_date
                    : 'N/A';
                  return (
                    <div key={debt.id} className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{debt.contact_name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{debt.concept}</p>
                          <p className="text-xs font-semibold text-emerald-600 mt-2">Iniciado: {new Date(debt.created_at).toLocaleDateString()} | Finalizado: {lastPayment}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600">${debt.total_amount.toLocaleString()}</p>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded mt-1 inline-block">PAGADO</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800 flex justify-end">
                        <button onClick={() => setDetailsModal({ isOpen: true, debt })} className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center hover:underline">
                          <List size={14} className="mr-1" /> Ver Abonos
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Abonar */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-sm transition-colors">
            <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Abonar a Crédito</h2>
            <p className="text-xs font-semibold text-slate-500 mb-6">{paymentModal.debt?.contact_name}</p>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl mb-6">
              <div className="flex justify-between text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>Resta por pagar:</span>
                <span className="font-black text-rose-500">${paymentModal.debt?.balance.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200 dark:text-slate-300">Fecha del Abono</label>
                <input
                  type="date"
                  value={paymentModal.date}
                  onChange={e => setPaymentModal({ ...paymentModal, date: e.target.value })}
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl p-3 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200 dark:text-slate-300">Cantidad a abonar</label>
                <input
                  type="number"
                  step="any"
                  value={paymentModal.amount}
                  onChange={e => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl p-3 text-lg font-bold text-center dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setPaymentModal({ isOpen: false, debt: null, amount: '', date: '' })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md">Abonar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Abonos */}
      {detailsModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md transition-colors">
            <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Detalle de Abonos</h2>
            <p className="text-xs font-semibold text-slate-500 mb-6">{detailsModal.debt?.contact_name} - {detailsModal.debt?.concept}</p>

            <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
              {!detailsModal.debt?.payments || detailsModal.debt.payments.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">Aún no se han registrado abonos</p>
              ) : (
                detailsModal.debt.payments.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 p-2 rounded-lg">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Abono {i + 1}</p>
                        <p className="text-xs text-slate-500">{p.payment_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">${p.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setDetailsModal({ isOpen: false, debt: null })} className="px-6 py-2 bg-slate-800 dark:bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-700 transition">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
