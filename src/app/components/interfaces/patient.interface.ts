export interface PatientSummary {
    PatientID: number;
    CardNumber: string;
    FullName?: string;
    Age?: number;
    gender?: string;
    phone?: string;
    Address?: string;
}

export interface Referral {
    ReferralID: number;
    PatientID: number;
    CardNumber: string;
    ReferringPhysician: string; // GUID as string for Angular
    Department: string;
    ReferralDate: Date;
    Status: string;
    Notes?: string;
    ReferenceID?: number;
    CreatedBy: string; // GUID as string
    CompletedDate?: Date;
    // Fields from ReferralDetails table
    ClinicalHistory?: string;
    CurrentDiagnosis?: string;
    VitalSignsBloodPressure?: string;
    VitalSignsHeartRate?: string;
    VitalSignsTemperature?: string;
    VitalSignsWeight?: string;
    VitalSignsHeight?: string;
    CurrentMedications?: string;
    Allergies?: string;
    LabResults?: string;
    InsuranceProvider?: string;
    PolicyNumber?: string;
    GroupNumber?: string;
    UrgentFollowUp: boolean;
    TransportationNeeded: boolean;
    InterpreterNeeded: boolean;
    AdditionalNotes?: string;
    PhysicianName?: string;
    PhysicianLicense?: string;
    PhysicianPhone?: string;
    PhysicianSignature?: string;
    
    // Additional fields for display
    referralNumber?: string;
    referredTo?: string;
    specialty?: string;
    priority?: string;
}

export interface ReferralFormData {
    PatientID: number;
    CardNumber: string;
    ReferringPhysician: string; // GUID as string
    Department: string;
    Notes?: string;
    ReferenceID?: number;
    CreatedBy: string; // GUID as string
    ClinicalHistory?: string;
    CurrentDiagnosis?: string;
    VitalSignsBloodPressure?: string;
    VitalSignsHeartRate?: string;
    VitalSignsTemperature?: string;
    VitalSignsWeight?: string;
    VitalSignsHeight?: string;
    CurrentMedications?: string;
    Allergies?: string;
    LabResults?: string;
    InsuranceProvider?: string;
    PolicyNumber?: string;
    GroupNumber?: string;
    UrgentFollowUp: boolean;
    TransportationNeeded: boolean;
    InterpreterNeeded: boolean;
    AdditionalNotes?: string;
    PhysicianName?: string;
    PhysicianLicense?: string;
    PhysicianPhone?: string;
    PhysicianSignature?: string;
    referralDate?: string;
}

export interface VitalSigns {
    BloodPressure?: string;
    HeartRate?: string;
    Temperature?: string;
    Weight?: string;
    Height?: string;
}

export interface ReferralStatusUpdate {
    Status: string;
    CompletedDate?: Date;
}