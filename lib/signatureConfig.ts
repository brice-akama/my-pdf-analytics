// lib/signatureConfig.ts

export interface SignatureFont {
  id: string;
  name: string;
  fontFamily: string;
  preview: string;
}

export interface SignatureColor {
  id: string;
  name: string;
  hex: string;
}

export const SIGNATURE_FONTS: SignatureFont[] = [
  {
    id: 'dancing-script',
    name: 'Elegant Script',
    fontFamily: "'Dancing Script', cursive",
    preview: 'John Doe'
  },
  {
    id: 'great-vibes',
    name: 'Classic Signature',
    fontFamily: "'Great Vibes', cursive",
    preview: 'John Doe'
  },
  {
    id: 'pacifico',
    name: 'Modern Flow',
    fontFamily: "'Pacifico', cursive",
    preview: 'John Doe'
  },
  {
    id: 'allura',
    name: 'Professional Cursive',
    fontFamily: "'Allura', cursive",
    preview: 'John Doe'
  }
];

export const SIGNATURE_COLORS: SignatureColor[] = [
  {
    id: 'black',
    name: 'Black',
    hex: '#000000'
  },
  {
    id: 'blue',
    name: 'Blue',
    hex: '#1e40af'
  },
  {
    id: 'navy',
    name: 'Navy',
    hex: '#1e3a8a'
  }
];

export const MAX_SIGNATURE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_SIGNATURE_FORMATS = ['image/png', 'image/jpeg', 'image/jpg'];

export const validateSignatureFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_SIGNATURE_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_SIGNATURE_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  if (!ALLOWED_SIGNATURE_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PNG and JPG/JPEG formats are allowed'
    };
  }

  return { valid: true };
};

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};