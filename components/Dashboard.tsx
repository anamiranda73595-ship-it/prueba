
import React, { useEffect, useRef } from 'react';
import type { Towel, Order, Customer, InboundLot, Route } from '../types';
import type { View } from '../App';

interface DashboardProps {
    towels: Towel[];
    orders: Order[];
    customers: Customer[];
    inboundLots: InboundLot[];
    routes: Route[];
    setView: (view: View) => void;
}

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactElement<any>; 
    color: string; 
    subtext?: string;
    onClick?: () => void;
}> = ({ title, value, icon, color, subtext, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-1' : ''}`}
    >
        <div className={`rounded-full p-3 ${color}`}>
            {React.cloneElement(icon, { className: "h-7 w-7 text-white" })}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

// Simple Map Component for Dashboard
const TrackingMap: React.FC<{ routes: Route[] }> = ({ routes }) => {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 19.4326, lng: -99.1332 }, // CDMX Center
            zoom: 5,
            disableDefaultUI: true,
            styles: [
                { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
        });

        const getCoords = (address: string) => {
            if (address.includes("Cancún")) return { lat: 21.1619, lng: -86.8515 };
            if (address.includes("Vallejo")) return { lat: 19.4833, lng: -99.1667 };
            if (address.includes("Los Cabos")) return { lat: 22.8905, lng: -109.9167 };
            return { lat: 19.4326 + (Math.random() * 0.1), lng: -99.1332 + (Math.random() * 0.1) };
        };

        routes.forEach(route => {
            if (route.status === 'in_transit') {
                const lastStop = route.stops[route.stops.length - 1];
                const pos = getCoords(lastStop.address);
                
                new window.google.maps.Marker({
                    position: pos,
                    map: map,
                    icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: "#DC2626",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF"
                    },
                    title: `Camión ${route.truckId}`
                });

                new window.google.maps.Polyline({
                    path: [{ lat: 19.4326, lng: -99.1332 }, pos],
                    geodesic: true,
                    strokeColor: "#DC2626",
                    strokeOpacity: 0.5,
                    strokeWeight: 2,
                    map: map
                });
            }
        });

    }, [routes]);

    return <div ref={mapRef} className="w-full h-64 rounded-lg bg-slate-100" />;
};

export const Dashboard: React.FC<DashboardProps> = ({ towels, orders, customers, inboundLots, routes, setView }) => {
    const totalStock = towels.reduce((sum, towel) => sum + towel.stock, 0);
    const lowStockItems = towels.filter(t => t.stock < 500).length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'released').length;
    
    const customsPending = inboundLots.filter(l => l.status === 'customs').length;
    const receivingPending = inboundLots.filter(l => l.status === 'receiving').length;

    const activeRoutes = routes.filter(r => r.status === 'in_transit' || r.status === 'loading').length;
    const activeStops = routes.reduce((acc, r) => acc + r.stops.length, 0);

    const recentSales = orders.filter(o => o.type === 'sale').slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Torre de Control Operativa</h1>
                    <p className="text-lg text-slate-500 mt-1">Haga clic en los indicadores para ir a su sección.</p>
                </div>
                <button 
                    onClick={() => setView('calculator')}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    <CalculatorIcon className="w-5 h-5" />
                    Calculadora de Espacio
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Inventario Total" 
                    value={totalStock.toLocaleString()} 
                    icon={<CubeIcon />} 
                    color="bg-blue-600"
                    subtext={`${lowStockItems} bajo mínimo`}
                    onClick={() => setView('inventory')}
                />
                <StatCard 
                    title="Pedidos Pendientes" 
                    value={pendingOrders} 
                    icon={<ClipboardDocumentIcon />} 
                    color="bg-yellow-500"
                    subtext="Ver flujo de surtido"
                    onClick={() => setView('outbound')}
                />
                <StatCard 
                    title="WMS (Aduana)" 
                    value={customsPending + receivingPending} 
                    icon={<ScaleIcon />} 
                    color="bg-purple-600"
                    subtext="Ver entradas y racks"
                    onClick={() => setView('wms')}
                />
                <StatCard 
                    title="Logística Activa" 
                    value={activeRoutes} 
                    icon={<TruckIcon />} 
                    color="bg-red-600"
                    subtext={`${activeStops} paradas programadas`}
                    onClick={() => setView('distribution')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div 
                    onClick={() => setView('distribution')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col cursor-pointer group"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">Rastreo de Rutas Activas</h2>
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                    
                    <div className="flex-1 min-h-[250px] relative">
                        {routes.length > 0 ? (
                            <TrackingMap routes={routes} />
                        ) : (
                            <div className="w-full h-64 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                <TruckIcon className="h-8 w-8 mb-2 opacity-50" />
                                <p>No hay unidades en tránsito.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Últimos Pedidos (Ventas)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="p-2 font-semibold text-xs text-slate-600">ID</th>
                                    <th className="p-2 font-semibold text-xs text-slate-600">Cliente</th>
                                    <th className="p-2 font-semibold text-xs text-slate-600">Total</th>
                                    <th className="p-2 font-semibold text-xs text-slate-600">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSales.map(order => (
                                    <tr 
                                        key={order.id} 
                                        onClick={() => setView('outbound')}
                                        className="border-b border-slate-100 hover:bg-red-50 cursor-pointer transition-colors"
                                    >
                                        <td className="p-2 font-mono text-xs text-slate-500">{order.id}</td>
                                        <td className="p-2 text-sm text-slate-800 truncate max-w-[100px]">{customers.find(c => c.id === order.partyId)?.name}</td>
                                        <td className="p-2 font-medium text-sm text-slate-900">${order.total.toLocaleString()}</td>
                                        <td className="p-2 text-right">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalculatorIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-3-3V18m-3-3V18M4.5 3h15A2.25 2.25 0 0121.75 5.25v13.5A2.25 2.25 0 0119.5 21h-15A2.25 2.25 0 012.25 18.75V5.25A2.25 2.25 0 014.5 3zM6.75 6.75h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zM6.75 9.75h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75z" />
    </svg>
);
const CubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
);
const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" ><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 0v1.125c0 .621-.504 1.125-1.125 1.125H4.5A1.125 1.125 0 013.375 15V9.75" /></svg>
);
const ClipboardDocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
);
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 1.75.95 1.75 1.925v10.151c0 .98-.815 1.755-1.79 1.857A48.562 48.562 0 0112 20.25a48.564 48.564 0 01-6.75-.627c-.975-.102-1.79-.876-1.79-1.857V6.895c0-.975.74-1.782 1.75-1.925m13.5 0a48.5 48.5 0 00-5.25-.35" /></svg>
);
