
export interface Towel {
  id: string;
  name: string;
  family: string;
  type: string;
  dimensions: string;
  weight: number;
  stock: number;
  cost: number;
  supplierId: string;
  lotNumber?: string;
  productionDate?: string;
  aisle?: string;
  specifications?: string;
}

export interface OverstockSuggestion {
  productName: string;
  currentStock: number;
  suggestion: string;
}

export interface StorageRecommendation {
  totalUnits: number;
  arrangement: string;
  efficiency: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
}

export interface Destination {
    id: string;
    name: string;
    address: string;
    zone: string;
    type: 'branch' | 'warehouse' | 'client_of_client';
}

export interface CustomerSpecs {
    requiresPortalUpload: boolean;
    portalUrl?: string;
    requiresPurchaseOrderOnInvoice: boolean;
    requiresInsurancePolicy: boolean;
    acceptedDocType: 'invoice' | 'remittance' | 'invoice_and_remittance';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  mainAddress: string;
  destinations: Destination[];
  specs: CustomerSpecs;
}

export interface Bundle {
  id: string;
  orderId: string;
  number: number;
  weight: number;
  items: { towelId: string; quantity: number }[];
}

export interface Order {
  id: string;
  type: 'sale' | 'purchase';
  items: { towelId: string; quantity: number }[];
  partyId: string;
  date: string;
  status: 'pending' | 'released' | 'picking' | 'packed' | 'invoiced' | 'shipped' | 'completed' | 'cancelled';
  total: number;
  destinationId?: string;
  destinationAddress: string;
  addressStatus: 'original' | 'modified_by_email' | 'manual_override';
  freightPayer: 'client' | 'company' | 'supplier';
  preferredCarrierId?: string;
  packingListValidated: boolean;
  bundles: Bundle[];
  invoiceXml?: string;
  assignedRouteId?: string;
  emailChangeHistory?: { date: string; emailId: string; oldAddress: string; newAddress: string }[];
}

export interface Location {
  id: string; 
  hall: string; 
  rack: string;
  level: string;
  capacityKg: number;
  items: { towelId: string; quantity: number }[];
}

export interface Carrier {
  id: string;
  name: string;
  type: 'own_fleet' | 'carrier' | 'parcel';
  waitTimeAvg: number;
  terminals: { name: string; address: string; zone: string }[];
  status: 'active' | 'suspended';
}

export interface Truck {
  id: string;
  type: 'Rabon' | 'Torton' | 'Caja_53';
  capacityKg: number;
  volumeM3: number;
  status: 'available' | 'in_route' | 'maintenance';
}

export interface InboundLot {
  id: string;
  supplierId: string;
  arrivalDate: string;
  status: 'customs' | 'receiving' | 'stored';
  items: { towelId: string; quantity: number }[];
}

export interface RouteStop {
    orderId?: string;
    terminalId?: string;
    address: string;
    type: 'client_delivery' | 'carrier_dropoff';
    sequence: number;
    estimatedArrival: string;
    waitTimeMinutes: number;
}

export interface Route {
    id: string;
    truckId?: string;
    carrierId?: string;
    status: 'planning' | 'loading' | 'in_transit' | 'completed';
    stops: RouteStop[];
    totalDistanceKm?: number;
}

export interface ParsedEmailResult {
    hasChange: boolean;
    orderId: string | null;
    provider: string | null;
    newAddress: string | null;
    instructionType: 'address_change' | 'hold' | 'urgent' | null;
}
