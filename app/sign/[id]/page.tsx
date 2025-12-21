//app/sign/[id]/page.tsx

"use client"
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Check, AlertCircle, X, FileSignature, Loader2, Clock, ChevronLeft, ChevronRight, Download, CheckSquare, Square, Paperclip, Camera } from 'lucide-react';
import { SignatureStyleModal } from '@/components/SignatureStyleModal';
import { AttachmentModal } from '@/components/AttachmentModal';
import { AccessCodeModal } from '@/components/AccessCodeModal';
import { SelfieVerificationModal } from '@/components/SelfieVerificationModal';




// Type definitions
interface Document {
  id: string;
  filename: string;
  numPages: number;
}

interface Recipient {
  name: string;
  email: string;
  index: number;
}

interface SignatureField {
  id: string;
  page: number;
  recipientIndex: number;
  type: 'signature' | 'date' | 'text' | 'checkbox' | "attachment" | 'dropdown' | 'radio'; 
  x: number;
  y: number;
  width?: number;
  height?: number;
  recipientName?: string; // ⭐ ADD THIS
  recipientEmail?: string; // ⭐ ADD THIS
  label?: string;
  defaultChecked?: boolean;
  attachmentLabel?: string;
  isRequired?: boolean;
  // ⭐ NEW: For dropdown and radio buttons
  options?: string[]; // List of options to choose from
  defaultValue?: string; // Pre-selected option

  // ADD THIS:
  conditional?: {
    enabled: boolean;
    dependsOn: string | number;
    condition: 'checked' | 'unchecked' | 'equals' | 'not_equals' | 'contains';
    value?: string;
  };
}

interface SignatureData {
  type: string;
  data: string;
  timestamp: string;
}

const DocSendSigningPage = () => {
  const getSignIdFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/\/sign\/(.+)/);
    return match ? match[1] : null;
  };
  const signatureId = getSignIdFromUrl();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [signatures, setSignatures] = useState<Record<string, SignatureData>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [completed, setCompleted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signatureData, setSignatureData] = useState('');
  const [textFieldInput, setTextFieldInput] = useState('');
  const [activeTextField, setActiveTextField] = useState<SignatureField | null>(null);
  const [isAwaitingTurn, setIsAwaitingTurn] = useState(false);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number | null>(null);
  const [signatureRequest ] = useState<any | null>(null); 
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [showDeclineModal, setShowDeclineModal] = useState(false);
const [declineReason, setDeclineReason] = useState('');
const [decliningDocument, setDecliningDocument] = useState(false);
const [wasDeclined, setWasDeclined] = useState(false);
const [showAttachmentModal, setShowAttachmentModal] = useState(false);
const [activeAttachmentField, setActiveAttachmentField] = useState<SignatureField | null>(null);
const [attachments, setAttachments] = useState<Record<string, any[]>>({});  
const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
const [accessCodeVerified, setAccessCodeVerified] = useState(false);
 const fetchSignatureRequestRef = useRef<() => Promise<void>>(async () => {});
 const [showSelfieModal, setShowSelfieModal] = useState(false);
const [selfieVerified, setSelfieVerified] = useState(false);
const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
const [selfieRequired, setSelfieRequired] = useState(false);
const [showDropdownModal, setShowDropdownModal] = useState(false);
const [activeDropdownField, setActiveDropdownField] = useState<SignatureField | null>(null);
const [showRadioModal, setShowRadioModal] = useState(false);
const [activeRadioField, setActiveRadioField] = useState<SignatureField | null>(null);








 // ⭐ Check if a field should be visible based on conditional logic
const isFieldVisible = (field: SignatureField): boolean => {
  if (!field.conditional?.enabled) {
    return true; // No conditional logic, always visible
  }
  const dependsOnField = signatureFields.find(
    (f) => f.id.toString() === field.conditional!.dependsOn.toString()
  );
  if (!dependsOnField) {
    return true; // Dependency not found, show field
  }
  const dependencyValue = fieldValues[dependsOnField.id];
  
  // Evaluate condition
  switch (field.conditional.condition) {
    case "checked":
      return dependencyValue === true;
    
    case "unchecked":
      return dependencyValue !== true;
    
    case "equals":
      return dependencyValue === field.conditional.value;
    
    case "not_equals":
      return dependencyValue !== field.conditional.value;
    
    case "contains":
      if (typeof dependencyValue === "string" && field.conditional.value) {
        return dependencyValue.toLowerCase().includes(field.conditional.value.toLowerCase());
      }
      return false;
    
    default:
      return true;
  }
};



  useEffect(() => {
  if (signatureRequest?.expiresAt) {
    const expirationDate = new Date(signatureRequest.expiresAt);
    const now = new Date();
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDaysUntilExpiration(daysRemaining);

  }
}, [signatureRequest]);

  useEffect(() => {
    const fetchSignatureRequest = async () => {
      if (!signatureId) {
        setError('Invalid signing link');
        setLoading(false);
        return;
      }
      try {
        console.log('🔍 Fetching signature with ID:', signatureId);
        const res = await fetch(`/api/signature/${signatureId}`);
        const data = await res.json();
        console.log('📥 First API response:', data);
        if (!res.ok || !data.success) {
          setError(data.message || 'Failed to load signature request');
          setLoading(false);
          return;
        }
        const { signature } = data;
         console.log('🔍 Fetching signature request details...');
        const requestRes = await fetch(`/api/signature/${signatureId}/request`);
        console.log('📥 Request API status:', requestRes.ok, requestRes.status);
if (!requestRes.ok) {
  console.error('❌ Request API failed');
  setError('Failed to load signature fields');
  setLoading(false);
  return;
}
const requestData = await requestRes.json();
const signatureRequest = requestData.signatureRequest;


// ⭐ CHECK IF SELFIE VERIFICATION IS REQUIRED
// ONLY enable selfie if access code was USED and VERIFIED (check BOTH DB and local state)
const accessWasVerified = signatureRequest.accessCodeVerifiedAt || accessCodeVerified;

console.log('🔍 Selfie Verification Check:', {
  selfieVerificationRequired: signatureRequest.selfieVerificationRequired,
  accessCodeRequired: signatureRequest.accessCodeRequired,
  accessCodeVerifiedAt: signatureRequest.accessCodeVerifiedAt,
  accessCodeVerified: accessCodeVerified,
  accessWasVerified: accessWasVerified,
  willEnableSelfie: signatureRequest.selfieVerificationRequired && 
                    signatureRequest.accessCodeRequired && 
                    accessWasVerified
                    });

// ⭐ FIXED: Check if selfie is required when access code is used
if (signatureRequest.selfieVerificationRequired && signatureRequest.accessCodeRequired) {
  if (accessWasVerified) {
    console.log('📸 Selfie verification enabled (access code was verified)');
    setSelfieRequired(true);
    
    // Check if selfie already verified
    if (signatureRequest.selfieVerifiedAt) {
      console.log('✅ Selfie already verified');
      setSelfieVerified(true);
      setSelfieUrl(signatureRequest.selfieVerification?.selfieImageUrl || null);
    } else {
      console.log('⚠️ Selfie not verified yet');
      setSelfieVerified(false);
    }
  } else {
    console.log('⚠️ Selfie disabled - access code not verified yet');
    setSelfieRequired(false);
  }
} else if (signatureRequest.selfieVerificationRequired && !signatureRequest.accessCodeRequired) {
  console.log('⚠️ Selfie disabled - no access code requirement');
  setSelfieRequired(false);
} else {
  console.log('⚠️ Selfie not required');
  setSelfieRequired(false);
}

// ⭐ ADD THIS DEBUG LOG:
console.log('🔍 Access Code Check:', {
  required: signatureRequest.accessCodeRequired,
  verifiedInDB: signatureRequest.accessCodeVerifiedAt,
  verifiedLocally: accessCodeVerified,
  willShowModal: signatureRequest.accessCodeRequired && !signatureRequest.accessCodeVerifiedAt && !accessCodeVerified
});

//   ✅ CHECK ACCESS CODE - Use database value OR local state
if (signatureRequest.accessCodeRequired && 
    !signatureRequest.accessCodeVerifiedAt && 
    !accessCodeVerified) {
  console.log('🔒 Access code required but not verified yet');
  setShowAccessCodeModal(true);
  setLoading(false);
  return; // Stop here - don't load document until verified
}

//   ✅ If already verified in database, update local state
if (signatureRequest.accessCodeVerifiedAt) {
  console.log('✅ Access code already verified in database');
  setAccessCodeVerified(true);
  sessionStorage.setItem(`access_verified_${signatureId}`, 'true');
}
       
        //   CHECK IF CANCELLED
//   CHECK IF CANCELLED
console.log('🔍 Checking cancellation status...');
console.log('Status:', signatureRequest.status);

if (signatureRequest.status === 'cancelled') {
  console.log('🔍 CANCELLED REQUEST DETECTED');
  console.log('🔍 signatureRequest:', signatureRequest);
  
  const cancelledDate = signatureRequest.cancelledAt 
    ? new Date(signatureRequest.cancelledAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'recently';
  
  const reason = signatureRequest.cancellationReason || 'No reason provided';
  
  console.log('✅ Cancellation reason:', reason);
  
  setError(`This signature request was cancelled on ${cancelledDate}. Reason: ${reason}`);
  setLoading(false);
  return;
}

  


        //  CHECK EXPIRATION
if (signatureRequest.expiresAt) {
  const expirationDate = new Date(signatureRequest.expiresAt);
  const now = new Date();
  
  if (now > expirationDate) {
    setError(`This signature request expired on ${expirationDate.toLocaleDateString()}. Please contact the document sender for a new link.`);
    setLoading(false);
    return;
  }
}

// Also check for declined status
if (signatureRequest.status === 'declined') {
  console.log('🔍 DECLINED REQUEST DETECTED (this person declined)');
  const declinedDate = signatureRequest.declinedAt 
    ? new Date(signatureRequest.declinedAt).toLocaleDateString()
    : 'recently';
  const reason = signatureRequest.declineReason || 'No reason provided';
  
  setError(`You declined to sign this document on ${declinedDate}. Reason: ${reason}`);
  setLoading(false);
  return;
}

  const isAwaitingTurnStatus = signatureRequest.status === 'awaiting_turn';
        setIsAwaitingTurn(isAwaitingTurnStatus);

        //   DON'T block access - just track the status
        const isAwaitingTurn = signatureRequest.status === 'awaiting_turn';

        setDocument({
          id: signatureRequest.documentId,
          filename: signatureRequest.document?.filename || signature.documentName,
          numPages: signatureRequest.document?.numPages || 1,
        });
        setRecipient({
          name: signatureRequest.recipient.name,
          email: signatureRequest.recipient.email,
          index: signatureRequest.recipientIndex,
        });
        setSignatureFields(signatureRequest.signatureFields || []);

        // Store whether they're awaiting their turn
        if (isAwaitingTurn) {
          console.log('⏳ User is viewing document but cannot sign yet');
        }

        // Pre-populate signatures from other signers in shared mode
        if (signatureRequest.viewMode === 'shared' && signatureRequest.sharedSignatures) {
          const preFilledSignatures: Record<string, SignatureData> = {};

          Object.entries(signatureRequest.sharedSignatures).forEach(([recipientIndex, sigData]: [string, any]) => {
            // Find all fields for this recipient
            const recipientFields = signatureRequest.signatureFields.filter(
              (f: SignatureField) => f.recipientIndex === parseInt(recipientIndex)
            );

            // Match signed fields to field IDs
            recipientFields.forEach((field: SignatureField) => {
              const matchingSignedField = sigData.signedFields.find((sf: any) =>
                sf.id === field.id || sf.type === field.type
              );

              if (matchingSignedField) {
                preFilledSignatures[field.id] = {
                  type: matchingSignedField.type,
                  data: matchingSignedField.signatureData || matchingSignedField.dateValue || matchingSignedField.textValue,
                  timestamp: matchingSignedField.timestamp,
                };
              }
            });
          });

          setSignatures(preFilledSignatures);
          console.log('✅ Pre-loaded', Object.keys(preFilledSignatures).length, 'signatures from other signers');
        }
        setDocument({
          id: signatureRequest.documentId,
          filename: signatureRequest.document?.filename || signature.documentName,
          numPages: signatureRequest.document?.numPages || 1,
        });
        setRecipient({
          name: signatureRequest.recipient.name,
          email: signatureRequest.recipient.email,
          index: signatureRequest.recipientIndex,
        });
        setSignatureFields(signatureRequest.signatureFields || []);

        const pdfRes = await fetch(`/api/signature/${signatureId}/file`);
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching signature request:', err);
        setError('Failed to load document. Please try again.');
        setLoading(false);
      }
    };
    // Assign the function to the ref
  fetchSignatureRequestRef.current = fetchSignatureRequest;
    fetchSignatureRequest();
  }, [signatureId , accessCodeVerified ]);

  useEffect(() => {
  const fetchAttachments = async () => {
    if (!signatureId) return;
    
    try {
      const res = await fetch(`/api/signature/${signatureId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.attachments) {
          // Group attachments by field ID
          const grouped: Record<string, any[]> = {};
          data.attachments.forEach((att: any) => {
            if (!grouped[att.fieldId]) grouped[att.fieldId] = [];
            grouped[att.fieldId].push(att);
          });
          setAttachments(grouped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  };
  
  fetchAttachments();
}, [signatureId]);

  // Track initial view
useEffect(() => {
  if (!signatureId || !pdfUrl) return;
  const trackView = async () => {
    try {
      await fetch(`/api/signature/${signatureId}/track-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: 1,
          action: 'view',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  };
  trackView();
}, [signatureId, pdfUrl]);

// ✅ NEW: Track page exits
useEffect(() => {
  if (!signatureId) return;
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliable exit tracking
    const data = JSON.stringify({
      page: 1,
      action: 'exit',
      timestamp: new Date().toISOString(),
    });

    // sendBeacon is more reliable than fetch for page exit
    navigator.sendBeacon(
      `/api/signature/${signatureId}/track-page`,
      new Blob([data], { type: 'application/json' })
    );
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [signatureId]);

// ✅ NEW: Track scroll behavior (which pages they actually look at)
useEffect(() => {
  if (!signatureId || !pdfUrl || !document) return;

  const pagesViewed = new Set<number>();
  let scrollTimeout: NodeJS.Timeout;

  const handleScroll = () => {
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      // ⭐ FIX: Use window.document to access the DOM
      const container = window.document.getElementById('pdf-signing-container');
      if (!container) return;

      const scrollTop = window.scrollY;
      const pageHeight = 297 * 3.78; // mm to pixels
      const currentPage = Math.floor(scrollTop / pageHeight) + 1;

      // Track each page only once
      if (currentPage <= document.numPages && !pagesViewed.has(currentPage)) {
        pagesViewed.add(currentPage);

        fetch(`/api/signature/${signatureId}/track-page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: currentPage,
            action: 'scroll',
            timestamp: new Date().toISOString(),
          }),
        }).catch(err => console.error('Failed to track scroll:', err));
      }
    }, 500); // Debounce scroll events
  };

  window.addEventListener('scroll', handleScroll);

  return () => {
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimeout);
  };
}, [signatureId, pdfUrl, document]);


  useEffect(() => {
    if (!signatureId || !pdfUrl) return;

    const trackView = async () => {
      try {
        await fetch(`/api/signature/${signatureId}/track-view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1, // Track as page 1 since we're showing all pages
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }),
        });
      } catch (err) {
        console.error('Failed to track view:', err);
      }
    };

    trackView();
  }, [signatureId, pdfUrl]);

  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      if (signatureId && timeSpent > 2) {
        fetch(`/api/signature/${signatureId}/track-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1, // Track as page 1 since we're showing all pages
            timeSpent,
          }),
        }).catch(() => { });
      }
    };
  }, [signatureId]);

  const myFields = signatureFields.filter(f => f.recipientIndex === recipient?.index);
  const allFields = signatureFields;
  const allFieldsFilled = myFields.every(f => {
  if (f.type === 'attachment') {
    // ⭐ Check if required attachments are uploaded
    if (f.isRequired) {
      return attachments[f.id]?.length > 0;
    }
    return true; // Optional attachments don't block completion
  }
  return signatures[f.id]; // Existing check for other fields
});

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        setSignatureData(canvas.toDataURL());
      }
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData('');
      }
    }
  };

  const saveSignature = () => {
    if (!signatureData || !activeField || !recipient) {
      alert('Please draw your signature first');
      return;
    }
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const updatedSignatures: Record<string, SignatureData> = {
      ...signatures,
      [activeField.id]: {
        type: 'signature',
        data: signatureData,
        timestamp: new Date().toISOString()
      }
    };
    const dateFields = signatureFields.filter(
      f => f.type === 'date' && f.recipientIndex === recipient.index
    );
    dateFields.forEach(dateField => {
      updatedSignatures[dateField.id] = {
        type: 'date',
        data: currentDate,
        timestamp: new Date().toISOString()
      };
    });
    setSignatures(updatedSignatures);
    setActiveField(null);
    setSignatureData('');
    clearSignature();
  };

  const handleTextInput = (fieldId: string, value: string) => {
    setSignatures(prev => ({
      ...prev,
      [fieldId]: {
        type: 'text',
        data: value,
        timestamp: new Date().toISOString()
      }
    }));
    // ⭐ NEW: Update field values for conditional logic
  setFieldValues((prev) => ({
    ...prev,
    [fieldId]: value,
  }));
  };

  const completeSignature = async () => {
    console.log('🔍 === COMPLETE SIGNING CLICKED ===');
  console.log('🔍 allFieldsFilled:', allFieldsFilled);
  console.log('🔍 selfieRequired:', selfieRequired);
  console.log('🔍 selfieVerified:', selfieVerified);
  console.log('🔍 accessCodeVerified:', accessCodeVerified);
  if (!allFieldsFilled) {
    alert('Please complete all required fields before submitting');
    return;
  }

  // ⭐ ADD DEBUG LOGGING
  console.log('🔍 Complete Signing Check:', {
    selfieRequired,
    selfieVerified,
    accessCodeVerified,
    shouldShowSelfie: selfieRequired && !selfieVerified
  });

  // ⭐ CHECK IF SELFIE VERIFICATION IS REQUIRED BUT NOT DONE
  if (selfieRequired && !selfieVerified) {
    console.log('📸 Selfie verification required - opening modal');
    setShowSelfieModal(true);
    return;
  }

  // Proceed with submission
  await submitSignature();
};

// ⭐ NEW FUNCTION: Actual signature submission
const submitSignature = async () => {
  setSubmitting(true);
  try {
    let ipAddress = null;
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      ipAddress = ipData.ip;
    } catch (err) {
      console.warn('Could not fetch IP address');
    }

    const signedFieldsArray = Object.entries(signatures).map(([id, sig]) => ({
      id: parseInt(id),
      type: sig.type,
      signatureData: sig.type === 'signature' ? sig.data : null,
      dateValue: sig.type === 'date' ? sig.data : null,
      textValue: (sig.type === 'text' || 
              sig.type === 'checkbox' || 
              sig.type === 'dropdown' || 
              sig.type === 'radio') 
    ? sig.data 
    : null,
      timestamp: sig.timestamp,
    }));

    const res = await fetch(`/api/signature/${signatureId}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signedFields: signedFieldsArray,
        signedAt: new Date().toISOString(),
        ipAddress: ipAddress,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || 'Failed to submit signature');
      setSubmitting(false);
      return;
    }

    setCompleted(true);
  } catch (err) {
    console.error('Error completing signature:', err);
    alert('Failed to submit signature. Please try again.');
    setSubmitting(false);
  }
};

  const handleDecline = async () => {
  if (declineReason.trim().length < 10) {
    alert('Please provide a reason for declining (at least 10 characters)');
    return;
  }

  setDecliningDocument(true);

  try {
    let ipAddress = null;
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      ipAddress = ipData.ip;
    } catch (err) {
      console.warn('Could not fetch IP address');
    }

    const res = await fetch(`/api/signature/${signatureId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: declineReason.trim(),
        ipAddress: ipAddress,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || 'Failed to decline document');
      setDecliningDocument(false);
      return;
    }

    setShowDeclineModal(false);
    setWasDeclined(true);
    setCompleted(true);
    setDecliningDocument(false);
    
  } catch (err) {
    console.error('Error declining document:', err);
    alert('Failed to decline document. Please try again.');
    setDecliningDocument(false);
  }
};


  const handleCheckboxToggle = (fieldId: string) => {
  const currentValue = fieldValues[fieldId] || false;
  const newValue = !currentValue;
  
  // Update field values
  setFieldValues((prev) => ({
    ...prev,
    [fieldId]: newValue,
  }));
  
  // Update signatures
  setSignatures((prev) => ({
    ...prev,
    [fieldId]: {
      type: "checkbox",
      data: newValue.toString(),
      timestamp: new Date().toISOString(),
    },
  }));
};

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  // ⭐ NEW: Show access code modal BEFORE showing error screen
if (showAccessCodeModal) {
  return (
    <AccessCodeModal
      signatureId={signatureId!}
   onVerified={async () => {
  console.log('✅ Access code verified! Closing modal and reloading...');
  setAccessCodeVerified(true);
  setLoading(true);
  setShowAccessCodeModal(false);
  
  // ⭐ Wait longer for database write to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (fetchSignatureRequestRef.current) {
    await fetchSignatureRequestRef.current();
  }
}}
    />
  );
}

// Show error screen only if no access code modal
if (error || !document || !recipient) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
        <p className="text-slate-600 mb-6">
          {error || 'This signing link is invalid or has expired.'}
        </p>
        <p className="text-sm text-slate-500">
          Please contact the document sender for a new link.
        </p>
      </div>
    </div>
  );
}

  {/* Show expiration warning if < 3 days remaining */}
{daysUntilExpiration !== null && daysUntilExpiration <= 3 && daysUntilExpiration > 0 && (
  <div className="mb-3 bg-orange-50 border border-orange-300 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-orange-900">
          ⚠️ Link Expires Soon
        </p>
        <p className="text-xs text-orange-700">
          This signing link expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}. Please sign before {new Date(signatureRequest.expiresAt).toLocaleDateString()}.
        </p>
      </div>
    </div>
  </div>
)}

{signatureRequest?.status === 'cancelled' && (
  <div className="flex items-center gap-2 text-red-600">
    <X className="h-4 w-4" />
    <span className="text-sm font-medium">Cancelled</span>
    {signatureRequest?.cancelledAt && (
      <span className="text-xs text-slate-500">
        on {new Date(signatureRequest.cancelledAt).toLocaleDateString()}
      </span>
    )}
  </div>
)}

if (completed) {
  // Show DECLINE success screen
  if (wasDeclined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Document Declined</h2>
          <p className="text-slate-600 mb-6">
            You have declined to sign this document. All parties have been notified of your decision.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 mb-2"><strong>Reason provided:</strong></p>
            <p className="text-sm text-red-700 italic">"{declineReason}"</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border text-left">
            <p className="text-sm text-slate-700"><strong>Document:</strong> {document.filename}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Declined by:</strong> {recipient.name}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Email:</strong> {recipient.email}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }
  } 


  
  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Successfully Signed!</h2>
          <p className="text-slate-600 mb-6">
            Your signature has been recorded and the document owner has been notified.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">

            <a
              href={`/signed/${signatureId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download className="h-4 w-4" />
              View Signed Document Now
            </a>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border text-left">
            <p className="text-sm text-slate-700"><strong>Document:</strong> {document.filename}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Signed by:</strong> {recipient.name}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Email:</strong> {recipient.email}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading document...</p>
      </div>
    </div>
  );
}

// ✅ NEW: Separate check for access code (after loading)
if (signatureRequest?.accessCodeRequired && !accessCodeVerified) {
  return null; // The AccessCodeModal is already shown at the bottom
}


  
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/*   ADD WARNING BANNER if awaiting turn */}
          {isAwaitingTurn && (
            <div className="mb-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Waiting for Previous Signer</p>
                  <p className="text-xs text-amber-700">
                    You can view the document below, but you cannot sign yet. You'll be notified via email when it's your turn.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">{document.filename}</h1>
                <p className="text-sm text-slate-500">Signing as: {recipient.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                {Object.keys(signatures).filter(id => myFields.some(f => f.id === id)).length} / {myFields.length} your fields completed
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div id="pdf-signing-container" className="relative" style={{ minHeight: `${297 * document.numPages}mm` }}>
                {pdfUrl ? (
                  <>
                    {/* Single PDF embed showing all pages */}
                    <embed
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      type="application/pdf"
                      className="w-full"
                      style={{
                        border: 'none',
                        pointerEvents: 'none',
                        height: `${297 * document.numPages}mm`,
                        display: 'block',
                      }}
                    />

                    {/* Signature Field Overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                     {signatureFields
  .filter((field) => {
    const isMyField = field.recipientIndex === recipient?.index;
    const isVisible = isFieldVisible(field);
    return isMyField || isVisible; // Show my fields or visible shared fields
  })
  .map((field) => {
    const isFilled = field.type === 'attachment' 
      ? (attachments[field.id]?.length > 0) // ⭐ Check if attachment uploaded
      : signatures[field.id];
    const isMyField = field.recipientIndex === recipient?.index;
    const isVisible = isFieldVisible(field);
    const pageHeight = 297 * 3.78;
    const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);

    return (
      <div
        key={field.id}
        className={`absolute rounded transition-all ${
          isFilled
            ? "bg-transparent border-0"
            : !isVisible
            ? "hidden" // ⭐ Hide if not visible
            : "bg-yellow-50/80 border-2 border-yellow-400 animate-pulse hover:bg-yellow-100/80"
        }`}
        style={{
          left: `${field.x}%`,
          top: `${topPosition}px`,
          width: field.width ? `${field.width}px` : 
                 field.type === "signature" ? "200px" :
                 field.type === "checkbox" ? "30px" : 
                 field.type === "attachment" ? "200px" :
                 field.type === "dropdown" ? "250px" :
                 field.type === "radio" ? "200px" :
                 "150px",
          height: field.height ? `${field.height}px` : 
                  field.type === "signature" ? "60px" :
                  field.type === "checkbox" ? "30px" :
                  field.type === "attachment" ? "50px" :
                  field.type === "dropdown" ? "45px" :
                  field.type === "radio" ? "auto" :
                   "40px",
          transform: "translate(-50%, 0%)",
          cursor: field.type === "signature" && !isFilled ? "pointer" :
          field.type === "attachment" && !isFilled ? "pointer" :
           "default",
          pointerEvents: !isVisible ? "none" : field.type === "checkbox" ? "auto" : isFilled ? "none" : "auto",
          zIndex: 10,
        }}
        onClick={() => {
          if (!isFilled && isMyField && isVisible ) {
            if (field.type === "signature") {
              console.log('🖊️ Signature field clicked, setting activeField:', field);
              setActiveField(field);
            } else if (field.type === "text") {
              setActiveTextField(field);
              setTextFieldInput("");
            } else if (field.type === "checkbox") {
              // ⭐ Handle checkbox click
              handleCheckboxToggle(field.id);
            }  
            else if (field.type === "attachment") { // ⭐ ADD THIS
              setActiveAttachmentField(field);
              setShowAttachmentModal(true);
            }
            else if (field.type === "dropdown") {
  setActiveDropdownField(field);
  setShowDropdownModal(true);
} else if (field.type === "radio") {
  setActiveRadioField(field);
  setShowRadioModal(true);
}
          }
        }}
      >
        <div className="h-full flex flex-col items-center justify-center p-2">
          {isFilled ? (
            <>
              {field.type === "signature" && (
                <img
                  src={signatures[field.id].data}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain"
                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
                />
              )}
              {field.type === "date" && (
                <div className="text-center w-full">
                  <p className="text-sm font-medium text-slate-900 leading-tight">
                    {signatures[field.id].data}
                  </p>
                </div>
              )}
              {field.type === "text" && (
                <p className="text-sm font-medium text-slate-900 text-center px-2 leading-tight">
                  {signatures[field.id].data}
                </p>
              )}
              {/* ⭐ NEW: Checkbox display */}
          {field.type === "checkbox" && (
  <div 
    className="flex items-center gap-2 w-full h-full px-2 cursor-pointer"
    onClick={(e) => {
      e.stopPropagation();
      handleCheckboxToggle(field.id);
    }}
  >
    {fieldValues[field.id] ? (
      <CheckSquare className="h-5 w-5 text-purple-600 flex-shrink-0" />
    ) : (
      <Square className="h-5 w-5 text-slate-400 flex-shrink-0" />
    )}
   {field.label && (
     <p className="text-xs font-medium text-slate-900 mt-1 text-center whitespace-nowrap text-ellipsis">
        {field.label}
      </p>
    )}
  </div>
)}

{/* ⭐ NEW: Attachment Display */}
              {field.type === "attachment" && attachments[field.id] && (
                <div className="text-center w-full">
                  <Paperclip className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-green-800">
                    {attachments[field.id].length} file(s) uploaded
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAttachmentField(field);
                      setShowAttachmentModal(true);
                    }}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    View Files
                  </button>
                </div>
              )}

              {/* ⭐ NEW: Dropdown Display */}
{field.type === "dropdown" && (
  <div className="w-full h-full flex items-center justify-center px-2">
    <p className="text-sm font-medium text-slate-900 text-center truncate">
      {fieldValues[field.id] || signatures[field.id]?.data || ""}
    </p>
  </div>
)}

{/* ⭐ NEW: Radio Button Display */}
{field.type === "radio" && (
  <div className="w-full px-2 space-y-1">
    {field.label && (
      <p className="text-xs font-semibold text-slate-700 mb-2">{field.label}</p>
    )}
    {field.options?.map((option, idx) => (
      <label
        key={idx}
        className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-1 rounded"
      >
        <input
          type="radio"
          name={`radio-${field.id}`}
          value={option}
          checked={fieldValues[field.id] === option}
          onChange={(e) => {
            const value = e.target.value;
            setFieldValues((prev) => ({
              ...prev,
              [field.id]: value,
            }));
            setSignatures((prev) => ({
              ...prev,
              [field.id]: {
                type: "radio",
                data: value,
                timestamp: new Date().toISOString(),
              },
            }));
          }}
          disabled={!isMyField}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500"
        />
        <span className="text-xs font-medium text-slate-900">{option}</span>
      </label>
    ))}
  </div>
)}

            </>
          ) : (
            <div className="text-center">
  {field.type === "attachment" ? (
    <>
      <Paperclip className="h-5 w-5 text-yellow-700 mx-auto mb-1" />
      <p className="text-xs font-medium text-yellow-700">
        📎 {field.attachmentLabel || "Upload Required"}
      </p>
      {field.isRequired && (
        <p className="text-xs text-red-600 font-semibold mt-1">
          * Required
        </p>
      )}
      <p className="text-xs text-slate-600 mt-1">Click to upload</p>
    </>
  ) : field.type === "checkbox" ? (
    <div className="flex items-center gap-2 w-full h-full px-2">
      <Square className="h-5 w-5 text-yellow-700 flex-shrink-0" />
      {field.label && (
        <p className="text-xs text-yellow-700 font-medium truncate">
          {field.label}
        </p>
      )}
    </div>
  ) : (
    <>
      <p className="text-xs font-medium text-yellow-700">
  {field.type === "signature"
    ? isMyField
      ? "✍️ Click to Sign"
      : "⏳ Awaiting Signature"
    : field.type === "date"
    ? isMyField
      ? "📅 Auto-filled"
      : "📅 Date pending"
    : field.type === "dropdown"
    ? isMyField
      ? "📋 Select Option"
      : "⏳ Awaiting Selection"
    : field.type === "radio"
    ? isMyField
      ? "⭕ Choose Option"
      : "⏳ Awaiting Choice"
    : isMyField
    ? "📝 Click to Fill"
    : "⏳ Awaiting Input"}
</p>

      <p className="text-xs text-slate-600 mt-1 font-semibold">
        {(field as any).recipientName || `Recipient ${field.recipientIndex + 1}`}
        {isMyField && " (You)"}
      </p>
    </>
  )}
</div>

          )}
        </div>
      </div>
    );
  })}
                    </div>
                  </>
                ) : (
                  <div className="h-[700px] flex items-center justify-center bg-slate-50">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">

              {/*   ADD status indicator at top */}
    {isAwaitingTurn && (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">Awaiting Turn</span>
        </div>
        <p className="text-xs text-amber-700">
          You can review the document, but signing is disabled until the previous signer completes.
        </p>
      </div>
    )}
              <h3 className="font-semibold text-slate-900 mb-4">Signature Progress</h3>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Completed</span>
                  <span>{Object.keys(signatures).length} / {myFields.length}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${myFields.length > 0 ? (Object.keys(signatures).length / myFields.length) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {allFields.map(field => {  // ⬅️ Show all fields
                  const isMyField = field.recipientIndex === recipient?.index;
                  const isFilled = field.type === 'attachment' 
                  ? (attachments[field.id]?.length > 0) // ⭐ ADD THIS
      : signatures[field.id];
                  return (
                    <div
                      key={field.id}
        className={`p-3 rounded-lg border ${isFilled
          ? 'bg-green-50 border-green-200'
          : isMyField
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-slate-50 border-slate-200'
        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">
                         {field.type === 'signature' ? '✍️ Signature' :
             field.type === 'date' ? '📅 Date' :
             field.type === 'text' ? '📝 Text Field' :
             field.type === 'checkbox' ? '☑️ Checkbox' :
             field.type === 'attachment' ? `📎 ${field.attachmentLabel || 'Attachment'}` : // ⭐ ADD THIS
             field.type === 'dropdown' ? `📋 ${field.label || 'Dropdown'}` :
             field.type === 'radio' ? `⭕ ${field.label || 'Radio Button'}` :
             'Field'}
                            
                          {!isMyField && ' (Other signer)'}  {/* ⬅️ Show indicator */}
                        </span>
                        {signatures[field.id] && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Page {field.page}</p>
                      {/* ⭐ NEW: Show required indicator for attachments */}
        {field.type === 'attachment' && field.isRequired && !isFilled && (
          <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
            Required
          </span>
        )}
                    </div>
                  )
                })}
              </div>
             {/* Complete Signing Button */}
  <button
  onClick={completeSignature}
  disabled={!allFieldsFilled || submitting || isAwaitingTurn}
  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
    allFieldsFilled && !submitting && !isAwaitingTurn
      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
  }`}
>
  {submitting ? (
    <>
      <Loader2 className="h-5 w-5 animate-spin" />
      Submitting...
    </>
  ) : isAwaitingTurn ? (
    <>
      <Clock className="h-5 w-5" />
      Waiting for Your Turn
    </>
  ) : selfieRequired && !selfieVerified ? (
    <>
      <Camera className="h-5 w-5" />
      Verify Identity & Sign
    </>
  ) : allFieldsFilled ? (
    <>
      <Check className="h-5 w-5" />
      Complete Signing
    </>
  ) : (
    'Complete All Fields'
  )}
</button>
  {/* Decline to Sign Button */}
  {!isAwaitingTurn && (
    <button
      onClick={() => setShowDeclineModal(true)}
      disabled={submitting}
      className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <X className="h-5 w-5" />
      Decline to Sign
    </button>
  )}

  <p className="text-xs text-slate-500 text-center mt-2">
    By clicking "Complete Signing", you agree that your signature is legally binding.
  </p>
            </div>
            
          </div>
        </div>
      </div>
      <SignatureStyleModal
  isOpen={activeField !== null}
  onClose={() => {
    setActiveField(null);
    clearSignature();
  }}
  onSave={(signatureData) => {
    if (!activeField || !recipient) return;
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const updatedSignatures: Record<string, SignatureData> = {
      ...signatures,
      [activeField.id]: {
        type: 'signature',
        data: signatureData.data,
        timestamp: new Date().toISOString()
      }
    };
    
    // Auto-fill date fields
    const dateFields = signatureFields.filter(
      f => f.type === 'date' && f.recipientIndex === recipient.index
    );
    dateFields.forEach(dateField => {
      updatedSignatures[dateField.id] = {
        type: 'date',
        data: currentDate,
        timestamp: new Date().toISOString()
      };
    });
    
    setSignatures(updatedSignatures);
    setActiveField(null);
    clearSignature();
  }}
  recipientName={recipient?.name}
/>
      {activeTextField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Enter Text</h3>
                <p className="text-sm text-slate-500 mt-1">Type your response below</p>
              </div>
              <button
                onClick={() => {
                  setActiveTextField(null);
                  setTextFieldInput('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <input
                type="text"
                value={textFieldInput}
                onChange={(e) => setTextFieldInput(e.target.value)}
                placeholder="Enter text here..."
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setActiveTextField(null);
                    setTextFieldInput('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (textFieldInput.trim()) {
                      handleTextInput(activeTextField.id, textFieldInput.trim());
                      setActiveTextField(null);
                      setTextFieldInput('');
                    }
                  }}
                  disabled={!textFieldInput.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Decline Modal */}
{showDeclineModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full scrollball max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              Decline to Sign
            </h3>
            <p className="text-sm text-slate-500 mt-1">Please provide a reason for declining</p>
          </div>
          <button
            onClick={() => {
              setShowDeclineModal(false);
              setDeclineReason('');
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reason for declining <span className="text-red-500">*</span>
          </label>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Please explain why you're declining to sign this document..."
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:outline-none resize-none"
            rows={4}
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-1">
            Minimum 10 characters • {declineReason.length}/500
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            <strong>⚠️ Warning:</strong> Declining this document will:
          </p>
          <ul className="text-xs text-red-700 mt-2 space-y-1 ml-4">
            <li>• Cancel the entire signing process</li>
            <li>• Notify all parties involved</li>
            <li>• Prevent further signatures</li>
            <li>• This action cannot be undone</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDeclineModal(false);
              setDeclineReason('');
            }}
            disabled={decliningDocument}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDecline}
            disabled={declineReason.trim().length < 10 || decliningDocument}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {decliningDocument ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Declining...
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                Decline Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/*   NEW: Attachment Upload Modal */}
{showAttachmentModal && activeAttachmentField && (
  <AttachmentModal
    isOpen={showAttachmentModal}
    onClose={() => {
      setShowAttachmentModal(false);
      setActiveAttachmentField(null);
    }}
    signatureId={signatureId!}
    fieldId={activeAttachmentField.id.toString()}
    existingAttachments={attachments[activeAttachmentField.id] || []}
    onAttachmentsChange={() => {
      // Refresh attachments
      fetch(`/api/signature/${signatureId}/attachments`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const grouped: Record<string, any[]> = {};
            data.attachments.forEach((att: any) => {
              if (!grouped[att.fieldId]) grouped[att.fieldId] = [];
              grouped[att.fieldId].push(att);
            });
            setAttachments(grouped);
          }
        });
    }}
  />
)}

{/* Selfie Verification Modal */}
{showSelfieModal && (
  <SelfieVerificationModal
    isOpen={showSelfieModal}
    onClose={() => setShowSelfieModal(false)}
    onVerified={(url) => {
      console.log('✅ Selfie verified!', url);
      setSelfieVerified(true);
      setSelfieUrl(url);
      setShowSelfieModal(false);
      
      // Now submit the signature
      submitSignature();
    }}
    signatureId={signatureId!}
  />
)}
{/* Dropdown Selection Modal */}
{showDropdownModal && activeDropdownField && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {activeDropdownField.label || "Select an Option"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">Choose one option below</p>
          </div>
          <button
            onClick={() => {
              setShowDropdownModal(false);
              setActiveDropdownField(null);
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {activeDropdownField.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => {
                const value = option;
                setFieldValues((prev) => ({
                  ...prev,
                  [activeDropdownField.id]: value,
                }));
                setSignatures((prev) => ({
                  ...prev,
                  [activeDropdownField.id]: {
                    type: "dropdown",
                    data: value,
                    timestamp: new Date().toISOString(),
                  },
                }));
                setShowDropdownModal(false);
                setActiveDropdownField(null);
              }}
              className="w-full text-left px-4 py-3 border-2 border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <span className="font-medium text-slate-900">{option}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

{/* Radio Button Selection Modal */}
{showRadioModal && activeRadioField && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {activeRadioField.label || "Choose an Option"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">Select one option</p>
          </div>
          <button
            onClick={() => {
              setShowRadioModal(false);
              setActiveRadioField(null);
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {activeRadioField.options?.map((option, idx) => (
            <label
              key={idx}
              className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all"
            >
              <input
                type="radio"
                name={`radio-modal-${activeRadioField.id}`}
                value={option}
                checked={fieldValues[activeRadioField.id] === option}
                onChange={(e) => {
                  const value = e.target.value;
                  setFieldValues((prev) => ({
                    ...prev,
                    [activeRadioField.id]: value,
                  }));
                  setSignatures((prev) => ({
                    ...prev,
                    [activeRadioField.id]: {
                      type: "radio",
                      data: value,
                      timestamp: new Date().toISOString(),
                    },
                  }));
                }}
                className="h-5 w-5 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-medium text-slate-900">{option}</span>
            </label>
          ))}
        </div>

        <button
          onClick={() => {
            setShowRadioModal(false);
            setActiveRadioField(null);
          }}
          className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default DocSendSigningPage;