
import React, { useState } from 'react';

interface DataImportProps {
    onImport: (type: 'towels' | 'suppliers' | 'customers', data: any[]) => void;
}

type ImportType = 'towels' | 'suppliers' | 'customers';

// Declare global XLSX variable loaded from CDN
declare const XLSX: any;

export const DataImport: React.FC<DataImportProps> = ({ onImport }) => {
    const [importType, setImportType] = useState<ImportType>('towels');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    // Helper to find values flexibly (Case Insensitive, Partial Match)
    const findVal = (row: any, possibleKeys: string[]): any => {
        const rowKeys = Object.keys(row);
        
        // 1. Intento de coincidencia exacta o muy cercana
        for (const pKey of possibleKeys) {
            const match = rowKeys.find(k => k.toLowerCase().trim() === pKey.toLowerCase().trim());
            if (match) return row[match];
        }

        // 2. Intento de coincidencia parcial (ej: "Descripcion del producto" contiene "descripcion")
        for (const pKey of possibleKeys) {
            const match = rowKeys.find(k => k.toLowerCase().includes(pKey.toLowerCase().trim()));
            if (match) return row[match];
        }

        return undefined;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);
        setPreviewData([]);
        setFileName('');
        
        if (!file) return;
        setFileName(file.name);

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv') {
            setError("Formato no soportado. Use Excel (.xlsx, .xls) o CSV.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                parseExcel(data);
            } catch (err: any) {
                setError("Error al procesar el archivo: " + err.message);
            }
        };
        reader.onerror = () => setError("Error de lectura del archivo.");
        reader.readAsArrayBuffer(file);
    };

    const parseExcel = (data: any) => {
        try {
            if (typeof XLSX === 'undefined') {
                throw new Error("Librería Excel no cargada.");
            }

            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet);

            if (rawData.length === 0) {
                throw new Error("El archivo está vacío.");
            }

            // SMART MAPPING: Transform raw data into App Schema
            const mappedData = rawData.map((row: any) => {
                if (importType === 'towels') {
                    return {
                        id: findVal(row, ['id', 'sku', 'codigo', 'code', 'clave']) || `IMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                        // Busca 'descripcio' para atrapar 'descripción', 'descripcion del producto', etc.
                        name: findVal(row, ['name', 'nombre', 'producto', 'descripcio', 'articulo', 'item', 'modelo']) || 'Producto Sin Nombre',
                        stock: Number(findVal(row, ['stock', 'cantidad', 'qty', 'existencia', 'inventario', 'disponible'])) || 0,
                        cost: Number(findVal(row, ['cost', 'costo', 'precio', 'valor', 'price', 'unitario'])) || 0,
                        family: findVal(row, ['family', 'familia', 'marca', 'linea']) || 'General',
                        type: findVal(row, ['type', 'tipo', 'categoria', 'uso']) || 'Estándar',
                        dimensions: findVal(row, ['dimensions', 'dimensiones', 'medidas', 'tamaño', 'talla']) || 'N/A',
                        weight: Number(findVal(row, ['weight', 'peso', 'kg', 'masa'])) || 0.5,
                        // Agregado 'salon', 'zona', 'area'
                        aisle: findVal(row, ['aisle', 'pasillo', 'ubicacion', 'rack', 'salon', 'zona', 'area', 'bodega']) || 'Recepción',
                        supplierId: findVal(row, ['supplierId', 'proveedor', 'supplier']) || 'unknown'
                    };
                } else if (importType === 'suppliers') {
                    return {
                        id: findVal(row, ['id', 'codigo', 'clave']) || `SUP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                        name: findVal(row, ['name', 'nombre', 'empresa', 'razon social', 'proveedor']) || 'Proveedor Nuevo',
                        contact: findVal(row, ['contact', 'contacto', 'email', 'telefono', 'correo']) || 'N/A'
                    };
                } else {
                    return {
                        id: findVal(row, ['id', 'codigo']) || `CUST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                        name: findVal(row, ['name', 'nombre', 'cliente', 'razon social']) || 'Cliente Nuevo',
                        email: findVal(row, ['email', 'correo', 'contacto']) || 'sin@correo.com',
                        mainAddress: findVal(row, ['address', 'direccion', 'domicilio', 'calle']) || 'Dirección Pendiente',
                        destinations: [], // Default empty
                        specs: { // Default specs
                            requiresPortalUpload: false,
                            requiresPurchaseOrderOnInvoice: false,
                            requiresInsurancePolicy: false,
                            acceptedDocType: 'invoice'
                        }
                    };
                }
            });

            setPreviewData(mappedData);

        } catch (err: any) {
            setError(err.message);
            setPreviewData([]);
        }
    };

    const handleConfirmImport = () => {
        if (previewData.length === 0) {
            setError("No hay datos para importar.");
            return;
        }
        onImport(importType, previewData);
        alert(`¡Éxito! Se importaron ${previewData.length} registros. Los datos han sido actualizados.`);
        setPreviewData([]);
        setFileName('');
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Importación Flexible</h1>
                <p className="text-lg text-slate-500 mt-1">Suba sus archivos Excel o CSV tal cual los tiene. El sistema detectará los datos automáticamente.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-6 border border-slate-200">
                    <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">Tipo de Datos</label>
                        <select 
                            value={importType} 
                            onChange={(e) => {
                                setImportType(e.target.value as ImportType);
                                setPreviewData([]);
                                setFileName('');
                                setError(null);
                            }}
                            className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 text-slate-900"
                        >
                            <option value="towels">Inventario (Productos)</option>
                            <option value="suppliers">Proveedores</option>
                            <option value="customers">Clientes</option>
                        </select>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900 border border-blue-200">
                        <p className="font-bold mb-2">Modo Inteligente Activo 🧠</p>
                        <p>No necesita cambiar los nombres de sus columnas. El sistema reconocerá automáticamente:</p>
                        <ul className="list-disc list-inside mt-2 text-xs space-y-1 opacity-80">
                            {importType === 'towels' && <>
                                <li>"Producto", "Descripción del Producto", "Nombre"</li>
                                <li>"Cantidad", "Stock", "Existencia"</li>
                                <li>"Costo", "Precio", "Valor"</li>
                                <li>"Salón", "Ubicación", "Pasillo"</li>
                            </>}
                            {importType === 'customers' && <li>"Cliente", "Nombre", "Razón Social"</li>}
                            {importType === 'suppliers' && <li>"Proveedor", "Empresa"</li>}
                        </ul>
                        <p className="mt-2 text-xs font-bold">Si faltan datos, se rellenarán automáticamente.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">Seleccionar Archivo</label>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-red-50 file:text-red-700
                                hover:file:bg-red-100"
                        />
                        {fileName && <p className="mt-2 text-xs text-slate-500 font-bold text-center">{fileName}</p>}
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
                            ⚠️ {error}
                        </div>
                    )}

                    <button 
                        onClick={handleConfirmImport}
                        disabled={previewData.length === 0}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex justify-center items-center space-x-2"
                    >
                        <CloudArrowUpIcon className="h-5 w-5" />
                        <span>Importar Datos</span>
                    </button>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Vista Previa ({previewData.length} registros)</h2>
                    <div className="flex-1 overflow-auto border border-slate-200 rounded-lg min-h-[300px]">
                        {previewData.length > 0 ? (
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {Object.keys(previewData[0]).slice(0, 5).map((key) => (
                                            <th key={key} className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {previewData.slice(0, 20).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            {Object.values(row).slice(0, 5).map((val: any, i) => (
                                                <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-10">
                                <TableCellsIcon className="h-16 w-16 opacity-20" />
                                <p className="text-center">Suba un archivo para ver cómo <br/>el sistema interpreta sus datos.</p>
                            </div>
                        )}
                    </div>
                    {previewData.length > 20 && (
                        <p className="text-xs text-slate-400 mt-2 text-right">Mostrando primeros 20 de {previewData.length}...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const CloudArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

const TableCellsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M13.125 15.75h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 15.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
    </svg>
);
