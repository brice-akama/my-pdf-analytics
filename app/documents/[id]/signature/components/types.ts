// app/documents/[id]/signature/components/types.ts
// ── Single source of truth for all signature types ──────────────────────────
// Import this in page.tsx AND every component. Never redefine these locally.

export type DocumentType = {
  _id: string;
  filename: string;
  numPages: number;
  isTemplate?: boolean;
};

export type Recipient = {
  name: string;
  email: string;
  role?: string;
  color?: string;
};

export type CCRecipient = {
  name: string;
  email: string;
  notifyWhen: "completed" | "immediately";
};

export type SignatureField = {
  id: string | number;
  type: "signature" | "date" | "text" | "checkbox" | "attachment" | "dropdown" | "radio";
  x: number;
  y: number;
  page: number;
  recipientIndex: number;
  width?: number;
  height?: number;
  label?: string;
  defaultChecked?: boolean;
  attachmentLabel?: string;
  attachmentType?: string;
  isRequired?: boolean;
  options?: string[];
  defaultValue?: string;
  conditional?: {
    enabled: boolean;
    dependsOn: string | number;
    condition: "checked" | "unchecked" | "equals" | "not_equals" | "contains";
    value?: string;
  };
};

export type SignatureRequest = {
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  dueDate?: string;
  isTemplate: boolean;
  intentVideoRequired?: boolean;
  step: number;
  recipients: Recipient[];
  signatureFields: SignatureField[];
  viewMode?: "isolated" | "shared";
  signingOrder?: "any" | "sequential";
  expirationDays?: string;
  ccRecipients?: CCRecipient[];
  accessCodeRequired?: boolean;
  accessCodeType?: string;
  accessCodeHint?: string;
  accessCode?: string;
  scheduledSendDate?: string;
};