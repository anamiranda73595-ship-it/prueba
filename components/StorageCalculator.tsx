
import React, { useState } from 'react';
import { getStorageAdvice } from '../services/geminiService';
import type { Towel, StorageRecommendation } from '../types';

interface StorageCalculatorProps {
    towels: Towel[];
}

export const StorageCalculator: React.FC<StorageCalculatorProps> = ({ towels }) => {
    const [shelfDim, setShelfDim] = useState({ w: 100, h: 200, d: 100 });
    const [itemDim, setItemDim] = useState({ w: 30, h: 10, d: 20 });
    const [advice, setAdvice] = useState<StorageRecommendation | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCalculate = async () => {
        setLoading(true);
        const result = await getStorageAdvice(shelfDim, itemDim);
        setAdvice(result);
        setLoading(false);
    };

    const mathResult = Math.floor(shelfDim.w / itemDim.w) * 
                       Math.floor(shelfDim.h / itemDim.h) * 
                       Math.floor(shelfDim.d / itemDim.d);

    return (
        <div className="space-y-6 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Calculadora de Cubicaje</h1>
                <p className="text-lg text-slate-500 mt-1">Determine la capacidad máxima de sus estantes y optimice el acomodo.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                    <div>
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 p-1 rounded text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
                            </span>
                            Dimensiones del Estante (cm)
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <label className="block">
                                <span className="text-xs font-bold text-slate-400">Ancho</span>
                                <input type="number" value={shelfDim.w} onChange={e => setShelfDim({...shelfDim, w: Number(e.target.value)})} className="w-full p-2 border rounded" />
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-slate-400">Alto</span>
                                <input type="number" value={shelfDim.h} onChange={e => setShelfDim({...shelfDim, h: Number(e.target.value)})} className="w-full p-2 border rounded" />
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-slate-400">Fondo</span>
                                <input type="number" value={shelfDim.d} onChange={e => setShelfDim({...shelfDim, d: Number(e.target.value)})} className="w-full p-2 border rounded" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                             <span className="bg-red-100 p-1 rounded text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-3-3V18m-3-3V18M4.5 3h15A2.25 2.25 0 0121.75 5.25v13.5A2.25 2.25 0 0119.5 21h-15A2.25 2.25 0 012.25 18.75V5.25A2.25 2.25 0 014.5 3z" /></svg>
                            </span>
                            Dimensiones del Producto (cm)
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <label className="block">
                                <span className="text-xs font-bold text-slate-400">Ancho</span>
                                <input type="number" value={itemDim.w} onChange={e => setItemDim({...itemDim, w: Number(e.target.value)})} className="w-full p-2 border rounded" />
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-slate-400">Alto</span>
                                <input type="number" value={itemDim.h} onChange={e => setItemDim({...itemDim, h: Number(e.target.value)})} className="w-full p-2 border rounded" />
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-slate-400">Fondo</span>
                                <input type="number" value={itemDim.d} onChange={e => setItemDim({...itemDim, d: Number(e.target.value)})} className="w-full p-2 border rounded" />
                            </label>
                        </div>
                    </div>

                    <button 
                        onClick={handleCalculate}
                        disabled={loading}
                        className="w-full py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex justify-center items-center gap-2 shadow-lg"
                    >
                        {loading ? <Spinner /> : <span>Optimizar con IA</span>}
                    </button>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Capacidad Matemática Directa</h4>
                            <p className="text-6xl font-black text-slate-900">{mathResult.toLocaleString()}</p>
                            <p className="text-slate-500 font-medium">unidades (Sin rotar productos)</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 hidden sm:block">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-blue-600 opacity-20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-3-3V18m-3-3V18M4.5 3h15A2.25 2.25 0 0121.75 5.25v13.5A2.25 2.25 0 0119.5 21h-15A2.25 2.25 0 012.25 18.75V5.25A2.25 2.25 0 014.5 3z" /></svg>
                        </div>
                    </div>

                    {advice && (
                        <div className="bg-slate-900 text-white p-8 rounded-xl shadow-xl border-l-8 border-red-600 animate-slide-up">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-red-500">✨</span> Recomendación de Optimización IA
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Unidades con Acomodo Sugerido</p>
                                    <p className="text-4xl font-black text-white mb-4">{advice.totalUnits.toLocaleString()}</p>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800 p-4 rounded-lg border border-slate-700">
                                        {advice.arrangement}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Eficiencia de Espacio</p>
                                        <p className="text-2xl font-bold text-green-400">{advice.efficiency}</p>
                                    </div>
                                    <div className="bg-red-900/30 p-4 rounded-lg border border-red-800/50">
                                        <p className="text-xs font-bold text-red-400 uppercase">Tip Logístico</p>
                                        <p className="text-sm italic">Para toallas de alto gramaje, el estibado vertical reduce el aplastamiento de fibras.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
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
