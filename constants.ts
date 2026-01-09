
import type { Towel, Supplier, Customer, Order, Location, Carrier, Truck, InboundLot, Route } from './types';

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'Cotton Kings Intl', contact: 'sales@cottonkings.com' },
  { id: 'sup2', name: 'Pakistan Textiles Ltd', contact: 'export@paktextiles.com' },
];

export const MOCK_TOWELS: Towel[] = [
  { id: '70LVL2GMC7200', name: 'TALISSA BAÑO BLANCO', family: 'TALISSA', type: 'baño', dimensions: '70x140', weight: 0.6, stock: 5000, cost: 85.50, supplierId: 'sup1', aisle: 'S1-P3' },
  { id: '70LVL2GMC7201', name: 'TALISSA MANOS BLANCO', family: 'TALISSA', type: 'manos', dimensions: '40x70', weight: 0.2, stock: 8000, cost: 35.20, supplierId: 'sup1', aisle: 'S1-P3' },
  { id: '80LH3GMC9000', name: 'LH ALBERCA RAYAS', family: 'LH', type: 'alberca', dimensions: '90x160', weight: 0.85, stock: 2000, cost: 120.00, supplierId: 'sup2', aisle: 'S2-P1' },
  { id: '50SPA1GMC100', name: 'SPA FACIAL PREMIUM', family: 'SPA', type: 'facial', dimensions: '30x30', weight: 0.05, stock: 12000, cost: 15.00, supplierId: 'sup1', aisle: 'S3-P5' },
];

export const MOCK_CUSTOMERS: Customer[] = [
    { 
        id: 'cust1', 
        name: 'Grand Hyatt Cancún', 
        email: 'compras@hyatt.com', 
        mainAddress: 'Blvd. Kukulcan Km 12, Cancún, QROO', 
        destinations: [
            { id: 'dest1_1', name: 'Hotel Principal', address: 'Blvd. Kukulcan Km 12, Cancún', zone: 'Sureste', type: 'branch' },
            { id: 'dest1_2', name: 'Bodega Playa', address: 'Calle 5ta Avenida, Playa del Carmen', zone: 'Sureste', type: 'warehouse' }
        ],
        specs: {
            requiresPortalUpload: true,
            portalUrl: 'suppliers.hyatt.com',
            requiresPurchaseOrderOnInvoice: true,
            requiresInsurancePolicy: false,
            acceptedDocType: 'invoice'
        }
    },
    { 
        id: 'cust2', 
        name: 'Distribuidora Textil del Centro', 
        email: 'logistica@distex.mx', 
        mainAddress: 'Av. Reforma 222, CDMX',
        destinations: [
            { id: 'dest2_1', name: 'Cedis Vallejo', address: 'Norte 45 #100, Vallejo, CDMX', zone: 'Centro', type: 'warehouse' },
            { id: 'dest2_2', name: 'Tienda Centro', address: 'Isabel la Catolica 55, Centro, CDMX', zone: 'Centro', type: 'branch' }
        ],
        specs: {
            requiresPortalUpload: false,
            requiresPurchaseOrderOnInvoice: false,
            requiresInsurancePolicy: false,
            acceptedDocType: 'invoice_and_remittance'
        }
    },
    { 
        id: 'cust3', 
        name: 'Hotel Boutique Los Cabos', 
        email: 'admin@loscabos.com', 
        mainAddress: 'Carr. Transpeninsular Km 5, Los Cabos, BCS', 
        destinations: [
             { id: 'dest3_1', name: 'Recepción Hotel', address: 'Carr. Transpeninsular Km 5, BCS', zone: 'Pacifico', type: 'branch' }
        ],
        specs: {
            requiresPortalUpload: false,
            requiresPurchaseOrderOnInvoice: true,
            requiresInsurancePolicy: true,
            acceptedDocType: 'remittance' // Solo remisión al entregar, factura después
        }
    },
];

// Generar 5 salones con 10 ubicaciones cada uno
export const MOCK_LOCATIONS: Location[] = [];
['S1', 'S2', 'S3', 'S4', 'S5'].forEach(hall => {
    for (let i = 1; i <= 10; i++) {
        const locId = `${hall}-U${i.toString().padStart(2, '0')}`;
        MOCK_LOCATIONS.push({
            id: locId,
            hall: hall,
            rack: `R-${Math.ceil(i/2)}`,
            level: i % 2 === 0 ? 'Bajo' : 'Alto',
            capacityKg: 1000,
            items: i % 3 === 0 ? [{ towelId: '70LVL2GMC7200', quantity: 200 }] : []
        });
    }
});

export const MOCK_CARRIERS: Carrier[] = [
    { id: 'car1', name: 'Flota Propia', type: 'own_fleet', waitTimeAvg: 0, terminals: [], status: 'active' },
    { id: 'car2', name: 'Paquetexpress', type: 'parcel', waitTimeAvg: 45, terminals: [{name: 'Term. Vallejo', address: 'Poniente 140, Vallejo', zone: 'Centro'}], status: 'active' },
    { id: 'car3', name: 'Tresguerras', type: 'carrier', waitTimeAvg: 120, terminals: [{name: 'Term. Iztapalapa', address: 'Eje 6 Sur, Iztapalapa', zone: 'Oriente'}], status: 'suspended' },
];

export const MOCK_TRUCKS: Truck[] = [
    { id: 'T-01', type: 'Rabon', capacityKg: 8000, volumeM3: 35, status: 'available' },
    { id: 'T-02', type: 'Torton', capacityKg: 16000, volumeM3: 50, status: 'in_route' },
    { id: 'T-03', type: 'Caja_53', capacityKg: 25000, volumeM3: 100, status: 'available' },
];

export const MOCK_INBOUND: InboundLot[] = [
    { id: 'PED-239901', supplierId: 'sup1', arrivalDate: '2023-10-25', status: 'customs', items: [{towelId: '70LVL2GMC7200', quantity: 5000}] },
    { id: 'PED-239902', supplierId: 'sup2', arrivalDate: '2023-10-26', status: 'receiving', items: [{towelId: '80LH3GMC9000', quantity: 2000}] },
];

export const MOCK_ROUTES: Route[] = [
    {
        id: 'R-4921',
        truckId: 'T-02',
        status: 'in_transit',
        stops: [
            {
                orderId: 'SO-1001',
                type: 'client_delivery',
                address: 'Blvd. Kukulcan Km 12, Cancún',
                sequence: 1,
                estimatedArrival: '14:00 PM',
                waitTimeMinutes: 20
            }
        ]
    }
];

export const MOCK_ORDERS: Order[] = [
    { 
        id: 'SO-1001', type: 'sale', items: [{ towelId: '70LVL2GMC7200', quantity: 500 }], partyId: 'cust1', date: '2023-10-20', status: 'shipped', total: 42750, 
        destinationId: 'dest1_1',
        destinationAddress: 'Blvd. Kukulcan Km 12, Cancún',
        addressStatus: 'original',
        freightPayer: 'client',
        assignedRouteId: 'R-4921',
        packingListValidated: true, bundles: [] 
    },
    { 
        id: 'SO-1002', type: 'sale', items: [{ towelId: '50SPA1GMC100', quantity: 1000 }], partyId: 'cust2', date: '2023-10-21', status: 'invoiced', total: 22500, 
        destinationId: 'dest2_1',
        destinationAddress: 'Norte 45 #100, Vallejo, CDMX',
        addressStatus: 'original',
        freightPayer: 'company',
        packingListValidated: true, 
        bundles: [
            { id: 'B-1002-1', orderId: 'SO-1002', number: 1, weight: 25, items: [{towelId: '50SPA1GMC100', quantity: 500}] },
            { id: 'B-1002-2', orderId: 'SO-1002', number: 2, weight: 25, items: [{towelId: '50SPA1GMC100', quantity: 500}] }
        ] 
    },
    {
        id: 'SO-1003', type: 'sale', items: [{ towelId: '80LH3GMC9000', quantity: 150 }], partyId: 'cust3', date: '2023-10-22', status: 'pending', total: 18000,
        destinationId: 'dest3_1',
        destinationAddress: 'Carr. Transpeninsular Km 5, Los Cabos, BCS',
        addressStatus: 'original',
        freightPayer: 'client',
        packingListValidated: false, bundles: []
    }
];
