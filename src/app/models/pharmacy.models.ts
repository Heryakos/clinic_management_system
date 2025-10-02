export interface Prescription {
    prescriptionID: string;
    CardNumber: string;
    FullName: string;
    PrescriptionDate: string;
    Status: string;
    PrescriberName: string;
    PharmacistName: string;
    patientID?: string;
    MedicationName?: string;
  }
  
  export interface Patient {
    PatientID: string;
    CardNumber: string;
    firstName: string;
    lastName: string;
    age?: number;
    gender?: string;
  }