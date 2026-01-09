
import React, { useState, useEffect, useRef } from 'react';
import type { Order, Route, Carrier } from '../types';
import { MOCK_CARRIERS } from '../constants';

interface DistributionProps {
    orders: Order[];
    routes: Route[];
    setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    carriers: Carrier[];
}

declare global {
  interface Window {
    google: any;
    googleMapsLoaded: boolean;
  }
}

export const Distribution: React.FC<DistributionProps> = ({ orders, routes, setRoutes, carriers = MOCK_CARRIERS }) => {
    const readyOrders = orders.filter(o => o.status === 'invoiced' && !o.assignedRouteId);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

    // Initialize Map
    useEffect(() => {
        const loadMap = () => {
             if (!mapRef.current || !window.google) return;
             googleMapRef.current = new window.google.maps.Map(mapRef.current, {
                center: { lat: 19.4326, lng: -99.1332 }, // CDMX Center
                zoom: 5,
                mapId: 'DEMO_MAP_ID' // Optional for vector maps
             });
        };

        if (window.google && window.google.maps) {
            loadMap();
        } else {
             window.addEventListener('google-maps-loaded', loadMap);
        }

        return () => window.removeEventListener('google-maps-loaded', loadMap);
    }, []);

    // Draw Selected Route
    useEffect(() => {
        if (!googleMapRef.current || !window.google) return;
        
        // Clear existing
        markersRef.current.forEach((m: any) => m.setMap(null));
        markersRef.current = [];
        if (polylineRef.current) polylineRef.current.setMap(null);

        const routeToDraw = selectedRoute || (routes.length > 0 ? routes[routes.length - 1] : null);

        if (routeToDraw) {
            const bounds = new window.google.maps.LatLngBounds();
            const pathCoordinates: any[] = [];

            // Add Warehouse Marker (Start)
            const startPos = { lat: 19.4326, lng: -99.1332 };
            const startMarker = new window.google.maps.Marker({
                position: startPos,
                map: googleMapRef.current,
                label: "A",
                title: "Almacén Central"
            });
            markersRef.current.push(startMarker);
            bounds.extend(startPos);
            pathCoordinates.push(startPos);

            // Mock Geocoding Logic
             const getCoords = (address: string) => {
                if (address.includes("Cancún")) return { lat: 21.1619, lng: -86.8515 };
                if (address.includes("Vallejo")) return { lat: 19.4833, lng: -99.1667 };
                if (address.includes("Centro")) return { lat: 19.4350, lng: -99.1400 };
                if (address.includes("Los Cabos")) return { lat: 22.8905, lng: -109.9167 };
                // Default spread slightly around CDMX
                return { lat: 19.4326 + (Math.random() - 0.5) * 0.1, lng: -99.1332 + (Math.random() - 0.5) * 0.1 };
            };

            routeToDraw.stops.forEach((stop, index) => {
                const pos = getCoords(stop.address);
                const marker = new window.google.maps.Marker({
                    position: pos,
                    map: googleMapRef.current,
                    label: (index + 1).toString(),
                    title: stop.address
                });
                markersRef.current.push(marker);
                bounds.extend(pos);
                pathCoordinates.push(pos);
            });

            // Draw Polyline
            polylineRef.current = new window.google.maps.Polyline({
                path: pathCoordinates,
                geodesic: true,
                strokeColor: "#DC2626",
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: googleMapRef.current
            });

            googleMapRef.current.fitBounds(bounds);
        }

    }, [selectedRoute, routes]);

    const handleCreateRoute = () => {
        if (readyOrders.length === 0) return;
        
        // Simple Mock Logic to simulate hybrid routing:
        const newRoute: Route = {
            id: `R-${Date.now().toString().slice(-4)}`,
            truckId: 'T-02',
            status: 'planning',
            stops: readyOrders.map((o, idx) => {
                // Check logic: if client pays freight OR preferred carrier is set, drop at terminal
                const isTerminalDrop = o.freightPayer === 'client' || !!o.preferredCarrierId;
                
                const carrier = o.preferredCarrierId 
                    ? carriers.find(c => c.id === o.preferredCarrierId) 
                    : carriers.find(c => c.id === 'car2'); // Default to Paquetexpress mock
                
                const terminal = carrier?.terminals[0];

                return {
                    orderId: o.id,
                    type: isTerminalDrop ? 'carrier_dropoff' : 'client_delivery',
                    address: isTerminalDrop ? (terminal?.address || 'Terminal Paquetería') : o.destinationAddress,
                    sequence: idx + 1,
                    estimatedArrival: `1${idx}:00 AM`,
                    waitTimeMinutes: isTerminalDrop ? (carrier?.waitTimeAvg || 45) : 20 // Client delivery is faster
                };
            })
        };
        const updatedRoutes = [...routes, newRoute];
        setRoutes(updatedRoutes);
        setSelectedRoute(newRoute);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <header><h1 className="text-3xl font-bold text-slate-900">Logística y Distribución</h1></header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column: List and Planner */}
                <div className="space-y-6 flex flex-col">
                     <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold mb-4 text-lg text-slate-900">Pendientes de Embarque</h3>
                        <p className="text-xs text-slate-500 mb-4">Órdenes facturadas listas para asignar a ruta.</p>
                        
                        <div className="space-y-2 mb-6 max-h-[200px] overflow-y-auto">
                            {readyOrders.length === 0 && <p className="text-slate-400 text-center text-sm py-4">No hay órdenes pendientes.</p>}
                            {readyOrders.map(o => (
                                <div key={o.id} className="p-3 bg-slate-50 text-sm border rounded hover:bg-white transition-colors shadow-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-slate-800">{o.id}</span>
                                        <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Facturada</span>
                                    </div>
                                    <div className="text-slate-600 text-xs mb-1 truncate">{o.destinationAddress}</div>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${o.freightPayer === 'client' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                            Flete: {o.freightPayer === 'client' ? 'Cliente' : 'Pagado'}
                                        </span>
                                        {o.preferredCarrierId && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-bold">Línea Pref.</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleCreateRoute} 
                            disabled={readyOrders.length === 0} 
                            className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            Generar Ruta Híbrida (AI)
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex-1 overflow-y-auto">
                        <h3 className="font-bold mb-4 text-lg text-slate-900">Rutas Generadas</h3>
                        {routes.length === 0 && <p className="text-slate-400 text-center py-6 text-sm">No hay rutas activas.</p>}
                        
                        {routes.map(r => (
                            <div 
                                key={r.id} 
                                onClick={() => setSelectedRoute(r)}
                                className={`border rounded-xl p-4 mb-4 cursor-pointer transition-all ${selectedRoute?.id === r.id ? 'border-red-500 ring-1 ring-red-200 bg-red-50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-900">{r.id}</h4>
                                    <span className="text-xs bg-white border px-2 py-1 rounded font-mono">{r.stops.length} Paradas</span>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    <p>Camión: {r.truckId}</p>
                                    <p>Estado: {r.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: MAP & Circuit */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                    {/* MAP CONTAINER */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 relative min-h-[400px]">
                        <div ref={mapRef} className="absolute inset-0 bg-slate-100" />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded shadow-md z-10 max-w-xs">
                            <h4 className="font-bold text-xs text-slate-700 uppercase mb-2">Leyenda</h4>
                            <div className="flex items-center text-xs mb-1">
                                <span className="w-3 h-3 rounded-full bg-red-600 mr-2"></span>
                                <span>Ruta Activa</span>
                            </div>
                             <div className="flex items-center text-xs">
                                <span className="w-3 h-3 rounded-full border-2 border-red-600 mr-2"></span>
                                <span>Almacén (Inicio)</span>
                            </div>
                        </div>
                    </div>

                    {/* LIFO Circuit Visualization */}
                    {selectedRoute && (
                         <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="font-bold text-slate-900">Circuito de Carga (LIFO) - {selectedRoute.id}</h5>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optimizado para Descarga</span>
                            </div>
                            <div className="bg-slate-800 text-white rounded-lg p-4 shadow-inner">
                                <p className="text-xs text-slate-400 mb-2 text-center uppercase tracking-widest">Fondo del Camión (Primero en Entrar)</p>
                                <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                                    {/* Display items reverse order of stops */}
                                    {selectedRoute.stops.slice().reverse().map((s, idx) => (
                                        <div key={s.sequence} className="p-3 bg-slate-700 rounded border border-slate-600 min-w-[120px] text-center">
                                            <span className="block text-xs font-mono text-slate-400 mb-1">Parada {s.sequence}</span>
                                            <span className="block font-bold text-sm truncate">{s.orderId}</span>
                                            <span className="block text-[10px] text-slate-300 truncate">{s.type === 'carrier_dropoff' ? 'Paquetería' : 'Cliente'}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 text-center uppercase tracking-widest">Puerta del Camión (Último en Entrar)</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
