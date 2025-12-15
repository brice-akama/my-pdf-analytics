// lib/attachmentConfig.ts

export interface AttachmentType {
  id: string;
  name: string;
  description: string;
  icon: string;
  examples: string[];
  useCases: string[];
}

export const ATTACHMENT_TYPES: AttachmentType[] = [
  {
    id: 'proof_of_identity',
    name: 'Proof of Identity',
    description: 'Government-issued ID, passport, or driver\'s license',
    icon: '🪪',
    examples: ['Driver\'s License', 'Passport', 'National ID', 'Social Security Card'],
    useCases: ['KYC Verification', 'Account Opening', 'Loan Applications', 'Employment']
  },
  {
    id: 'proof_of_address',
    name: 'Proof of Address',
    description: 'Utility bill, bank statement, or lease agreement',
    icon: '🏠',
    examples: ['Utility Bill', 'Bank Statement', 'Lease Agreement', 'Tax Document'],
    useCases: ['Address Verification', 'Banking', 'Real Estate', 'Insurance']
  },
  {
    id: 'tax_form',
    name: 'Tax Form',
    description: 'W-9, W-4, 1099, or other tax-related documents',
    icon: '📋',
    examples: ['W-9 Form', 'W-4 Form', '1099 Form', 'Tax Return'],
    useCases: ['Contractor Onboarding', 'Payroll Setup', 'Vendor Management']
  },
  {
    id: 'bank_info',
    name: 'Banking Information',
    description: 'Void check, bank letter, or account verification',
    icon: '🏦',
    examples: ['Void Check', 'Bank Letter', 'Direct Deposit Form'],
    useCases: ['Payroll Setup', 'Payment Processing', 'Refunds']
  },
  {
    id: 'insurance_card',
    name: 'Insurance Card',
    description: 'Health, auto, or other insurance documentation',
    icon: '🩺',
    examples: ['Health Insurance Card', 'Auto Insurance', 'Life Insurance Policy'],
    useCases: ['Healthcare', 'Employment Benefits', 'Claims Processing']
  },
  {
    id: 'certification',
    name: 'Certification/License',
    description: 'Professional licenses, certifications, or credentials',
    icon: '🎓',
    examples: ['Professional License', 'Degree Certificate', 'Training Certificate'],
    useCases: ['Professional Verification', 'Compliance', 'Employment']
  },
  {
    id: 'financial_statement',
    name: 'Financial Statement',
    description: 'Bank statements, pay stubs, or financial records',
    icon: '💰',
    examples: ['Pay Stub', 'Bank Statement', 'Tax Return', 'Credit Report'],
    useCases: ['Loan Applications', 'Mortgage', 'Credit Checks', 'Financial Planning']
  },
  {
    id: 'supporting_document',
    name: 'Supporting Document',
    description: 'Any additional documentation required',
    icon: '📄',
    examples: ['Contract Addendum', 'Terms & Conditions', 'Additional Agreement'],
    useCases: ['General Documentation', 'Contract Supplements', 'References']
  }
];

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_PER_REQUEST = 10;

export const ALLOWED_ATTACHMENT_TYPES = [
  { mime: 'application/pdf', extension: '.pdf', name: 'PDF' },
  { mime: 'image/jpeg', extension: '.jpg', name: 'JPEG Image' },
  { mime: 'image/jpg', extension: '.jpg', name: 'JPG Image' },
  { mime: 'image/png', extension: '.png', name: 'PNG Image' },
  { mime: 'application/msword', extension: '.doc', name: 'Word Document' },
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: '.docx', name: 'Word Document' },
  { mime: 'application/vnd.ms-excel', extension: '.xls', name: 'Excel Spreadsheet' },
  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx', name: 'Excel Spreadsheet' }
];

export const getAttachmentTypeById = (id: string): AttachmentType | undefined => {
  return ATTACHMENT_TYPES.find(type => type.id === id);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const validateAttachment = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB`
    };
  }

  const isAllowed = ALLOWED_ATTACHMENT_TYPES.some(type => type.mime === file.type);
  if (!isAllowed) {
    return {
      valid: false,
      error: 'File type not supported. Please upload PDF, Image, Word, or Excel files.'
    };
  }

  return { valid: true };
};