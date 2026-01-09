
import React, { useState } from 'react';
import { analyzeOverstock } from '../services/geminiService';
import type { Towel, OverstockSuggestion } from '../types';

interface OverstockProps {
    towels: Towel[];
}

export const Overstock: React.FC<OverstockProps> = ({ towels }) => {
    const [suggestions, setSuggestions] = useState<OverstockSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        try {
            const result = await analyzeOverstock(towels);
            setSuggestions(result);
        } catch (err) {
            setError('Falló el análisis de inventario. Por favor, intente de nuevo.');
            console.error(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Análisis de Excedente de Inventario</h1>
                <p className="text-lg text-slate-500 mt-1">Utilice IA para identificar productos con excedente y obtener estrategias para reducirlo.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                <button
                    onClick={handleAnalysis}
                    disabled={isLoading}
                    className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
                >
                    {isLoading ? (
                        <div className="flex items-center space-x-2">
                            <Spinner />
                            <span>Analizando...</span>
                        </div>
                    ) : 'Analizar Inventario Ahora'}
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-800 p-4 rounded-lg">{error}</div>}

            {suggestions.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900">Resultados y Sugerencias</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suggestions.map((item, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                                <h3 className="font-bold text-lg text-slate-900">{item.productName}</h3>
                                <p className="text-slate-600">Stock Actual: <span className="font-bold text-slate-800">{item.currentStock.toLocaleString()}</span></p>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="font-semibold text-slate-700">Sugerencia de IA:</p>
                                    <p className="text-slate-600">{item.suggestion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
