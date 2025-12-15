// lib/accessCodeConfig.ts

export interface AccessCodeSettings {
  minLength: number;
  maxLength: number;
  maxAttempts: number;
  lockoutDurationMinutes: number;
  caseInsensitive: boolean;
  allowSpaces: boolean;
}

export const ACCESS_CODE_SETTINGS: AccessCodeSettings = {
  minLength: 4,
  maxLength: 50,
  maxAttempts: 5,
  lockoutDurationMinutes: 30,
  caseInsensitive: true,
  allowSpaces: false,
};

export interface AccessCodeType {
  id: string;
  name: string;
  description: string;
  icon: string;
  example: string;
  useCases: string[];
}

export const ACCESS_CODE_TYPES: AccessCodeType[] = [
  {
    id: 'custom',
    name: 'Custom Code',
    description: 'Set any code you want',
    icon: '🔑',
    example: 'SecurePass2024',
    useCases: ['General security', 'Flexible authentication']
  },
  {
    id: 'last_4_ssn',
    name: 'Last 4 of SSN',
    description: 'Last 4 digits of Social Security Number',
    icon: '🔢',
    example: '1234',
    useCases: ['HR documents', 'Tax forms', 'Payroll']
  },
  {
    id: 'employee_id',
    name: 'Employee ID',
    description: 'Company employee identification number',
    icon: '👤',
    example: 'EMP-5678',
    useCases: ['Employee onboarding', 'Internal documents']
  },
  {
    id: 'birth_date',
    name: 'Date of Birth',
    description: 'Format: MMDDYYYY or MM/DD/YYYY',
    icon: '🎂',
    example: '01151990',
    useCases: ['Healthcare', 'Insurance', 'Identity verification']
  },
  {
    id: 'account_number',
    name: 'Account Number',
    description: 'Last 4-6 digits of account number',
    icon: '💳',
    example: '9876',
    useCases: ['Banking', 'Financial services', 'Customer accounts']
  },
  {
    id: 'phone_last_4',
    name: 'Last 4 of Phone',
    description: 'Last 4 digits of phone number',
    icon: '📱',
    example: '5678',
    useCases: ['Customer verification', 'Account recovery']
  }
];

export const validateAccessCode = (
  code: string,
  settings: AccessCodeSettings = ACCESS_CODE_SETTINGS
): { valid: boolean; error?: string } => {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Access code is required' };
  }

  const trimmedCode = code.trim();

  if (trimmedCode.length < settings.minLength) {
    return {
      valid: false,
      error: `Access code must be at least ${settings.minLength} characters`,
    };
  }

  if (trimmedCode.length > settings.maxLength) {
    return {
      valid: false,
      error: `Access code must not exceed ${settings.maxLength} characters`,
    };
  }

  return { valid: true };
};

export const normalizeAccessCode = (
  code: string,
  settings: AccessCodeSettings = ACCESS_CODE_SETTINGS
): string => {
  let normalized = code.trim();

  if (!settings.allowSpaces) {
    normalized = normalized.replace(/\s+/g, '');
  }

  if (settings.caseInsensitive) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
};

export const hashAccessCode = async (code: string): Promise<string> => {
  const normalized = normalizeAccessCode(code);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const verifyAccessCode = async (
  inputCode: string,
  storedHash: string
): Promise<boolean> => {
  const inputHash = await hashAccessCode(inputCode);
  return inputHash === storedHash;
};