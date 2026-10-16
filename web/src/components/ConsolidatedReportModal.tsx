import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  X, Download, FileText, Calendar, Clock, TrendingUp, DollarSign, 
  Boxes, Sparkles, Store, ArrowUpRight 
} from 'lucide-react';

interface ConsolidatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBusiness?: (businessId: string) => void;
}

export default function ConsolidatedReportModal({ isOpen, onClose, onSelectBusiness }: ConsolidatedReportModalProps) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all_time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      let params = `time_filter=${timeFilter}`;
      if (startDate) params += `&start_date=${startDate}`;
      if (endDate) params += `&end_date=${endDate}`;
      const { data } = await apiClient.get(`/businesses/consolidated-report?${params}`);
      setReportData(data);
    } catch (error) {
      toast.error('Error al cargar informe consolidado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen, timeFilter, startDate, endDate]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    const num = Number(val) || 0;
    return num < 0 ? `-$${Math.abs(num).toLocaleString('es-CO')}` : `$${num.toLocaleString('es-CO')}`;
  };

  const getPeriodLabel = () => {
    if (startDate && endDate) return `Del ${startDate} al ${endDate}`;
    if (startDate) return `Desde ${startDate}`;
    switch (timeFilter) {
      case 'today': return 'Hoy';
      case 'this_week': return 'Esta Semana';
      case 'this_month': return 'Este Mes';
      case 'this_semester': return 'Este Semestre';
      case 'this_year': return 'Este Año';
      case 'all_time': return 'Todo el Tiempo (Histórico)';
      default: return 'Todo el Tiempo';
    }
  };

  const handleExportExcel = () => {
    if (!reportData || !reportData.businesses || reportData.businesses.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Detalle por negocio
      const detailData = reportData.businesses.map((b: any) => ({
        'Negocio': b.business_name,
        'Rol': b.role,
        'Ventas Totales ($)': b.total_sales,
        'Cant. Ventas': b.sales_count,
        'Gastos Totales ($)': b.total_expenses,
        'Ganancias Después de Gastos ($)': b.profit_after_expenses,
        'Ganancia Bruta ($)': b.total_profit,
        'Inversión en Inventario ($)': b.inventory_cost,
        'Valor Comercial Inventario ($)': b.inventory_value,
        'Margen Potencial ($)': b.potential_profit,
        'Referencias de Productos': b.total_products,
        'Stock Total (Unidades)': b.total_stock,
        'Cuentas por Pagar ($)': b.total_payables,
        'Cuentas por Cobrar ($)': b.total_receivables,
      }));

      // Fila de totales
      detailData.push({
        'Negocio': 'TOTALES CONSOLIDADOS',
        'Rol': `${reportData.businesses_count} Negocios`,
        'Ventas Totales ($)': reportData.totals.total_sales,
        'Cant. Ventas': reportData.totals.sales_count,
        'Gastos Totales ($)': reportData.totals.total_expenses,
        'Ganancias Después de Gastos ($)': reportData.totals.profit_after_expenses,
        'Ganancia Bruta ($)': reportData.totals.total_profit,
        'Inversión en Inventario ($)': reportData.totals.inventory_cost,
        'Valor Comercial Inventario ($)': reportData.totals.inventory_value,
        'Margen Potencial ($)': reportData.totals.potential_profit,
        'Referencias de Productos': reportData.totals.total_products,
        'Stock Total (Unidades)': reportData.totals.total_stock,
        'Cuentas por Pagar ($)': reportData.totals.total_payables,
        'Cuentas por Cobrar ($)': reportData.totals.total_receivables,
      });

      const wsDetail = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle por Negocio');

      // Sheet 2: Resumen Ejecutivo
      const summaryData = [
        { 'Indicador': 'Empresa / Plataforma', 'Valor': '360PARTES' },
        { 'Indicador': 'Tipo de Informe', 'Valor': 'Informe General Consolidado de Negocios' },
        { 'Indicador': 'Fecha y Hora de Emisión', 'Valor': reportData.period.generated_at },
        { 'Indicador': 'Período Consultado', 'Valor': getPeriodLabel() },
        { 'Indicador': 'Cantidad de Negocios', 'Valor': reportData.businesses_count },
        { 'Indicador': 'Ventas Totales Consolidadas', 'Valor': reportData.totals.total_sales },
        { 'Indicador': 'Gastos Totales Consolidados', 'Valor': reportData.totals.total_expenses },
        { 'Indicador': 'Ganancias Después de Gastos (Ventas - Gastos)', 'Valor': reportData.totals.profit_after_expenses },
        { 'Indicador': 'Ganancia Bruta de Ventas', 'Valor': reportData.totals.total_profit },
        { 'Indicador': 'Inversión Total en Inventario (Costo)', 'Valor': reportData.totals.inventory_cost },
        { 'Indicador': 'Valor Comercial Total Inventario', 'Valor': reportData.totals.inventory_value },
        { 'Indicador': 'Margen Potencial en Inventario', 'Valor': reportData.totals.potential_profit },
        { 'Indicador': 'Unidades Totales en Stock', 'Valor': reportData.totals.total_stock },
        { 'Indicador': 'Total Referencias de Productos', 'Valor': reportData.totals.total_products },
        { 'Indicador': 'Cuentas por Pagar Acumuladas', 'Valor': reportData.totals.total_payables },
        { 'Indicador': 'Cuentas por Cobrar Acumuladas', 'Valor': reportData.totals.total_receivables },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Informe_General_Negocios_${dateStr}.xlsx`);
      toast.success('Informe Excel descargado correctamente');
    } catch (e) {
      toast.error('Error al generar el archivo Excel');
    }
  };

  const handleExportPDF = () => {
    if (!reportData || !reportData.businesses || reportData.businesses.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Encabezado
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('360PARTES - Informe General Consolidado de Negocios', 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(`Período: ${getPeriodLabel()} | Generado: ${reportData.period.generated_at} | Negocios: ${reportData.businesses_count}`, 14, 19);

      // Resumen de KPIs en cajas
      const kpis = [
        { label: 'Ventas Totales', val: formatCurrency(reportData.totals.total_sales) },
        { label: 'Gastos Totales', val: formatCurrency(reportData.totals.total_expenses) },
        { label: 'Ganancia d. Gastos', val: formatCurrency(reportData.totals.profit_after_expenses) },
        { label: 'Costo Inventario', val: formatCurrency(reportData.totals.inventory_cost) },
        { label: 'Valor Inventario', val: formatCurrency(reportData.totals.inventory_value) },
        { label: 'Stock Unidades', val: reportData.totals.total_stock.toLocaleString() },
      ];

      const kpiWidth = (pageWidth - 28) / kpis.length;
      kpis.forEach((kpi, idx) => {
        const x = 14 + (idx * kpiWidth);
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(x, 28, kpiWidth - 2, 14, 2, 2, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label.toUpperCase(), x + 3, 33);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(kpi.val, x + 3, 39);
      });

      // Tabla Detallada
      const tableRows = reportData.businesses.map((b: any) => [
        b.business_name,
        b.role,
        formatCurrency(b.total_sales),
        formatCurrency(b.total_expenses),
        formatCurrency(b.profit_after_expenses),
        formatCurrency(b.total_profit),
        formatCurrency(b.inventory_cost),
        formatCurrency(b.inventory_value),
        Number(b.total_stock || 0).toLocaleString(),
        formatCurrency(b.total_payables),
      ]);

      const footRow = [
        'TOTALES',
        `${reportData.businesses_count} Sedes`,
        formatCurrency(reportData.totals.total_sales),
        formatCurrency(reportData.totals.total_expenses),
        formatCurrency(reportData.totals.profit_after_expenses),
        formatCurrency(reportData.totals.total_profit),
        formatCurrency(reportData.totals.inventory_cost),
        formatCurrency(reportData.totals.inventory_value),
        Number(reportData.totals.total_stock || 0).toLocaleString(),
        formatCurrency(reportData.totals.total_payables),
      ];

      autoTable(doc, {
        startY: 46,
        head: [['Negocio', 'Rol', 'Ventas Totales', 'Gastos', 'Ganancia d. Gastos', 'Ganancia Bruta', 'Costo Inv.', 'Valor Inv.', 'Stock', 'Por Pagar']],
        body: tableRows,
        foot: [footRow],
        theme: 'striped',
        headStyles: { 
          fillColor: [79, 70, 229], // Indigo 600
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        },
        footStyles: { 
          fillColor: [241, 245, 249], // Slate 100
          textColor: [15, 23, 42], // Slate 900
          fontStyle: 'bold',
          fontSize: 8
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5,
          valign: 'middle'
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'center' },
          9: { halign: 'right' },
        },
        margin: { left: 14, right: 14, bottom: 15 },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Página ${data.pageNumber} | Sistema 360PARTES`,
            pageWidth - 14,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'right' }
          );
        }
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`Informe_General_Negocios_${dateStr}.pdf`);
      toast.success('Informe PDF descargado correctamente');
    } catch (e) {
      toast.error('Error al generar el archivo PDF');
    }
  };

  const StatMiniCard = ({ icon: Icon, title, value, textColor, glowColor, subtitle }: any) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl opacity-20 ${glowColor}`}></div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 ${textColor}`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      </div>
      <div>
        <p className={`text-xl sm:text-2xl font-black tracking-tight ${textColor}`}>{value}</p>
        {subtitle && <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden transition-all">
        
        {/* Modal Header */}
        <div className="p-6 pb-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center">
                <Store size={13} className="mr-1" /> Consolidado Multinegocio
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {reportData?.businesses_count || 0} Negocios Registrados
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Informe General de Negocios
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Consolidado de ventas, gastos, ganancias e inventario de todas tus sedes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botón Excel */}
            <button
              onClick={handleExportExcel}
              disabled={loading || !reportData}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              title="Descargar en formato Excel (.xlsx)"
            >
              <Download size={16} /> Excel
            </button>

            {/* Botón PDF */}
            <button
              onClick={handleExportPDF}
              disabled={loading || !reportData}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              title="Descargar en formato PDF (.pdf)"
            >
              <FileText size={16} /> PDF
            </button>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar (Filtros de Período) */}
        <div className="px-6 py-3 bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick selector */}
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                disabled={!!(startDate || endDate)}
                className="disabled:opacity-50 appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-8 pr-8 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all_time">Todo el tiempo</option>
                <option value="today">Hoy</option>
                <option value="this_week">Esta semana</option>
                <option value="this_month">Este mes</option>
                <option value="this_semester">Este semestre</option>
                <option value="this_year">Este año</option>
              </select>
            </div>

            {/* Custom Range */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-xl shadow-xs">
              <Calendar size={13} className="text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Desde</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 p-0.5"
              />
              <span className="text-slate-300 dark:text-slate-600">-</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hasta</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 p-0.5"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="ml-1 text-slate-400 hover:text-rose-500"
                  title="Limpiar fechas"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Mostrando datos para: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{getPeriodLabel()}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-3"></div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Calculando métricas consolidadas...</p>
            </div>
          ) : !reportData || reportData.businesses.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <Store size={48} className="mx-auto mb-3 opacity-40" />
              <p className="text-base font-bold">No se encontraron negocios activos</p>
            </div>
          ) : (
            <>
              {/* KPIs Consolidados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatMiniCard
                  icon={TrendingUp}
                  title="Ventas Totales"
                  value={formatCurrency(reportData.totals.total_sales)}
                  textColor="text-indigo-600 dark:text-indigo-400"
                  glowColor="bg-indigo-500"
                  subtitle={`${reportData.totals.sales_count} ventas en total`}
                />
                <StatMiniCard
                  icon={DollarSign}
                  title="Gastos Totales"
                  value={formatCurrency(reportData.totals.total_expenses)}
                  textColor="text-amber-600 dark:text-amber-400"
                  glowColor="bg-amber-500"
                  subtitle="Egresos en todas las sedes"
                />
                <StatMiniCard
                  icon={Sparkles}
                  title="Ganancias Después de Gastos"
                  value={formatCurrency(reportData.totals.profit_after_expenses)}
                  textColor={reportData.totals.profit_after_expenses >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
                  glowColor={reportData.totals.profit_after_expenses >= 0 ? "bg-emerald-500" : "bg-rose-500"}
                  subtitle="Ventas Totales - Gastos Totales"
                />
                <StatMiniCard
                  icon={Boxes}
                  title="Inversión en Inventario"
                  value={formatCurrency(reportData.totals.inventory_cost)}
                  textColor="text-teal-600 dark:text-teal-400"
                  glowColor="bg-teal-500"
                  subtitle={`Valor comercial: ${formatCurrency(reportData.totals.inventory_value)}`}
                />
              </div>

              {/* Fila secundaria de resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Ganancia Bruta (Margen)</span>
                  <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                    {formatCurrency(reportData.totals.total_profit)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Margen Potencial Inventario</span>
                  <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                    +{formatCurrency(reportData.totals.potential_profit)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unidades en Stock</span>
                  <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                    {Number(reportData.totals.total_stock || 0).toLocaleString()} unids.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cuentas por Pagar</span>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {formatCurrency(reportData.totals.total_payables)}
                  </p>
                </div>
              </div>

              {/* Tabla Detallada por Negocio */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Store size={18} className="text-indigo-500" /> Desglose Detallado por Negocio
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {reportData.businesses.length} Negocios Registrados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider">
                        <th className="p-3 pl-4">Negocio</th>
                        <th className="p-3 text-right">Ventas Totales</th>
                        <th className="p-3 text-right">Gastos Totales</th>
                        <th className="p-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">Ganancias d. Gastos</th>
                        <th className="p-3 text-right">Ganancia Bruta</th>
                        <th className="p-3 text-right">Costo Inv.</th>
                        <th className="p-3 text-right">Valor Inv.</th>
                        <th className="p-3 text-center">Stock</th>
                        <th className="p-3 text-right">Por Pagar</th>
                        <th className="p-3 text-center pr-4">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {reportData.businesses.map((b: any) => (
                        <tr 
                          key={b.business_id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <td className="p-3 pl-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {b.business_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white leading-tight">{b.business_name}</p>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">{b.role}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(b.total_sales)}
                            <span className="block text-[10px] font-normal text-slate-400">{b.sales_count} ventas</span>
                          </td>
                          <td className="p-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                            {formatCurrency(b.total_expenses)}
                          </td>
                          <td className="p-3 text-right font-black bg-emerald-50/30 dark:bg-emerald-950/10">
                            <span className={b.profit_after_expenses >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                              {formatCurrency(b.profit_after_expenses)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(b.total_profit)}
                          </td>
                          <td className="p-3 text-right font-semibold text-teal-600 dark:text-teal-400">
                            {formatCurrency(b.inventory_cost)}
                          </td>
                          <td className="p-3 text-right font-semibold text-cyan-600 dark:text-cyan-400">
                            {formatCurrency(b.inventory_value)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              {Number(b.total_stock || 0).toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-400">{b.total_products} refs</span>
                          </td>
                          <td className="p-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                            {formatCurrency(b.total_payables)}
                          </td>
                          <td className="p-3 text-center pr-4">
                            {onSelectBusiness && (
                              <button
                                onClick={() => {
                                  onSelectBusiness(b.business_id);
                                  onClose();
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                                title="Entrar a administrar este negocio"
                              >
                                Entrar <ArrowUpRight size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Fila de Totales */}
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-slate-700/80 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                        <td className="p-3.5 pl-4 uppercase tracking-wider text-xs">
                          TOTALES CONSOLIDADOS
                        </td>
                        <td className="p-3.5 text-right text-indigo-600 dark:text-indigo-400 text-sm">
                          {formatCurrency(reportData.totals.total_sales)}
                        </td>
                        <td className="p-3.5 text-right text-amber-600 dark:text-amber-400 text-sm">
                          {formatCurrency(reportData.totals.total_expenses)}
                        </td>
                        <td className="p-3.5 text-right text-sm bg-emerald-100/50 dark:bg-emerald-950/40">
                          <span className={reportData.totals.profit_after_expenses >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>
                            {formatCurrency(reportData.totals.profit_after_expenses)}
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-slate-800 dark:text-slate-100 text-sm">
                          {formatCurrency(reportData.totals.total_profit)}
                        </td>
                        <td className="p-3.5 text-right text-teal-600 dark:text-teal-400 text-sm">
                          {formatCurrency(reportData.totals.inventory_cost)}
                        </td>
                        <td className="p-3.5 text-right text-cyan-600 dark:text-cyan-400 text-sm">
                          {formatCurrency(reportData.totals.inventory_value)}
                        </td>
                        <td className="p-3.5 text-center text-sm">
                          {Number(reportData.totals.total_stock || 0).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right text-rose-600 dark:text-rose-400 text-sm">
                          {formatCurrency(reportData.totals.total_payables)}
                        </td>
                        <td className="p-3.5 text-center pr-4">
                          -
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
          <span>* Ganancias después de gastos = Ventas Totales - Gastos Totales</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
