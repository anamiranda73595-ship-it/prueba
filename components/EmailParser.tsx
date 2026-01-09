
import React, { useState } from 'react';
import type { ParsedEmailResult, Supplier, Order } from '../types';

interface EmailParserProps {
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    showNotification: (msg: string, type?: 'success' | 'error') => void;
}

const MOCK_INBOX = [
    { id: 'e1', sender: 'logistica@hyatt.com', subject: 'Cambio destino SO-1001', date: '10:30 AM', body: 'Favor de cambiar la entrega de la orden SO-1001. Ya no entregar en Hotel Principal. Nueva dirección: Bodega Playa, Calle 5ta Avenida.' },
];

export const EmailParser: React.FC<EmailParserProps> = ({ orders, setOrders, showNotification }) => {
    const [emails] = useState(MOCK_INBOX);
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [analysis, setAnalysis] = useState<ParsedEmailResult | null>(null);

    const handleAnalyze = () => {
        // Mock Analysis Logic simulating AI
        if (selectedEmail.body.includes('SO-1001')) {
            setAnalysis({
                hasChange: true,
                orderId: 'SO-1001',
                provider: 'Grand Hyatt',
                newAddress: 'Bodega Playa, Calle 5ta Avenida',
                instructionType: 'address_change'
            });
        }
    };

    const handleApplyChange = () => {
        if (!analysis || !analysis.orderId || !analysis.newAddress) return;
        
        setOrders(prev => prev.map(o => {
            if (o.id === analysis.orderId) {
                return {
                    ...o,
                    destinationAddress: analysis.newAddress!,
                    addressStatus: 'modified_by_email' as const
                };
            }
            return o;
        }));
        showNotification(`Orden ${analysis.orderId} actualizada con nueva dirección.`);
        setAnalysis(null);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            <div className="w-1/3 bg-white border rounded-xl overflow-hidden">
                {emails.map(e => (
                    <div key={e.id} onClick={() => setSelectedEmail(e)} className="p-4 border-b hover:bg-slate-50 cursor-pointer">
                        <p className="font-bold text-sm">{e.sender}</p>
                        <p className="text-xs font-bold">{e.subject}</p>
                        <p className="text-xs text-slate-500 truncate">{e.body}</p>
                    </div>
                ))}
            </div>
            <div className="flex-1 bg-white border rounded-xl p-6 flex flex-col">
                {selectedEmail ? (
                    <>
                        <h2 className="text-xl font-bold mb-4">{selectedEmail.subject}</h2>
                        <p className="mb-6 bg-slate-50 p-4 rounded">{selectedEmail.body}</p>
                        <button onClick={handleAnalyze} className="self-start px-4 py-2 bg-purple-600 text-white rounded font-bold mb-4">Analizar con IA</button>
                        
                        {analysis && analysis.hasChange && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                                <h3 className="font-bold text-yellow-800">⚠️ Cambio Detectado</h3>
                                <p className="text-sm">Orden Afectada: <strong>{analysis.orderId}</strong></p>
                                <p className="text-sm">Nueva Dirección: <strong>{analysis.newAddress}</strong></p>
                                <button onClick={handleApplyChange} className="mt-3 px-4 py-2 bg-green-600 text-white rounded font-bold text-sm">Aprobar y Actualizar Orden</button>
                            </div>
                        )}
                    </>
                ) : <p className="text-slate-400 m-auto">Seleccione correo</p>}
            </div>
        </div>
    );
};
