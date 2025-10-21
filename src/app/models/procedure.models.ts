// Procedure Room Models

export interface WoundCare {
  woundCareID: number;
  woundCareNumber: string;
  patientID: number;
  cardNumber: string;
  orderingPhysicianID: string;
  woundType: string;
  woundLocation: string;
  woundSize: string;
  woundDepth: string;
  woundCondition: string;
  treatmentPlan: string;
  dressingType: string;
  cleaningSolution: string;
  instructions: string;
  notes: string;
  procedureDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  performedBy?: string;
  performedDate?: Date;
  createdBy: string;
  createdDate: Date;
  modifiedBy?: string;
  modifiedDate?: Date;
  isRecurring: boolean;
  frequency?: string;
  totalSessions?: number;
  completedSessions?: number;
}

export interface Suturing {
  suturingID: number;
  suturingNumber: string;
  patientID: number;
  cardNumber: string;
  orderingPhysicianID: string;
  woundType: string;
  woundLocation: string;
  woundSize: string;
  woundDepth: string;
  sutureType: string;
  sutureMaterial: string;
  sutureSize: string;
  numStitches: number;
  anesthesiaUsed: string;
  instructions: string;
  notes: string;
  procedureDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  performedBy?: string;
  performedDate?: Date;
  createdBy: string;
  createdDate: Date;
  modifiedBy?: string;
  modifiedDate?: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
  removalDate?: Date;
}

export interface EarIrrigation {
  earIrrigationID: number;
  earIrrigationNumber: string;
  patientID: number;
  cardNumber: string;
  orderingPhysicianID: string;
  earSide: 'Left' | 'Right' | 'Both';
  irrigationSolution: string;
  solutionTemperature: string;
  irrigationPressure: string;
  procedureDuration: number;
  findings: string;
  complications: string;
  instructions: string;
  notes: string;
  procedureDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  performedBy?: string;
  performedDate?: Date;
  createdBy: string;
  createdDate: Date;
  modifiedBy?: string;
  modifiedDate?: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
}

// Base procedure interface
export interface BaseProcedure {
  procedureID: number;
  procedureNumber: string;
  patientID: number;
  cardNumber: string;
  orderingPhysicianID: string;
  procedureType: 'Injection' | 'WoundCare' | 'Suturing' | 'EarIrrigation';
  instructions: string;
  notes: string;
  procedureDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  performedBy?: string;
  performedDate?: Date;
  createdBy: string;
  createdDate: Date;
  modifiedBy?: string;
  modifiedDate?: Date;
}

// Procedure schedule for recurring procedures
export interface ProcedureSchedule {
  scheduleID: number;
  procedureID: number;
  procedureType: 'Injection' | 'WoundCare' | 'Suturing' | 'EarIrrigation';
  scheduledDate: Date;
  scheduledTime: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Missed';
  performedBy?: string;
  performedDate?: Date;
  notes?: string;
  createdDate: Date;
}

// Procedure request models
export interface WoundCareRequest {
  woundCareNumber: string;
  patientID: number;
  cardNumber: string;
  orderingPhysicianID: string;
  woundType: string;
  woundLocation: string;
  woundSize: string;
  woundDepth: string;
  woundCondition: string;
  treatmentPlan: string;
  dressingType: string;
  cleaningSolution: string;
  instructions: string;
  notes: string;
  createdBy: string;
  isRecurring: boolean;
  frequency?: string;
  totalSessions?: number;
}

export interface SuturingRequest {
  suturingNumber: string;
  patientID: number;
  cardNumber: string;
  orderingPhysicianID: string;
  woundType: string;
  woundLocation: string;
  woundSize: string;
  woundDepth: string;
  sutureType: string;
  sutureMaterial: string;
  sutureSize: string;
  numStitches: number;
  anesthesiaUsed: string;
  instructions: string;
  notes: string;
  createdBy: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface EarIrrigationRequest {
  earIrrigationNumber: string;
  patientID: number;
  cardNumber: string;
  orderingPhysicianID: string;
  earSide: 'Left' | 'Right' | 'Both';
  irrigationSolution: string;
  solutionTemperature: string;
  irrigationPressure: string;
  procedureDuration: number;
  findings: string;
  complications: string;
  instructions: string;
  notes: string;
  createdBy: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

// Procedure status update
export interface ProcedureStatusUpdate {
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  performedBy: string;
  performedDate: Date;
  notes?: string;
}

// Procedure administration request
export interface AdministerProcedureRequest {
  procedureID: number;
  procedureType: 'Injection' | 'WoundCare' | 'Suturing' | 'EarIrrigation';
  performedBy: string;
  performedDate: Date;
  notes?: string;
}
