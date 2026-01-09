
import React from 'react';
import type { View } from '../App';

interface SidebarProps {
    currentView: View;
    setView: (view: View) => void;
    onReset?: () => void;
}

const NavItem: React.FC<{
    view: View,
    currentView: View,
    setView: (view: View) => void,
    icon: React.ReactElement<any>,
    label: string
}> = ({ view, currentView, setView, icon, label }) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => setView(view)}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors duration-200 ${
                isActive
                    ? 'bg-red-600 text-white rounded-lg shadow-md'
                    : 'text-slate-600 hover:bg-red-50 hover:text-red-700 rounded-lg'
            }`}
        >
            {React.cloneElement(icon, { className: "h-6 w-6" })}
            <span className="font-medium">{label}</span>
        </button>
    );
};

const LaJosefinaLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 130" className="w-44 h-auto mb-2 filter drop-shadow-sm">
        <g transform="translate(10, 25)">
            <path d="M 40 0 L 40 60 Q 40 85 15 85 Q 0 85 0 70" fill="none" stroke="#C62828" strokeWidth="18" strokeLinecap="round" />
            <path d="M 15 20 Q 28 10 40 20" fill="none" stroke="#1565C0" strokeWidth="5" strokeLinecap="round" />
            <path d="M 15 8 Q 28 -2 40 8" fill="none" stroke="#1565C0" strokeWidth="5" strokeLinecap="round" />
            <path d="M 15 32 Q 28 22 40 32" fill="none" stroke="#1565C0" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g transform="translate(75, 10)">
            <text x="55" y="30" fontFamily="Arial, sans-serif" fontSize="26" fill="#1565C0" fontWeight="bold">Toallas</text>
            <text x="0" y="78" fontFamily="Arial Black, Arial, sans-serif" fontSize="42" fill="#C62828" fontWeight="900" letterSpacing="-1">LA JOSEFINA</text>
            <text x="35" y="105" fontFamily="Brush Script MT, cursive" fontSize="24" fill="#212121">Si secan desde nuevas</text>
        </g>
    </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onReset }) => {
    const navItems: { view: View; label: string; icon: React.ReactElement }[] = [
        { view: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
        { view: 'calculator', label: 'Cálculo de Capacidad', icon: <CalculatorIcon /> },
        { view: 'inventory', label: 'Catálogo & Escáner', icon: <QrCodeIcon /> },
        { view: 'wms', label: 'WMS (Entradas/Mapa)', icon: <CubeIcon /> },
        { view: 'outbound', label: 'Surtido y Empaque', icon: <ClipboardDocumentListIcon /> },
        { view: 'distribution', label: 'Logística y Rutas', icon: <TruckIcon /> },
        { view: 'documents', label: 'Documentos', icon: <DocumentTextIcon /> },
        { view: 'sheets', label: 'Google Sheets', icon: <TableCellsIcon /> },
        { view: 'import', label: 'Importar Datos', icon: <CloudArrowUpIcon /> },
    ];

    return (
        <aside className="w-64 bg-white shadow-lg flex-shrink-0 z-10 flex flex-col h-screen">
            <div className="p-6 border-b border-slate-100 flex flex-col items-center">
                <LaJosefinaLogo />
                <p className="text-sm text-slate-400 mt-1 font-medium">Plataforma Integral 2.0</p>
            </div>
            
            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {navItems.map(item => (
                    <NavItem
                        key={item.view}
                        view={item.view}
                        currentView={currentView}
                        setView={setView}
                        icon={item.icon}
                        label={item.label}
                    />
                ))}
            </nav>

            {onReset && (
                <div className="p-4 border-t border-slate-100">
                    <button 
                        onClick={onReset}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors text-xs font-bold uppercase"
                    >
                        <TrashIcon className="h-4 w-4" />
                        <span>Resetear Datos</span>
                    </button>
                </div>
            )}
        </aside>
    );
};

// SVG Icons
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>
);
const CalculatorIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-3-3V18m-3-3V18M4.5 3h15A2.25 2.25 0 0121.75 5.25v13.5A2.25 2.25 0 0119.5 21h-15A2.25 2.25 0 012.25 18.75V5.25A2.25 2.25 0 014.5 3zM6.75 6.75h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zM6.75 9.75h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75z" />
    </svg>
);
const CubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
);
const QrCodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM15 15H9v6" /></svg>
);
const ClipboardDocumentListIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
);
const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" ><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 0v1.125c0 .621-.504 1.125-1.125 1.125H4.5A1.125 1.125 0 013.375 15V9.75" /></svg>
);
const EnvelopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
);
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
);
const CloudArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
);
const TableCellsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m13.5 2.625h-7.5c-.621 0-1.125-.504-1.125-1.125m7.5 0v-1.5c0-.621-.504-1.125-1.125-1.125m-9 0H3.375m0 0h1.5m12 0h-7.5m7.5 0v-1.5c0-.621-.504-1.125-1.125-1.125m-9 0H3.375m13.5 0H5.625c-.621 0-1.125.504-1.125 1.125" /></svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);
