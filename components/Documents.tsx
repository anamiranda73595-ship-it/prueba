
import React, { useState } from 'react';
import type { Order, Towel, Customer, Supplier } from '../types';

interface DocumentsProps {
    orders: Order[];
    towels: Towel[];
    customers: Customer[];
    suppliers: Supplier[];
}

declare const jspdf: any;

export const Documents: React.FC<DocumentsProps> = ({ orders, towels, customers, suppliers }) => {
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');

    // Helper function to draw the vector logo on PDF
    const drawBrandLogo = (doc: any) => {
        // "Toallas" (Blue)
        doc.setFontSize(14);
        doc.setTextColor(21, 101, 192); // #1565C0
        doc.setFont("helvetica", "bold");
        doc.text("Toallas", 14, 15);

        // "LA JOSEFINA" (Red)
        doc.setFontSize(26);
        doc.setTextColor(198, 40, 40); // #C62828
        doc.setFont("helvetica", "bold");
        doc.text("LA JOSEFINA", 14, 25);

        // Slogan
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "italic");
        doc.text("Si secan desde nuevas", 14, 30);

        // Company Address Header (Right side)
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        const addressLines = [
            "Toallas Josefina S.A. de C.V.",
            "Av. Industrial #405, Col. Textil",
            "Puebla, PUE, CP 72000",
            "RFC: TJO900101ABC",
            "Tel: (55) 5555-5555"
        ];
        doc.text(addressLines, 200, 15, { align: "right" });

        // Decorative Line
        doc.setDrawColor(21, 101, 192); // Blue
        doc.setLineWidth(0.5);
        doc.line(14, 33, 196, 33);
    };

    // Generate PDF for Purchase History
    const generatePurchaseReport = () => {
        const supplier = suppliers.find(s => s.id === selectedSupplierId);
        if (!supplier) return;
        
        const purchaseOrders = orders.filter(o => o.type === 'purchase' && o.partyId === selectedSupplierId);
        const purchaseItems = purchaseOrders.flatMap(o => o.items).reduce((acc, item: { towelId: string; quantity: number }) => {
            if (acc[item.towelId]) {
                acc[item.towelId].quantity += item.quantity;
            } else {
                acc[item.towelId] = { ...item };
            }
            return acc;
        }, {} as { [key: string]: { towelId: string, quantity: number } });

        const tableData = Object.values(purchaseItems).map((item: { towelId: string; quantity: number }) => {
            const towel = towels.find(t => t.id === item.towelId);
            return [
                item.towelId,
                towel?.name || 'N/A',
                item.quantity,
                `$${towel?.cost.toFixed(2)}`,
                `$${((towel?.cost || 0) * item.quantity).toFixed(2)}`
            ];
        });

        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Draw Logo
        drawBrandLogo(doc);

        doc.setFontSize(18);
        doc.setTextColor(185, 28, 28); // Red 700
        doc.text("Reporte de Compras por Proveedor", 14, 45);
        
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50); 
        doc.text(`Proveedor: ${supplier.name}`, 14, 52);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 58);

        (doc as any).autoTable({
            startY: 65,
            head: [['Código', 'Tipo de Toalla', 'Cantidad Total', 'Costo Unitario', 'Inversión Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [21, 101, 192] }, // Blue
            // Fix line 104: Cast row[4] to string before calling replace.
            foot: [['', '', '', 'TOTAL:', `$${tableData.reduce((sum, row) => sum + parseFloat(String(row[4]).replace('$', '')), 0).toFixed(2)}`]]
        });

        doc.save(`Reporte_Compras_${supplier.name.replace(/\s/g, '_')}.pdf`);
    };

    // Generate PDF for Commercial Invoice
    const generateCommercialInvoice = (orderIdToPrint?: string) => {
        const id = orderIdToPrint || selectedOrderId;
        if (!id) {
            alert("Por favor seleccione un pedido.");
            return;
        }
        const order = orders.find(o => o.id === id);
        if (!order) return;
        
        const customer = customers.find(c => c.id === order.partyId);
        const customerName = customer ? customer.name : "Cliente Mostrador";
        // Fix line 122: Property 'address' does not exist on type 'Customer'. Use 'mainAddress' instead.
        const customerAddress = customer ? customer.mainAddress : "Sin Dirección";

        const tableData = order.items.map(item => {
             const towel = towels.find(t => t.id === item.towelId);
             const price = (towel?.cost || 0) * 1.5; // Sale price assumption
             return [
                 item.towelId,
                 towel?.name || 'N/A',
                 item.quantity,
                 `$${price.toFixed(2)}`,
                 `$${(price * item.quantity).toFixed(2)}`
             ];
        });

        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Draw Logo and Company Info
        drawBrandLogo(doc);

        // Document Title
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("FACTURA COMERCIAL", 160, 45, { align: "right" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Folio: ${order.id}`, 160, 50, { align: "right" });
        doc.text(`Fecha: ${new Date(order.date).toLocaleDateString()}`, 160, 55, { align: "right" });

        // Bill To Section
        doc.setFillColor(240, 240, 240);
        doc.rect(14, 40, 100, 25, 'F');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Facturar a:", 18, 45);
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(customerName, 18, 51);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(customerAddress, 18, 56, { maxWidth: 90 });

        (doc as any).autoTable({
            startY: 75,
            head: [['Código', 'Descripción', 'Cant.', 'Precio Unit.', 'Importe']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
                fillColor: [198, 40, 40], // Red brand color
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            foot: [['', '', '', 'TOTAL:', `$${order.total.toFixed(2)}`]],
            footStyles: {
                fillColor: [245, 245, 245],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            }
        });
        
        // Footer Notes
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Este documento es una representación impresa de un CFDI.", 14, finalY);
        doc.text("Debo y pagaré incondicionalmente a la orden de Toallas Josefina S.A. de C.V.", 14, finalY + 5);

        doc.save(`Factura_${order.id}.pdf`);
    };
    
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Centro de Documentos</h1>
                <p className="text-lg text-slate-500 mt-1">Generación de documentación oficial.</p>
            </header>

             {/* Order History Table - Added to show visibility of created orders */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Historial de Documentos</h2>
                <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 font-semibold text-sm text-slate-700">Folio</th>
                                <th className="p-3 font-semibold text-sm text-slate-700">Fecha</th>
                                <th className="p-3 font-semibold text-sm text-slate-700">Entidad</th>
                                <th className="p-3 font-semibold text-sm text-slate-700">Tipo</th>
                                <th className="p-3 font-semibold text-sm text-slate-700">Monto</th>
                                <th className="p-3 font-semibold text-sm text-slate-700">Descarga</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => {
                                const name = order.type === 'sale' 
                                    ? customers.find(c => c.id === order.partyId)?.name 
                                    : suppliers.find(s => s.id === order.partyId)?.name;
                                return (
                                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3 font-mono text-sm font-bold text-slate-700">{order.id}</td>
                                        <td className="p-3 text-slate-600 text-sm">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-slate-800 text-sm truncate max-w-[150px]">{name || 'Desconocido'}</td>
                                        <td className="p-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {order.type === 'sale' ? 'Factura' : 'O. Compra'}
                                            </span>
                                        </td>
                                        <td className="p-3 font-bold text-slate-900 text-sm">${order.total.toLocaleString()}</td>
                                        <td className="p-3">
                                            {order.type === 'sale' && (
                                                <button 
                                                    onClick={() => generateCommercialInvoice(order.id)}
                                                    className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-xs font-bold border border-red-200 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    <DocumentArrowDownIcon className="w-3 h-3" />
                                                    <span>PDF</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Facturación Manual</h2>
                    <p className="text-slate-500 text-sm mb-4">Seleccione un pedido de venta para generar su factura comercial.</p>
                    <div className="flex flex-col gap-4">
                        <select
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="p-3 bg-white border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                        >
                            <option value="">-- Seleccione Pedido --</option>
                            {orders.filter(o => o.type === 'sale').map(o => (
                                <option key={o.id} value={o.id}>{o.id} - {customers.find(c => c.id === o.partyId)?.name || 'Cliente'} (${o.total})</option>
                            ))}
                        </select>
                        <button
                            onClick={() => generateCommercialInvoice()}
                            disabled={!selectedOrderId}
                            className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 disabled:bg-slate-400 transition-colors flex items-center justify-center space-x-2"
                        >
                           <DocumentArrowDownIcon className="h-5 w-5" />
                           <span>Generar Factura</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Reportes de Proveedores</h2>
                    <p className="text-slate-500 text-sm mb-4">Descargue el historial de compras acumulado por proveedor.</p>
                    <div className="flex flex-col gap-4">
                        <select
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            className="p-3 bg-white border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                        >
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button
                            onClick={generatePurchaseReport}
                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                        >
                           <DocumentArrowDownIcon className="h-5 w-5" />
                           <span>Descargar Reporte</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DocumentArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.165 2.165L18.75 12m-1.25 3.75h.008v.008h-.008v-.008z" />
         <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6" />
    </svg>
);
