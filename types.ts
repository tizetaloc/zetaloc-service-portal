export interface Participant {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface FormData {
  companyName: string;
  isMachineStopped: boolean;
  equipmentModel: string;
  serialNumber: string;
  problemDescription: string;
  problemType: string; // New field for problem classification
  hourMeter: string;
  location: string;
  mapsLink?: string; // New field to store the raw Google Maps URL
  
  // Primary Responsible
  responsibleName: string;
  responsibleRole: string;
  responsibleEmail: string;
  responsibleContact: string;

  // Additional Participants
  additionalParticipants: Participant[];

  platePhoto: File | null;
  evidenceFiles: File[];
}

export interface FormErrors {
  companyName?: string;
  equipmentModel?: string;
  serialNumber?: string;
  problemDescription?: string;
  problemType?: string;
  hourMeter?: string;
  location?: string;
  responsibleName?: string;
  responsibleRole?: string;
  responsibleEmail?: string;
  responsibleContact?: string;
  platePhoto?: string;
}