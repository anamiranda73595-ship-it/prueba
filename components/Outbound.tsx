
import React, { useState } from 'react';
import type { Order, Towel, Bundle, Customer } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface OutboundProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    towels: Towel[];
    customers: Customer[];
    showNotification: (msg: string, type?: 'success' | 'error') => void;
}

declare const jspdf: any;

export const Outbound: React.FC<OutboundProps> = ({ orders, setOrders, towels, customers, showNotification }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    
    const selectedCustomer = customers.find(c => c.id === selectedOrder?.partyId);

    const handleCreateBundle = () => {
        if (!selectedOrder) return;
        const nextBundleNum = selectedOrder.bundles.length + 1;
        const newBundle: Bundle = {
            id: `B-${selectedOrder.id}-${nextBundleNum}`,
            orderId: selectedOrder.id,
            number: nextBundleNum,
            weight: 15.5,
            items: selectedOrder.items.map(i => ({ ...i, quantity: Math.ceil(i.quantity / 2) })) 
        };
        const updatedOrder = { ...selectedOrder, bundles: [...selectedOrder.bundles, newBundle], status: 'packed' as const };
        updateOrderState(updatedOrder);
        showNotification(`Bulto #${nextBundleNum} creado.`);
    };

    const validatePackingList = () => {
        if (!selectedOrder) return;
        // Check locks
        if (selectedOrder.addressStatus === 'modified_by_email') {
            if (!confirm("⚠️ ADVERTENCIA: La dirección de entrega fue modificada por correo. ¿Confirmar que la guía de embarque coincida?")) {
                return;
            }
        }
        // Check specs
        if (selectedCustomer?.specs.requiresPortalUpload) {
             if (!confirm(`⚠️ REQUISITO: ¿Ya se subieron los documentos al portal ${selectedCustomer.specs.portalUrl}?`)) {
                return;
             }
        }

        const updatedOrder = { ...selectedOrder, packingListValidated: true };
        updateOrderState(updatedOrder);
        showNotification("Lista de Empaque VALIDADA y CANDADO CERRADO.");
    };

    const generateInvoice = () => {
        if (!selectedOrder || !selectedOrder.packingListValidated) {
            showNotification("BLOQUEO: Valide Lista de Empaque primero.", "error");
            return;
        }
        const updatedOrder = { ...selectedOrder, status: 'invoiced' as const, invoiceXml: 'xml-uuid' };
        updateOrderState(updatedOrder);
        showNotification("Factura Timbrada Correctamente.");
    };

    const updateOrderState = (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
    };

    const generatePackingListPDF = () => {
        if (!selectedOrder) return;
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Lista de Empaque / Packing List", 14, 20);
        doc.setFontSize(12);
        doc.text(`Orden: ${selectedOrder.id}`, 14, 30);
        doc.text(`Cliente: ${selectedCustomer?.name}`, 14, 36);
        doc.text(`Destino: ${selectedOrder.destinationAddress}`, 14, 42);

        const rows: any[] = [];
        selectedOrder.bundles.forEach(b => {
            b.items.forEach(item => {
                const t = towels.find(x => x.id === item.towelId);
                rows.push([`Bulto ${b.number}`, t?.name || item.towelId, item.quantity, `${b.weight} kg`]);
            });
        });

        (doc as any).autoTable({
            startY: 50,
            head: [['Contenedor', 'Producto', 'Cantidad', 'Peso Neto']],
            body: rows,
        });

        doc.save(`PackingList_${selectedOrder.id}.pdf`);
    };

    return (
        <div className="space-y-6">
            <header><h1 className="text-3xl font-bold text-slate-900">Surtido y Empaque</h1></header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 h-[600px] overflow-y-auto">
                    <h3 className="font-bold mb-4">Órdenes Activas</h3>
                    {orders.filter(o => ['released', 'picking', 'packed', 'invoiced'].includes(o.status)).map(o => (
                        <div key={o.id} onClick={() => setSelectedOrder(o)} className={`p-3 mb-2 border rounded cursor-pointer ${selectedOrder?.id === o.id ? 'bg-red-50 border-red-500' : 'bg-white'}`}>
                            <div className="flex justify-between font-bold"><span>{o.id}</span><span className="text-xs bg-slate-100 px-2 rounded">{o.status}</span></div>
                            <p className="text-xs text-slate-500 truncate">{o.destinationAddress}</p>
                            {o.addressStatus === 'modified_by_email' && <p className="text-xs text-red-600 font-bold bg-red-50 p-1 mt-1 rounded">⚠️ Dirección Modificada</p>}
                        </div>
                    ))}
                </div>

                {selectedOrder ? (
                    <div className="lg:col-span-2 space-y-6">
                        {/* Compliance Specs Alert */}
                        {selectedCustomer && (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700">
                                    Especificaciones de Cliente: {selectedCustomer.name}
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                                    <div className={`p-3 rounded border ${selectedCustomer.specs.requiresPortalUpload ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                                        <span className="block font-bold">Subir a Portal</span>
                                        {selectedCustomer.specs.requiresPortalUpload ? `Requerido: ${selectedCustomer.specs.portalUrl}` : 'No requerido'}
                                    </div>
                                    <div className={`p-3 rounded border ${selectedCustomer.specs.requiresPurchaseOrderOnInvoice ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                                        <span className="block font-bold">Orden de Compra</span>
                                        {selectedCustomer.specs.requiresPurchaseOrderOnInvoice ? 'Obligatoria en Factura' : 'Opcional'}
                                    </div>
                                    <div className="p-3 rounded border bg-blue-50 border-blue-200 text-blue-800 col-span-2">
                                        <span className="font-bold mr-2">Tipo Documentación:</span>
                                        {selectedCustomer.specs.acceptedDocType === 'invoice' ? 'Solo Factura' : 
                                         selectedCustomer.specs.acceptedDocType === 'remittance' ? 'Solo Remisión' : 'Factura + Remisión'}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Orden {selectedOrder.id}</h2>
                                    <p className="text-sm text-slate-500">Destino Actual: {selectedOrder.destinationAddress}</p>
                                </div>
                                {selectedOrder.bundles.length > 0 && 
                                    <button onClick={generatePackingListPDF} className="text-red-600 text-sm font-bold underline hover:text-red-800">
                                        📄 Descargar Lista Empaque
                                    </button>
                                }
                            </div>

                            <div className="flex gap-2 mb-6">
                                <button onClick={handleCreateBundle} disabled={selectedOrder.packingListValidated} className="px-4 py-2 border rounded font-bold hover:bg-slate-50 disabled:opacity-50">+ Armar Bulto</button>
                                <button onClick={() => setIsScanning(true)} className="px-4 py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-900">Escanear QR Bulto</button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {selectedOrder.bundles.map(b => (
                                    <div key={b.id} className="p-3 border rounded bg-slate-50 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">Bulto #{b.number}</p>
                                            <p className="text-xs text-slate-500">{b.items.length} productos</p>
                                        </div>
                                        <span className="text-sm font-mono bg-white px-2 py-1 border rounded">{b.weight}kg</span>
                                    </div>
                                ))}
                                {selectedOrder.bundles.length === 0 && <p className="text-slate-400 col-span-2 text-center py-4">No hay bultos armados.</p>}
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                {!selectedOrder.packingListValidated ? (
                                    <button 
                                        onClick={validatePackingList} 
                                        disabled={selectedOrder.bundles.length === 0}
                                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-slate-300"
                                    >
                                        Validar Lista y Cerrar Candado
                                    </button>
                                ) : (
                                    <div className="flex gap-3">
                                        <span className="px-4 py-3 bg-green-100 text-green-800 rounded font-bold border border-green-200 flex items-center">
                                            ✓ Validado
                                        </span>
                                        {selectedOrder.status !== 'invoiced' &&
                                            <button onClick={generateInvoice} className="px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow-lg">
                                                Timbrar Factura
                                            </button>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-2 flex items-center justify-center bg-slate-50 border border-dashed rounded text-slate-400">Seleccione orden para iniciar surtido</div>
                )}
            </div>
            {isScanning && <BarcodeScannerModal onClose={() => setIsScanning(false)} onScanSuccess={(code) => {
                setIsScanning(false);
                // Simulate verify check
                alert(`Bulto ${code} verificado correctamente. Coincide con Orden ${selectedOrder?.id}`);
            }} mockTowelIds={[]} />}
        </div>
    );
};
