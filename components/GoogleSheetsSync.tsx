
import React, { useState, useEffect } from 'react';
import type { Towel, Order, Customer, Supplier, InboundLot } from '../types';

interface GoogleSheetsSyncProps {
    towels: Towel[];
    setTowels?: React.Dispatch<React.SetStateAction<Towel[]>>;
    orders: Order[];
    setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
    customers: Customer[];
    suppliers: Supplier[];
    inboundLots: InboundLot[];
    setInboundLots?: React.Dispatch<React.SetStateAction<InboundLot[]>>;
    showNotification: (msg: string, type?: 'success' | 'error') => void;
}

const TARGET_SPREADSHEET_ID = '1xmdwvgYyXWKSHLQa3rhZkOUqtZoUfdXTM0drQ48S5Qk';
// Updated URL with specific GID as requested
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1xmdwvgYyXWKSHLQa3rhZkOUqtZoUfdXTM0drQ48S5Qk/edit?pli=1&gid=871199340#gid=871199340';

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({ 
    towels, setTowels, orders, inboundLots, setInboundLots, showNotification 
}) => {
    const [tab, setTab] = useState<'export' | 'import'>('export');
    
    // EXPORT STATE
    const [scriptUrl, setScriptUrl] = useState('');
    const [isConfigured, setIsConfigured] = useState(false); // New state to hide input
    const [isSyncing, setIsSyncing] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // IMPORT STATE
    const [importUrl, setImportUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Load saved URLs on mount
    useEffect(() => {
        const savedScriptUrl = localStorage.getItem('google_script_url');
        const savedImportUrl = localStorage.getItem('google_csv_url');
        
        if (savedScriptUrl) {
            setScriptUrl(savedScriptUrl);
            setIsConfigured(true); // Auto-hide input if url exists
        }
        if (savedImportUrl) setImportUrl(savedImportUrl);
    }, []);

    const handleSaveScriptUrl = () => {
        if (!scriptUrl.includes('/exec')) {
            showNotification('URL inválida. Debe terminar en /exec', 'error');
            return;
        }
        localStorage.setItem('google_script_url', scriptUrl);
        setIsConfigured(true);
        showNotification('✅ Enlace guardado correctamente.');
    };

    const handleEditUrl = () => {
        setIsConfigured(false);
    };

    const handleSaveImportUrl = (url: string) => {
        setImportUrl(url);
        localStorage.setItem('google_csv_url', url);
    };

    // --- EXPORT LOGIC ---
    const formatDataForSheet = () => {
        return {
            inventory: towels.map(t => ({ id: t.id, name: t.name, family: t.family, stock: t.stock, cost: t.cost, location: t.aisle })),
            orders: orders.map(o => ({ id: o.id, date: o.date, customer: o.partyId, total: o.total, status: o.status })),
            inbound: inboundLots.map(lot => ({ 
                id: lot.id, 
                supplier: lot.supplierId, 
                date: lot.arrivalDate, 
                status: lot.status === 'stored' ? 'Almacenado' : 'Pendiente', 
                totalItems: lot.items.reduce((acc, i) => acc + i.quantity, 0) 
            }))
        };
    };

    const syncData = async () => {
        if (!scriptUrl) return;

        setIsSyncing(true);
        const data = formatDataForSheet();

        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors', 
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(data)
            });
            showNotification('✅ ¡Cambios subidos a Google Sheets!', 'success');
        } catch (error) {
            console.error("Sync Error", error);
            showNotification('Error de conexión. Intente de nuevo.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    // --- IMPORT LOGIC ---
    const importDataFromCSV = async () => {
        if (!importUrl) {
            showNotification('Falta la URL del CSV publicado.', 'error');
            return;
        }
        if (!setInboundLots) return;

        setIsImporting(true);
        try {
            const response = await fetch(importUrl);
            if (!response.ok) throw new Error("No se pudo leer el archivo CSV.");
            
            const text = await response.text();
            const lines = text.split('\n').slice(1); // Skip header
            const newLots: InboundLot[] = [];
            
            lines.forEach(line => {
                const cols = line.split(',');
                if (cols.length >= 5) {
                    const id = cols[0].trim();
                    if (!id) return;
                    
                    const existingLot = newLots.find(l => l.id === id);
                    const item = { towelId: cols[3].trim(), quantity: Number(cols[4].trim()) || 0 };

                    if (existingLot) {
                        existingLot.items.push(item);
                    } else {
                        newLots.push({
                            id: id,
                            supplierId: cols[1].trim(),
                            arrivalDate: cols[2].trim(),
                            status: 'customs', 
                            items: [item]
                        });
                    }
                }
            });

            if (newLots.length > 0) {
                setInboundLots(prev => {
                    const combined = [...prev];
                    newLots.forEach(n => {
                        if (!combined.find(c => c.id === n.id)) combined.push(n);
                    });
                    return combined;
                });
                showNotification(`✅ Se cargaron ${newLots.length} nuevas entradas.`, 'success');
            } else {
                showNotification('No se encontraron datos nuevos.', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Error leyendo el CSV.', 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const scriptCode = `
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if(data.inventory) updateSheet(ss, 'Inventario', data.inventory, ['ID', 'Nombre', 'Familia', 'Stock', 'Costo', 'Ubicación']);
    if(data.orders) updateSheet(ss, 'Ordenes', data.orders, ['ID', 'Fecha', 'Cliente', 'Total', 'Estado']);
    if(data.inbound) updateSheet(ss, 'Entradas_Almaquita', data.inbound, ['Pedimento', 'Proveedor', 'Fecha', 'Estado', 'Total Piezas']);
    return ContentService.createTextOutput("OK");
  } catch (e) {
    return ContentService.createTextOutput("Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function updateSheet(ss, sheetName, data, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();
  sheet.appendRow(headers);
  if (data && data.length > 0) {
    var rows = data.map(function(item) { return Object.values(item); });
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}
`.trim();

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-green-600">
                            <TableCellsIcon className="h-8 w-8" />
                        </span>
                        Google Sheets Sync
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Sincronización de datos en la nube.</p>
                </div>
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                    <button 
                        onClick={() => setTab('export')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${tab === 'export' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <CloudArrowUpIcon className="h-4 w-4" />
                        1. SUBIR DATOS
                    </button>
                    <button 
                        onClick={() => setTab('import')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${tab === 'import' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        2. BAJAR ENTRADAS
                    </button>
                </div>
            </header>

            {tab === 'export' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    
                    {/* Main Action Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Panel de Control</h2>
                            <p className="text-slate-500 text-sm mb-6">Estado de la conexión y envío de datos.</p>

                            {isConfigured ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <CheckIcon className="h-5 w-5 text-green-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-800">Conexión Guardada</p>
                                            <p className="text-xs text-green-600 truncate max-w-[200px]">...{scriptUrl.slice(-20)}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleEditUrl} className="text-xs text-slate-500 underline hover:text-slate-800">
                                        Cambiar Link
                                    </button>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Pega aquí el Link del Script (Web App)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={scriptUrl} 
                                            onChange={(e) => setScriptUrl(e.target.value)}
                                            placeholder="https://script.google.com/.../exec"
                                            className="flex-1 p-3 border rounded bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        <button 
                                            onClick={handleSaveScriptUrl}
                                            className="px-4 bg-slate-800 text-white rounded font-bold hover:bg-slate-900"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Guarde el link una vez y la App lo recordará siempre.</p>
                                </div>
                            )}
                        </div>

                        {/* BIG ACTION BUTTON */}
                        <div className={`p-6 rounded-xl border-2 text-center transition-all ${isConfigured ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                             <div className="text-sm text-slate-600 mb-2">
                                Se actualizarán: <strong>{towels.length}</strong> Productos, <strong>{orders.length}</strong> Ordenes
                             </div>
                            <button 
                                onClick={syncData}
                                disabled={isSyncing || !isConfigured} 
                                className={`w-full py-5 text-white font-bold rounded-lg text-xl shadow-lg flex items-center justify-center gap-3 transition-all ${
                                    isSyncing ? 'bg-slate-400 cursor-wait' : 
                                    !isConfigured ? 'bg-slate-300 cursor-not-allowed' :
                                    'bg-green-600 hover:bg-green-700 hover:shadow-xl transform hover:scale-[1.02]'
                                }`}
                            >
                                {isSyncing ? (
                                    <>
                                        <ArrowPathIcon className="h-6 w-6 animate-spin" />
                                        Subiendo cambios...
                                    </>
                                ) : (
                                    <>
                                        <CloudArrowUpIcon className="h-6 w-6" />
                                        SUBIR CAMBIOS AHORA
                                    </>
                                )}
                            </button>
                            {!isConfigured && <p className="text-xs text-red-500 mt-2 font-bold">Configure y guarde el link primero.</p>}
                        </div>
                    </div>

                    {/* Instructions Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Instrucciones Técnicas</h2>
                            <button onClick={() => setShowInstructions(!showInstructions)} className="text-blue-600 font-bold text-sm underline">
                                {showInstructions ? 'Ocultar' : 'Ver Código'}
                            </button>
                        </div>
                        {showInstructions ? (
                            <div className="space-y-4 text-sm text-slate-600">
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Ir a Google Sheets &gt; Extensiones &gt; Apps Script.</li>
                                    <li>Pegar este código y guardar:</li>
                                    <textarea readOnly value={scriptCode} className="w-full h-24 p-2 bg-slate-800 text-green-400 font-mono text-xs rounded mt-1" />
                                    <li><strong>Implementar &gt; Nueva implementación &gt; Web App</strong>.</li>
                                    <li><span className="text-red-600 font-bold">IMPORTANTE:</span> Quién tiene acceso: <strong>"Cualquier usuario" (Anyone)</strong>.</li>
                                    <li>Copiar la URL (/exec) y pegarla en el panel izquierdo.</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded text-center text-slate-400 text-sm">
                                ¿Primera vez? Haga clic en "Ver Código" para configurar la hoja.
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t text-center">
                            <a href={GOOGLE_SHEET_URL} target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline flex items-center justify-center gap-2">
                                <TableCellsIcon className="h-4 w-4"/> Abrir Hoja de Google
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    {/* Import Config */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Cargar "Entradas" desde Hoja</h2>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-1">URL CSV (Publicado en Web)</label>
                            <input 
                                type="text" 
                                value={importUrl} 
                                onChange={(e) => handleSaveImportUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                                className="w-full p-3 border rounded bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center space-y-4">
                            <button 
                                onClick={importDataFromCSV}
                                disabled={isImporting || !importUrl} 
                                className={`w-full py-4 text-white font-bold rounded-lg text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                                    isImporting ? 'bg-slate-400 cursor-wait' : 
                                    !importUrl ? 'bg-slate-300 cursor-not-allowed' :
                                    'bg-blue-600 hover:bg-blue-700 transform hover:scale-[1.02]'
                                }`}
                            >
                                {isImporting ? 'Leyendo...' : 'CARGAR ENTRADAS'}
                            </button>
                        </div>
                    </div>

                    {/* Import Instructions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Ayuda</h2>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p>Utilice esta opción para traer datos de entradas (pedimentos) desde una hoja externa sin necesidad de macros.</p>
                            <p>Requiere que la hoja esté publicada como CSV en: <br/> <strong>Archivo &gt; Compartir &gt; Publicar en la Web</strong>.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Icons
const TableCellsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m13.5 2.625h-7.5c-.621 0-1.125-.504-1.125-1.125m7.5 0v-1.5c0-.621-.504-1.125-1.125-1.125m-9 0H3.375m0 0h1.5m12 0h-7.5m7.5 0v-1.5c0-.621-.504-1.125-1.125-1.125M3.375 9h17.25m-17.25 0h1.5m15.75 0h1.5m-1.5 0v-1.5c0-.621-.504-1.125-1.125-1.125m0 0h-3.75m-9 0H3.375m13.5 0H5.625c-.621 0-1.125.504-1.125 1.125" />
    </svg>
);

const CloudArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

const ArrowDownTrayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const ArrowPathIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);
