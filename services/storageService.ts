
import type { Towel, Supplier, Customer, Order, InboundLot, Route, Carrier, Location } from '../types';
import { MOCK_TOWELS, MOCK_SUPPLIERS, MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_INBOUND, MOCK_LOCATIONS, MOCK_CARRIERS } from '../constants';

const DB_KEY = 'josefina_logistics_db_v2';

export interface DatabaseSchema {
    towels: Towel[];
    suppliers: Supplier[];
    customers: Customer[];
    orders: Order[];
    inboundLots: InboundLot[];
    routes: Route[];
    carriers: Carrier[];
    locations: Location[];
    lastUpdated: string;
}

const INITIAL_DB: DatabaseSchema = {
    towels: MOCK_TOWELS,
    suppliers: MOCK_SUPPLIERS,
    customers: MOCK_CUSTOMERS,
    orders: MOCK_ORDERS,
    inboundLots: MOCK_INBOUND,
    routes: [],
    carriers: MOCK_CARRIERS,
    locations: MOCK_LOCATIONS,
    lastUpdated: new Date().toISOString()
};

export const StorageService = {
    loadDatabase: (): DatabaseSchema => {
        try {
            const serializedData = localStorage.getItem(DB_KEY);
            if (serializedData) {
                return JSON.parse(serializedData);
            }
        } catch (error) {
            console.error("Error loading database:", error);
        }
        return INITIAL_DB;
    },

    saveDatabase: (data: Omit<DatabaseSchema, 'lastUpdated'>) => {
        try {
            const dbEntry: DatabaseSchema = {
                ...data,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(DB_KEY, JSON.stringify(dbEntry));
        } catch (error) {
            console.error("Error saving database:", error);
        }
    },

    factoryReset: () => {
        try {
            localStorage.removeItem(DB_KEY);
            window.location.reload();
        } catch (error) {
            console.error("Error resetting database:", error);
        }
    }
};
