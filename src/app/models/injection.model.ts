// Injection Models
export interface InjectionSchedule {
    patientID?: number; 
    scheduleID?: number;
    injectionID: number;
    scheduledDate: Date;
    scheduledTime?: string;
    status: 'Pending' | 'Administered' | 'Missed' | 'Cancelled';
    administeredBy?: string;
    administeredByName?: string;
    administeredDate?: Date;
    notes?: string;
  }
  
  export interface Injection {
    injectionID?: number;
    injectionNumber: string;
    patientID: number;
    cardNumber: string;
    orderingPhysicianID: string;
    orderingPhysicianName?: string;
    medicationID: number;
    medicationName?: string;
    strength?: string;
    dosageForm?: string;
    dose: string;
    route: string;
    site: string;
    frequency: string;
    duration: string; // e.g., "5 days", "2 weeks"
    instructions?: string;
    notes?: string;
    injectionDate?: Date;
    status: 'Active' | 'Completed' | 'Cancelled';
    createdBy: string;
    createdDate?: Date;
  
    // Recurring injection fields
    isRecurring: boolean;
    startDate: Date;
    endDate?: Date;
    totalDoses?: number;
    administeredDoses?: number;
    schedules?: InjectionSchedule[];
  
    // Patient details
    fullName?: string;
    gender?: string;
    age?: number;
    weight?: number;
    woreda?: string;
    houseNo?: string;
    phone?: string;
    medicalHistory?: string;
  }
  
  export interface InjectionFormData {
    injectionNumber: string;
    patientID: number;
    cardNumber: string;
    orderingPhysicianID: string;
    medicationID: number;
    dose: string;
    route: string;
    site: string;
    frequency: string;
    duration: string;
    instructions?: string;
    notes?: string;
    createdBy: string;
    isRecurring: boolean;
    startDate: Date;
    totalDoses?: number;
  }
  
  export interface AdministerInjectionRequest {
    scheduleID: number;
    administeredBy: string;
    administeredDate: Date;
    notes?: string;
  }
  