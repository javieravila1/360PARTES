import React from 'react';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

interface ExcelActionsProps {
  data: any[];
  filename: string;
  onImport?: (data: any[]) => void;
}

export function ExcelActions({ data, filename, onImport }: ExcelActionsProps) {
  const handleExport = () => {
    if (data.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success('Archivo exportado correctamente');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws);
        
        if (onImport && parsedData.length > 0) {
          onImport(parsedData);
          toast.success('Datos importados correctamente');
        } else {
          toast.warning('El archivo no contiene datos válidos');
        }
      } catch (error) {
        toast.error('Error al importar el archivo Excel');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        title="Exportar a Excel"
      >
        <Download size={18} />
        Exportar
      </button>
      
      {onImport && (
        <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
          <Upload size={18} />
          Importar
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleImport}
          />
        </label>
      )}
    </div>
  );
}
