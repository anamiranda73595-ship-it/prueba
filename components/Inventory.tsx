
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Towel, Supplier, Customer, Order, Carrier } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface InventoryProps {
    towels: Towel[];
    setTowels: React.Dispatch<React.SetStateAction<Towel[]>>;
    suppliers: Supplier[];
    customers: Customer[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    carriers: Carrier[];
    showNotification: (msg: string, type?: 'success' | 'error') => void;
}

interface TowelDetailModalProps {
    towel: Towel;
    onClose: () => void;
    suppliers: Supplier[];
    customers: Customer[];
    carriers: Carrier[];
    onUpdateStock: (quantity: number, type: 'add' | 'remove', customerId?: string, destinationId?: string, freightPayer?: 'client' | 'company' | 'supplier', carrierId?: string) => void;
}

interface NewProductModalProps {
    scannedCode: string;
    onClose: () => void;
    onSave: (towel: Towel) => void;
    suppliers: Supplier[];
}

interface BarcodeLabelModalProps {
    towel: Towel;
    onClose: () => void;
}

// Global declaration for external libraries loaded via CDN
declare const JsBarcode: any;
declare const html2canvas: any;

const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({ towel, onClose }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);
    const labelContainerRef = useRef<HTMLDivElement>(null);

    // Calculate time in warehouse
    const productionDate = towel.productionDate ? new Date(towel.productionDate) : new Date('2023-01-01');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - productionDate.getTime());
    const daysInWarehouse = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Determine Client
    const clientName = "Stock General / Libre"; 
    const lotNumber = towel.lotNumber || `L-${towel.id.slice(-4)}`;

    useEffect(() => {
        // Use a small timeout to ensure DOM element is rendered
        const timer = setTimeout(() => {
            if (barcodeRef.current && typeof JsBarcode !== 'undefined') {
                try {
                    // We encode the ID and Lot Number into the barcode for scanning
                    JsBarcode(barcodeRef.current, towel.id, {
                        format: "CODE128",
                        lineColor: "#000",
                        width: 2,
                        height: 60,
                        displayValue: true,
                        fontSize: 14,
                        textMargin: 4,
                        margin: 10
                    });
                } catch (e) {
                    console.error("Error generating Barcode", e);
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [towel]);

    const handleDownloadImage = async () => {
        if (!labelContainerRef.current || typeof html2canvas === 'undefined') {
            alert("Error: Librería de imagen no cargada.");
            return;
        }

        try {
            // Generate canvas from the DOM element
            const canvas = await html2canvas(labelContainerRef.current, {
                scale: 3, // Higher scale for better resolution
                backgroundColor: '#ffffff', // Ensure white background
                logging: false,
                useCORS: true
            });

            // Create a fake link to trigger download
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `Etiqueta_${towel.id}_${lotNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (err) {
            console.error("Error al descargar la imagen:", err);
            alert("No se pudo generar la imagen de la etiqueta.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white no-print">
                    <h2 className="text-lg font-bold">Etiqueta de Inventario</h2>
                    <button onClick={onClose} className="text-white hover:text-slate-300 text-2xl font-bold">&times;</button>
                </div>
                
                <div className="p-6 flex flex-col items-center space-y-4">
                    {/* Label Preview Area - Ref Attached Here */}
                    <div ref={labelContainerRef} id="printable-label" className="w-full border-4 border-slate-900 rounded-lg p-5 bg-white shadow-md relative overflow-hidden">
                        {/* Header of the Label */}
                        <div className="border-b-2 border-slate-900 pb-2 mb-3 flex justify-between items-end">
                            <div>
                                <h3 className="font-bold text-xl uppercase text-slate-900 leading-tight">{towel.family}</h3>
                                <p className="text-[10px] text-slate-500 font-bold tracking-wider">LA JOSEFINA</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-3xl font-bold text-slate-900 leading-none">{towel.stock}</span>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Unidades</span>
                            </div>
                        </div>

                        {/* Detailed Specifications Text */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-800 mb-3">
                            <div className="col-span-2 border-b border-dashed border-slate-200 pb-1">
                                <span className="font-bold text-[10px] text-slate-500 uppercase block">Producto</span>
                                <span className="font-bold block leading-tight">{towel.name}</span>
                            </div>
                            <div>
                                <span className="font-bold text-[10px] text-slate-500 uppercase block">Lote</span>
                                <span className="font-mono bg-slate-100 px-1 rounded">{lotNumber}</span>
                            </div>
                             <div>
                                <span className="font-bold text-[10px] text-slate-500 uppercase block">Ubicación</span>
                                <span className="bg-yellow-300 px-1 rounded font-bold text-slate-900">{towel.aisle || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="font-bold text-[10px] text-slate-500 uppercase block">Cliente Asignado</span>
                                <span className="truncate block">{clientName}</span>
                            </div>
                            <div>
                                <span className="font-bold text-[10px] text-slate-500 uppercase block">Entrada</span>
                                <span>{towel.productionDate || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-[10px] text-slate-500 uppercase block">Antigüedad</span>
                                <span className={daysInWarehouse > 90 ? 'text-red-600 font-bold' : ''}>{daysInWarehouse} días</span>
                            </div>
                        </div>

                        {/* Barcode Area */}
                        <div className="flex justify-center border-t-2 border-slate-900 pt-3">
                            <svg ref={barcodeRef} className="w-full"></svg>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full no-print">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Regresar
                        </button>
                        <button 
                            onClick={handleDownloadImage}
                            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex justify-center items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span>Descargar Imagen</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewProductModal: React.FC<NewProductModalProps> = ({ scannedCode, onClose, onSave, suppliers }) => {
    const [formData, setFormData] = useState<Partial<Towel>>({
        id: scannedCode,
        name: '',
        stock: 0,
        cost: 0,
        aisle: '',
        specifications: '',
        supplierId: suppliers[0]?.id || ''
    });

    const handleSubmit = () => {
        if (!formData.name || !formData.stock || !formData.cost) {
            alert("Por favor complete los campos obligatorios.");
            return;
        }
        const newTowel: Towel = {
            id: formData.id!,
            name: formData.name!,
            family: 'General', type: 'Estándar', dimensions: 'N/A', weight: 0, 
            lotNumber: `L-${Date.now().toString().slice(-6)}`, 
            productionDate: new Date().toISOString().split('T')[0],
            aisle: formData.aisle || 'Pendiente',
            specifications: formData.specifications || 'N/A',
            stock: Number(formData.stock),
            cost: Number(formData.cost),
            supplierId: formData.supplierId || 'unknown'
        };
        onSave(newTowel);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 border border-slate-200">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900">Nuevo Producto Detectado</h2>
                    <p className="text-sm text-slate-500">Código: {scannedCode}</p>
                </div>
                <div className="p-6 space-y-4">
                    <input type="text" placeholder="Nombre" className="w-full p-2 border rounded bg-white text-slate-900" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Stock" className="w-full p-2 border rounded bg-white text-slate-900" 
                            value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                        <input type="number" placeholder="Costo" className="w-full p-2 border rounded bg-white text-slate-900" 
                            value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} />
                    </div>
                    <input type="text" placeholder="Pasillo / Ubicación" className="w-full p-2 border rounded bg-white text-slate-900" 
                         value={formData.aisle} onChange={e => setFormData({...formData, aisle: e.target.value})} />
                    <select className="w-full p-2 border rounded bg-white text-slate-900"
                        value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="p-6 border-t bg-slate-50 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white border rounded text-slate-900">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">Guardar</button>
                </div>
            </div>
        </div>
    );
}

const TowelDetailModal: React.FC<TowelDetailModalProps> = ({ towel, onClose, suppliers, customers, carriers, onUpdateStock }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'in' | 'out'>('details');
    const [quantity, setQuantity] = useState<number>(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
    const [freightPayer, setFreightPayer] = useState<'client' | 'company' | 'supplier'>('client');
    const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');
    
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const handleSubmit = () => {
        if (quantity <= 0) return;
        
        if (activeTab === 'in') {
            onUpdateStock(quantity, 'add');
            setQuantity(0);
        } else if (activeTab === 'out') {
            if (!selectedCustomerId || !selectedDestinationId) {
                alert("Seleccione cliente y destino.");
                return;
            }
            onUpdateStock(quantity, 'remove', selectedCustomerId, selectedDestinationId, freightPayer, selectedCarrierId);
            setQuantity(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 border border-slate-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b bg-slate-50 flex justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">{towel.name}</h2>
                    <button onClick={onClose} className="text-2xl text-slate-500 hover:text-slate-800">&times;</button>
                </div>

                <div className="flex border-b">
                    <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 font-medium ${activeTab === 'details' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500'}`}>Detalles</button>
                    <button onClick={() => setActiveTab('in')} className={`flex-1 py-3 font-medium ${activeTab === 'in' ? 'border-b-2 border-green-600 text-green-600' : 'text-slate-500'}`}>Entrada</button>
                    <button onClick={() => setActiveTab('out')} className={`flex-1 py-3 font-medium ${activeTab === 'out' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Venta / Salida</button>
                </div>

                <div className="p-8 overflow-y-auto text-slate-900">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="font-bold text-slate-600">Stock:</p><p className="text-lg">{towel.stock}</p></div>
                            <div><p className="font-bold text-slate-600">Ubicación:</p><p className="text-lg">{towel.aisle}</p></div>
                            <div><p className="font-bold text-slate-600">Lote:</p><p className="text-lg">{towel.lotNumber || 'N/A'}</p></div>
                            <div><p className="font-bold text-slate-600">Costo:</p><p className="text-lg">${towel.cost}</p></div>
                        </div>
                    )}

                    {activeTab === 'in' && (
                        <div className="space-y-4">
                            <input type="number" className="w-full p-3 border rounded bg-white text-slate-900" placeholder="Cantidad a agregar"
                                value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} />
                            <button onClick={handleSubmit} className="w-full py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700">Confirmar Entrada</button>
                        </div>
                    )}

                    {activeTab === 'out' && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                <h3 className="font-bold text-sm text-red-700 uppercase">Configuración de Orden ("Documento Rey")</h3>
                                
                                {/* Cliente */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Cliente</label>
                                    <select className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={selectedCustomerId} onChange={e => {
                                            setSelectedCustomerId(e.target.value);
                                            setSelectedDestinationId('');
                                        }}>
                                        <option value="">Seleccione Cliente...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Destino */}
                                {selectedCustomer && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Destino / Sucursal</label>
                                        <select className="w-full p-2 border rounded bg-white text-slate-900"
                                            value={selectedDestinationId} onChange={e => setSelectedDestinationId(e.target.value)}>
                                            <option value="">Seleccione Sucursal...</option>
                                            {selectedCustomer.destinations.map(d => (
                                                <option key={d.id} value={d.id}>{d.name} - {d.address}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                {/* Flete */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">¿Quién paga el flete?</label>
                                    <div className="flex gap-4 text-sm bg-white p-2 border rounded">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freight" checked={freightPayer === 'client'} onChange={() => setFreightPayer('client')} /> 
                                            <span>Cliente</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freight" checked={freightPayer === 'company'} onChange={() => setFreightPayer('company')} /> 
                                            <span>La Josefina</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Transportista */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Línea de Transporte Preferida</label>
                                    <select className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={selectedCarrierId} onChange={e => setSelectedCarrierId(e.target.value)}>
                                        <option value="">Sin preferencia / Definir en ruta</option>
                                        {carriers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.type === 'parcel' ? 'Paquetería' : 'Flota'})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <input type="number" className="w-full p-3 border rounded bg-white text-slate-900" placeholder="Cantidad a vender"
                                value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} />
                            
                            <button onClick={handleSubmit} className="w-full py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Generar Orden de Venta</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export const Inventory: React.FC<InventoryProps> = ({ towels, suppliers, setTowels, customers, setOrders, carriers, showNotification }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTowel, setSelectedTowel] = useState<Towel | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedNewCode, setScannedNewCode] = useState<string | null>(null);
    
    // Barcode Label Modal State
    const [labelTowel, setLabelTowel] = useState<Towel | null>(null);

    const filteredTowels = useMemo(() => {
        return towels.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.includes(searchTerm));
    }, [searchTerm, towels]);

    const handleStockUpdate = (quantity: number, type: 'add' | 'remove', customerId?: string, destinationId?: string, freightPayer: 'client' | 'company' | 'supplier' = 'client', carrierId?: string) => {
        if (!selectedTowel) return;
        const newStock = type === 'add' ? selectedTowel.stock + quantity : selectedTowel.stock - quantity;
        const updatedTowel = { ...selectedTowel, stock: newStock };
        setTowels(prev => prev.map(t => t.id === selectedTowel.id ? updatedTowel : t));
        setSelectedTowel(updatedTowel);

        if (type === 'remove' && customerId && destinationId) {
            const customer = customers.find(c => c.id === customerId);
            const destination = customer?.destinations.find(d => d.id === destinationId);
            
            const newOrder: Order = {
                id: `SO-${Math.floor(1000 + Math.random() * 9000)}`,
                type: 'sale',
                items: [{ towelId: selectedTowel.id, quantity }],
                partyId: customerId,
                date: new Date().toISOString(),
                status: 'pending',
                total: quantity * selectedTowel.cost * 1.5,
                destinationId: destinationId,
                destinationAddress: destination?.address || 'Dirección Desconocida',
                addressStatus: 'original',
                freightPayer: freightPayer,
                preferredCarrierId: carrierId,
                packingListValidated: false,
                bundles: []
            };
            setOrders(prev => [newOrder, ...prev]);
            showNotification(`Orden ${newOrder.id} creada para ${destination?.name}`);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
            </header>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex gap-2 mb-4">
                    <input className="flex-1 p-3 border rounded bg-white text-slate-900" placeholder="Buscar por nombre o código..." 
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <button onClick={() => setIsScanning(true)} className="px-6 bg-red-600 text-white rounded font-bold hover:bg-red-700">Escanear</button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-3 text-slate-700 font-bold">ID</th>
                                <th className="p-3 text-slate-700 font-bold">Nombre</th>
                                <th className="p-3 text-slate-700 font-bold">Ubicación</th>
                                <th className="p-3 text-slate-700 font-bold">Stock</th>
                                <th className="p-3 text-slate-700 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTowels.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No se encontraron productos.</td>
                                </tr>
                            ) : (
                                filteredTowels.map(t => (
                                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3 font-mono text-slate-600">{t.id}</td>
                                        <td className="p-3 text-slate-900 font-medium">{t.name}</td>
                                        <td className="p-3 text-slate-600">{t.aisle}</td>
                                        <td className="p-3 font-bold text-slate-900">{t.stock}</td>
                                        <td className="p-3 flex items-center space-x-3">
                                            <button onClick={() => setSelectedTowel(t)} className="text-red-600 font-bold underline hover:text-red-800">Ver</button>
                                            <button 
                                                onClick={() => setLabelTowel(t)} 
                                                className="text-slate-500 hover:text-slate-800"
                                                title="Etiqueta Código de Barras"
                                            >
                                                {/* Barcode Icon */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM15 15H9v6" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedTowel && <TowelDetailModal towel={selectedTowel} onClose={() => setSelectedTowel(null)} suppliers={suppliers} customers={customers} carriers={carriers} onUpdateStock={handleStockUpdate} />}
            {labelTowel && <BarcodeLabelModal towel={labelTowel} onClose={() => setLabelTowel(null)} />}
            {isScanning && <BarcodeScannerModal onClose={() => setIsScanning(false)} onScanSuccess={(code) => {
                setIsScanning(false);
                const match = towels.find(t => t.id === code);
                if (match) setSelectedTowel(match);
                else setScannedNewCode(code);
            }} mockTowelIds={towels.map(t => t.id)} />}
            {scannedNewCode && <NewProductModal scannedCode={scannedNewCode} onClose={() => setScannedNewCode(null)} onSave={(t) => {
                setTowels(prev => [...prev, t]);
                setScannedNewCode(null);
                setSelectedTowel(t);
            }} suppliers={suppliers} />}
        </div>
    );
};
