
import React, { useState } from 'react';
import { optimizeRoute } from '../services/geminiService';

export const Logistics: React.FC = () => {
    const [addresses, setAddresses] = useState('Almacén Central, 123 Warehouse Rd\nCliente A, 456 Delivery Ave\nPaquetería Express, 789 Parcel Ln\nCliente B, 101 Customer Blvd\nPaquetería Rápida, 212 Freight St');
    const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOptimize = async () => {
        setIsLoading(true);
        setError(null);
        const addressList = addresses.split('\n').filter(Boolean);
        try {
            const result = await optimizeRoute(addressList);
            setOptimizedRoute(result);
        } catch (err) {
            setError('Falló la optimización de la ruta. Por favor, intente de nuevo.');
            console.error(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Optimización de Rutas de Entrega</h1>
                <p className="text-lg text-slate-500 mt-1">Genere la ruta más eficiente para múltiples puntos de entrega.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Puntos de Entrega</h2>
                    <p className="text-sm text-slate-500 mb-2">Ingrese cada dirección en una nueva línea. La primera dirección debe ser su punto de partida (almacén).</p>
                    <textarea
                        value={addresses}
                        onChange={(e) => setAddresses(e.target.value)}
                        rows={10}
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                    />
                    <button
                        onClick={handleOptimize}
                        disabled={isLoading}
                        className="mt-4 w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <Spinner /> : <TruckIcon className="h-6 w-6"/>}
                        <span>{isLoading ? 'Optimizando...' : 'Optimizar Ruta'}</span>
                    </button>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Ruta Optimizada</h2>
                    {optimizedRoute.length > 0 ? (
                        <ol className="list-decimal list-inside space-y-3">
                            {optimizedRoute.map((stop, index) => (
                                <li key={index} className="p-3 bg-slate-50 rounded-lg flex items-start border border-slate-100">
                                    <span className="mr-3 font-bold text-red-600">{index + 1}.</span>
                                    <span className="text-slate-800">{stop}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-slate-400 text-center py-10">La ruta optimizada aparecerá aquí.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 0v1.125c0 .621-.504 1.125-1.125 1.125H4.5A1.125 1.125 0 013.375 15V9.75" />
    </svg>
);
