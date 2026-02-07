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
    referralID: number;
    patientID: number;
    cardNumber: string;
    referringPhysician: string;
    referredTo: string;
    referredToAddress?: string;
    referredToPhone?: string;
    reasonForReferral: string;
    clinicalFindings?: string;
    diagnosis?: string;
    investigationResult?: string;
    rxGiven?: string;
    referralDate: string | Date;
    status: string;
    createdBy: string;
    completedDate?: string | Date | null;

    feedbackFinding?: string;
    feedbackDiagnosis?: string;
    feedbackRxGiven?: string;
    feedbackPhysician?: string;
    feedbackDate?: string | Date | null;
    feedbackSignature?: string;
    referralNumber: string;
}

export interface ReferralFormData {
    PatientID: number;
    CardNumber: string;
    ReferringPhysician: string;
    CreatedBy: string;
    ReferredTo: string;
    ReferredToAddress?: string;
    ReferredToPhone?: string;
    ReasonForReferral: string;
    ClinicalFindings?: string;
    Diagnosis?: string;
    InvestigationResult?: string;
    RxGiven?: string;
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
    CompletedDate?: Date | null;
}