export interface RoomCategory {
  roomCategoryID: string;
  roomID: string;
  categoryID: string;
  roomName: string;
  isActive: boolean;
  createdDate: Date;
}

export interface InventoryCategory {
  categoryID: string;
  categoryName: string;
  description: string;
  isActive: boolean;
}

export interface ItemCategory {
  categoryID: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  items: InventoryItemenhanced[];
  dosageForms?: DosageForm[];
}

export interface RoomInventoryItem {
  roomItemID: number;
  roomID: string;
  itemID: number;
  maxQuantityAllowed?: number;
  isActive: boolean;
  createdDate: Date;
}

export interface PurchaseRequest {
  purchaseRequestID?: number;
  requestNumber: string;
  originalRequestID: number;
  itemID: number;
  itemName: string;
  itemCode: string; // Make this required
  quantity: number;
  estimatedUnitPrice: number;
  totalEstimatedCost: number; // Make this required
  requestedBy: string;
  requestedByName: string; // Make this required
  requestDate: Date; // Make this required
  status: 'Pending' | 'Approved' | 'Purchased' | 'Delivered' | 'Cancelled';
  purchasedBy?: string;
  purchasedByName?: string;
  purchaseDate?: Date;
  actualUnitPrice?: number;
  actualTotalCost?: number;
  supplier?: string;
  comments?: string;
}

export interface InventoryPurchaseRequest {
  purchaseRequestID?: number;
  requestNumber: string;
  originalRequestID: number;
  itemID: number;
  itemName: string;
  itemCode?: string; // Add this
  quantity: number;
  estimatedUnitPrice: number;
  totalEstimatedCost?: number; // Add this
  requestedBy: string;
  requestedByName?: string; // Add this
  requestDate?: Date; // Add this
  status: 'Pending' | 'Purchased' | 'Received';
  purchasedBy?: string;
  purchaseDate?: Date;
  actualUnitPrice?: number;
  supplier?: string;
  comments?: string;
}
// export interface InventoryPurchaseRequest extends Omit<PurchaseRequest, 'status'> {
//   status: 'Pending' | 'Purchased' | 'Received';
// }

export interface ItemRegistration {
  registrationID: number;
  itemID: number;
  itemName: string;
  itemCode: string;
  batchNumber: string;
  manufacturer: string;
  supplier?: string;
  manufactureDate?: Date;
  expiryDate?: Date;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  purchaseRequestID?: number;
  purchaseRequestNumber?: string;
  receivedDate: Date;
  receivedBy: string;
  receivedByName: string;
  qualityCheck: boolean;
  qualityCheckBy?: string;
  qualityCheckByName?: string;
  qualityCheckDate?: Date;
  qualityComments?: string;
  isActive: boolean;
}

export interface SupervisorRequest {
  requestID: number;
  requestNumber: string;
  requestedFrom: string;
  roomID: string;
  roomName: string;
  requestDate: Date;
  reasonForRequest: string;
  status: string;
  requestedByName: string;
  requestedBy?: string;
  itemCount: number;
  estimatedValue: number;
  items?: InventoryRequestDetail[];
}

export interface InventoryRequestDetail {
  detailID?: number;
  requestID: number;
  itemID: number;
  itemName?: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  issuedQuantity?: number;
  jobOrderNumber?: string;
  unit?: string;
  unitPrice?: number;
  currentStock?: number;
  itemCode?: string;
}

export interface InventoryRequest {
  requestID?: number;
  id?: string;
  requestNumber: string;
  requestedFrom: string;
  roomID?: string;
  requestedBy: string;
  requestDate: Date;
  reasonForRequest: string;
  status: 'pending' | 'approved' | 'issued' | 'cancelled';
  approvedBy?: string;
  approvedDate?: Date;
  issuedBy?: string;
  issuedDate?: Date;
  comments?: string;
  items: any[];
}

export interface InventoryItemenhanced {
  itemID: number;
  itemCode: string;
  itemName: string;
  categoryID: number;
  categoryName?: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unitPrice?: number;
  expiryDate?: Date;
  manufacturer?: string;
  batchNumber?: string;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
  maxQuantityAllowed?: number;
  stockStatus?: 'Low Stock' | 'Normal' | 'Overstock';
  dosageForm?: string;
  RoomID?: string;
}

export interface ItemSelection {
  itemId: number | string;
  itemName: string;
  categoryName: string;
  unit: string;
  currentStock: number;
  dosageForm?: string;
}

export interface ReasonCategory {
  category: string;
  reasons: ReasonSelection[];
}

export interface ReasonSelection {
  reasonId: string;
  reasonName: string;
}

export interface InventoryRequestEnhanced {
  requestID?: number;
  requestNumber: string;
  requestedFrom: string;
  roomID: string;
  requestedBy: string;
  requestDate: Date;
  reasonForRequest: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Partial Issued';
  approvedBy?: string;
  approvedDate?: Date;
  issuedBy?: string;
  issuedDate?: Date;
  comments?: string;
  items: InventoryRequestDetail[];
  monitored?: boolean;
  received?: boolean;
}

export interface StockTransaction {
  transactionID?: number;
  itemID: number;
  quantity: number;
  transactionType: 'Issue' | 'Receive' | 'Purchase' | 'Adjustment';
  fromRoomID?: string;
  toRoomID?: string;
  transactionDate: Date;
  performedBy: string;
  comments?: string;
}

export interface RoomStock {
  roomID: string;
  itemID: number;
  currentStock: number;
  lastUpdated: Date;
}

export interface InventoryReport {
  reportType: 'stock' | 'transactions' | 'requests';
  data: any[];
  generatedDate: Date;
  generatedBy: string;
}

export interface DosageForm {
  form: string;
  items: InventoryItemenhanced[];
}

export interface Item {
  itemID: number;
  itemName: string;
  unit: string;
  currentStock: number;
}
