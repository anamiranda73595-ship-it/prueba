
import React, { useState } from 'react';
import type { InboundLot, Location, Towel } from '../types';

interface WMSProps {
    towels: Towel[];
    setTowels: React.Dispatch<React.SetStateAction<Towel[]>>;
    inboundLots: InboundLot[];
    setInboundLots: React.Dispatch<React.SetStateAction<InboundLot[]>>;
    locations: Location[];
    setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
    showNotification: (msg: string, type?: 'success' | 'error') => void;
}

const LocationInspectorModal: React.FC<{ location: Location; onClose: () => void }> = ({ location, onClose }) => {
    const totalItems = location.items.reduce((acc, i) => acc + i.quantity, 0);
    const fillPercentage = Math.min((totalItems * 0.5) / location.capacityKg * 100, 100);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">Inspección: {location.id}</h3>
                    <button onClick={onClose} className="text-white hover:text-slate-300 font-bold text-xl">&times;</button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Salón / Pasillo</p>
                            <p className="font-bold text-slate-900">{location.hall}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Nivel</p>
                            <p className="font-bold text-slate-900">{location.level}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Capacidad Utilizada</p>
                        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border">
                            <div 
                                className={`h-full transition-all duration-500 ${fillPercentage > 80 ? 'bg-red-500' : fillPercentage > 0 ? 'bg-blue-500' : 'bg-slate-300'}`} 
                                style={{ width: `${fillPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-right text-[10px] mt-1 text-slate-500 font-bold">{fillPercentage.toFixed(1)}% OCUPADO</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 max-h-48 overflow-y-auto">
                        <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                             <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 
                             Stock en Ubicación:
                        </p>
                        {location.items.length === 0 ? (
                            <p className="text-slate-400 italic text-sm text-center py-4">Ubicación Vacía</p>
                        ) : (
                            <ul className="space-y-1">
                                {location.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                                        <span className="font-mono text-slate-600">{item.towelId}</span>
                                        <span className="font-black text-slate-900">{item.quantity} pz</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100 transition-colors">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const ReceivingModal: React.FC<{ 
    lot: InboundLot; 
    locations: Location[]; 
    onClose: () => void; 
    onConfirm: (lotId: string, targetLocationId: string) => void 
}> = ({ lot, locations, onClose, onConfirm }) => {
    const [selectedLocId, setSelectedLocId] = useState('');
    const availableLocations = locations.filter(l => l.items.length === 0 || l.items.length < 5);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full m-4 border border-slate-200 overflow-hidden">
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">PUT-AWAY: {lot.id}</h2>
                        <p className="text-xs text-slate-500">Mover mercancía de Aduana a Almacén</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
                        <p className="text-xs font-bold text-red-700 uppercase mb-2">Artículos Recibidos:</p>
                        <div className="space-y-1">
                            {lot.items.map((i, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-700 font-medium">{i.towelId}</span>
                                    <span className="font-black text-red-900">{i.quantity} pz</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Asignar Ubicación Destino</label>
                        <select 
                            className="w-full p-4 border-2 rounded-xl bg-white text-slate-900 focus:border-red-600 outline-none transition-all font-bold"
                            value={selectedLocId}
                            onChange={(e) => setSelectedLocId(e.target.value)}
                        >
                            <option value="">-- SELECCIONE UN RACK DISPONIBLE --</option>
                            {availableLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                    [{loc.id}] - Pasillo {loc.hall} ({loc.items.length === 0 ? 'VACÍO' : 'TIENE ESPACIO'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-6 border-t bg-slate-50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold">Cancelar</button>
                    <button 
                        onClick={() => {
                            if (selectedLocId) onConfirm(lot.id, selectedLocId);
                            else alert("Por favor seleccione una ubicación válida.");
                        }} 
                        className="flex-1 py-3 bg-red-600 text-white rounded-lg font-black hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
                    >
                        CONFIRMAR ENTRADA
                    </button>
                </div>
            </div>
        </div>
    );
};

export const WMS: React.FC<WMSProps> = ({ towels, setTowels, inboundLots, setInboundLots, locations, setLocations, showNotification }) => {
    const [activeTab, setActiveTab] = useState<'inbound' | 'map'>('inbound');
    const [selectedHall, setSelectedHall] = useState('S1');
    const [inspectingLocation, setInspectingLocation] = useState<Location | null>(null);
    const [receivingLot, setReceivingLot] = useState<InboundLot | null>(null);

    const handleReceiveClick = (lot: InboundLot) => setReceivingLot(lot);

    const confirmReception = (lotId: string, targetLocationId: string) => {
        const lot = inboundLots.find(l => l.id === lotId);
        if (!lot) return;

        setInboundLots(prev => prev.map(l => l.id === lotId ? { ...l, status: 'stored' } : l));

        setTowels(prev => prev.map(towel => {
            const lotItem = lot.items.find(li => li.towelId === towel.id);
            if (lotItem) {
                return {
                    ...towel,
                    stock: towel.stock + lotItem.quantity,
                    aisle: targetLocationId
                };
            }
            return towel;
        }));

        setLocations(prev => prev.map(loc => {
            if (loc.id === targetLocationId) {
                const newItems = [...loc.items];
                lot.items.forEach(lotItem => {
                    const existingIdx = newItems.findIndex(i => i.towelId === lotItem.towelId);
                    if (existingIdx >= 0) newItems[existingIdx].quantity += lotItem.quantity;
                    else newItems.push({ ...lotItem });
                });
                return { ...loc, items: newItems };
            }
            return loc;
        }));

        showNotification(`Lote ${lotId} almacenado exitosamente en ${targetLocationId}.`);
        setReceivingLot(null);
        setActiveTab('map');
    };

    const getHallLocations = (hall: string) => locations.filter(l => l.hall === hall);

    const getLocationStatusColor = (loc: Location) => {
        const total = loc.items.reduce((a, b) => a + b.quantity, 0);
        if (total === 0) return 'bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500';
        if (total < 1000) return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Almacén (WMS)</h1>
                    <p className="text-slate-500 font-medium">Control de racks, pasillos y flujo de aduana.</p>
                </div>
                <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex overflow-hidden">
                    <button 
                        onClick={() => setActiveTab('inbound')}
                        className={`px-8 py-3 rounded-lg text-sm font-black transition-all ${activeTab === 'inbound' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        ADUANA / ENTRADAS
                    </button>
                    <button 
                        onClick={() => setActiveTab('map')}
                        className={`px-8 py-3 rounded-lg text-sm font-black transition-all ${activeTab === 'map' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        MAPA INTERACTIVO
                    </button>
                </div>
            </header>

            {activeTab === 'inbound' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Folio Pedimento</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Proveedor</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Contenido</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inboundLots.map(lot => (
                                    <tr key={lot.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-black text-slate-800 font-mono">{lot.id}</td>
                                        <td className="p-4 text-sm font-medium text-slate-600">{lot.supplierId}</td>
                                        <td className="p-4 text-sm">
                                            {lot.items.map((i, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <span className="font-black text-slate-900">{i.quantity}</span>
                                                    <span className="text-[10px] bg-slate-200 px-1 rounded font-bold text-slate-600">{i.towelId}</span>
                                                </div>
                                            ))}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                                lot.status === 'stored' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                                            }`}>
                                                {lot.status === 'stored' ? '✓ Almacenado' : '⏳ En Tránsito'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {lot.status !== 'stored' && (
                                                <button 
                                                    onClick={() => handleReceiveClick(lot)}
                                                    className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-lg hover:bg-red-600 transition-all shadow-md active:scale-95"
                                                >
                                                    RECIBIR
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'map' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['S1', 'S2', 'S3', 'S4', 'S5'].map(hall => (
                            <button 
                                key={hall}
                                onClick={() => setSelectedHall(hall)}
                                className={`px-8 py-3 rounded-xl font-black text-lg shadow-sm border-2 transition-all whitespace-nowrap ${
                                    selectedHall === hall 
                                    ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100 -translate-y-1' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                                }`}
                            >
                                Salón {hall}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                            {getHallLocations(selectedHall).map(loc => {
                                const total = loc.items.reduce((a, b) => a + b.quantity, 0);
                                return (
                                    <button 
                                        key={loc.id} 
                                        onClick={() => setInspectingLocation(loc)}
                                        className={`p-5 rounded-2xl border-2 flex flex-col justify-between h-40 transition-all hover:shadow-xl hover:-translate-y-1 text-left relative overflow-hidden group ${getLocationStatusColor(loc)}`}
                                    >
                                        <div className="z-10 flex justify-between items-start">
                                            <span className="font-black text-2xl tracking-tighter">{loc.id.split('-')[1]}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{loc.rack}</span>
                                        </div>
                                        <div className="z-10">
                                            <p className="text-3xl font-black">{total > 0 ? (total/1000).toFixed(1) + 'k' : '0'}</p>
                                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Unidades</p>
                                        </div>
                                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-current opacity-5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {inspectingLocation && <LocationInspectorModal location={inspectingLocation} onClose={() => setInspectingLocation(null)} />}
            {receivingLot && <ReceivingModal lot={receivingLot} locations={locations} onClose={() => setReceivingLot(null)} onConfirm={confirmReception} />}
        </div>
    );
};
