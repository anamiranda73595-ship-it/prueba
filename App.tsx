
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WMS } from './components/WMS';
import { Outbound } from './components/Outbound';
import { Distribution } from './components/Distribution';
import { EmailParser } from './components/EmailParser';
import { Documents } from './components/Documents';
import { DataImport } from './components/DataImport';
import { Inventory } from './components/Inventory';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { StorageCalculator } from './components/StorageCalculator';
import { StorageService } from './services/storageService';
import { 
    MOCK_CARRIERS, MOCK_ROUTES, MOCK_TOWELS, MOCK_SUPPLIERS, 
    MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_INBOUND, MOCK_LOCATIONS 
} from './constants';
import type { Towel, Supplier, Customer, Order, InboundLot, Route, Carrier, Location } from './types';

export type View = 'dashboard' | 'inventory' | 'wms' | 'outbound' | 'distribution' | 'email' | 'documents' | 'import' | 'sheets' | 'calculator';

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [dbLoaded, setDbLoaded] = useState(false);

    const [towels, setTowels] = useState<Towel[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [inboundLots, setInboundLots] = useState<InboundLot[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        const db = StorageService.loadDatabase();
        setTowels(db.towels);
        setSuppliers(db.suppliers);
        setCustomers(db.customers);
        setOrders(db.orders);
        setInboundLots(db.inboundLots);
        setRoutes(db.routes.length > 0 ? db.routes : MOCK_ROUTES); 
        setCarriers(db.carriers);
        setLocations(db.locations);
        setDbLoaded(true);
    }, []);

    useEffect(() => {
        if (dbLoaded) {
            StorageService.saveDatabase({
                towels, suppliers, customers, orders, inboundLots, routes, carriers, locations
            });
        }
    }, [towels, suppliers, customers, orders, inboundLots, routes, carriers, locations, dbLoaded]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleDataImport = (type: 'towels' | 'suppliers' | 'customers', data: any[]) => {
        switch (type) {
            case 'towels':
                setTowels(prev => [...prev, ...data]);
                showNotification(`Se importaron ${data.length} productos.`);
                break;
            case 'suppliers':
                setSuppliers(prev => [...prev, ...data]);
                showNotification(`Se importaron ${data.length} proveedores.`);
                break;
            case 'customers':
                setCustomers(prev => [...prev, ...data]);
                showNotification(`Se importaron ${data.length} clientes.`);
                break;
        }
    };

    const handleFactoryReset = () => {
        if (confirm("¿Está seguro? Esto borrará todos sus datos.")) {
            StorageService.factoryReset();
        }
    };

    const renderView = () => {
        if (!dbLoaded) return <div className="flex items-center justify-center h-full text-slate-500 italic">Inicializando Sistema Logístico...</div>;

        switch (view) {
            case 'dashboard':
                return <Dashboard towels={towels} orders={orders} customers={customers} inboundLots={inboundLots} routes={routes} setView={setView} />;
            case 'inventory':
                 return <Inventory towels={towels} setTowels={setTowels} suppliers={suppliers} customers={customers} setOrders={setOrders} carriers={carriers} showNotification={showNotification} />;
            case 'wms':
                return <WMS towels={towels} setTowels={setTowels} inboundLots={inboundLots} setInboundLots={setInboundLots} locations={locations} setLocations={setLocations} showNotification={showNotification} />;
            case 'outbound':
                return <Outbound orders={orders} setOrders={setOrders} towels={towels} customers={customers} showNotification={showNotification} />;
            case 'distribution':
                return <Distribution orders={orders} routes={routes} setRoutes={setRoutes} carriers={carriers} />;
            case 'email':
                return <EmailParser suppliers={suppliers} setSuppliers={setSuppliers} orders={orders} setOrders={setOrders} showNotification={showNotification} />;
            case 'documents':
                 return <Documents orders={orders} towels={towels} customers={customers} suppliers={suppliers} />;
            case 'import':
                return <DataImport onImport={handleDataImport} />;
            case 'sheets':
                return <GoogleSheetsSync towels={towels} setTowels={setTowels} orders={orders} customers={customers} suppliers={suppliers} inboundLots={inboundLots} showNotification={showNotification} />;
            case 'calculator':
                return <StorageCalculator towels={towels} />;
            default:
                return <Dashboard towels={towels} orders={orders} customers={customers} inboundLots={inboundLots} routes={routes} setView={setView} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 relative">
            {notification && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 transition-all ${
                    notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                    <span className="font-bold">{notification.message}</span>
                </div>
            )}
            <Sidebar currentView={view} setView={setView} onReset={handleFactoryReset} />
            <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
