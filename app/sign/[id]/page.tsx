//app/sign/[id]/page.tsx

"use client"
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Check, AlertCircle, X, FileSignature, Loader2, Clock, ChevronLeft, ChevronRight, Download, CheckSquare, Square, Paperclip, Camera, UserPlus, Eye, Mail  } from 'lucide-react';
import { SignatureStyleModal } from '@/components/SignatureStyleModal';
import { AttachmentModal } from '@/components/AttachmentModal';
import { AccessCodeModal } from '@/components/AccessCodeModal';
import { SelfieVerificationModal } from '@/components/SelfieVerificationModal';
import { DelegateSigningModal } from '@/components/DelegateSigningModal';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';






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
const [showDelegateModal, setShowDelegateModal] = useState(false);
 const router = useRouter();
 const [viewOnlyMode, setViewOnlyMode] = useState(false);
const [reassignmentInfo, setReassignmentInfo] = useState<any>(null);
const [delegationInfo, setDelegationInfo] = useState<any>(null);
const [isDelegatedMode, setIsDelegatedMode] = useState(false);
const [isScheduled, setIsScheduled] = useState(false);
const [scheduledDate, setScheduledDate] = useState<string | null>(null);
const [showIntentVideoModal, setShowIntentVideoModal] = useState(false);
const [intentVideoBlob, setIntentVideoBlob] = useState<string | null>(null); //   Changed from intentVideoUrl
const [recordingIntentVideo, setRecordingIntentVideo] = useState(false);
const [intentVideoRequired, setIntentVideoRequired] = useState(false);
const [mediaRecorderRef, setMediaRecorderRef] = useState<MediaRecorder | null>(null); 
const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [navigatorTab, setNavigatorTab] = useState<'fields' | 'pages'>('fields');
const [showMessagePopover, setShowMessagePopover] = useState(false);
const [showHelpPopover, setShowHelpPopover] = useState(false);
const [messageToSender, setMessageToSender] = useState('');
const [messageSentToSender, setMessageSentToSender] = useState(false);
const [isSendingMessage, setIsSendingMessage] = useState(false);
const [documentOwnerEmail, setDocumentOwnerEmail] = useState<string | null>(null);
const [agreedToTerms, setAgreedToTerms] = useState(false);


// ⭐ STEP 1: Load saved progress when page loads
useEffect(() => {
  const loadSavedProgress = async () => {
    if (!signatureId) return;
    
    try {
      const res = await fetch(`/api/signature/${signatureId}/autosave`);
      const data = await res.json();
      
      if (data.success && data.draftSignatures) {
        const hasSavedData = Object.keys(data.draftSignatures).length > 0;
        
        if (hasSavedData) {
          // Ask user if they want to restore
          const shouldRestore = window.confirm(
            `We found your previous progress (${data.progress.completed}/${data.progress.total} fields completed). Would you like to continue where you left off?`
          );
          
          if (shouldRestore) {
            setSignatures(data.draftSignatures);
            setFieldValues(data.draftFieldValues || {});
            setLastSaved(new Date(data.lastAutoSaved));
            console.log('✅ Restored saved progress');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load saved progress:', err);
    }
  };
  
  // Only load once when document is ready
  if (pdfUrl && !loading) {
    loadSavedProgress();
  }
}, [signatureId, pdfUrl, loading]);

// ⭐ STEP 2: Auto-save progress every 10 seconds
useEffect(() => {
  const autoSave = async () => {
    if (Object.keys(signatures).length === 0) return; // Nothing to save yet
    if (completed) return; // Don't save if already completed
    
    setAutoSaveStatus('saving');
    
    try {
      const res = await fetch(`/api/signature/${signatureId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          signatures, 
          fieldValues 
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        console.log('💾 Auto-saved:', data.progress);
      } else {
        setAutoSaveStatus('error');
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      setAutoSaveStatus('error');
    }
    
    // Reset status after 2 seconds
    setTimeout(() => setAutoSaveStatus('idle'), 2000);
  };
  
  const interval = setInterval(autoSave, 10000); // Every 10 seconds
  return () => clearInterval(interval);
}, [signatures, fieldValues, signatureId, completed]);

// ⭐ STEP 3: Save before page unload
useEffect(() => {
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    if (Object.keys(signatures).length > 0 && !completed) {
      // Quick save before leaving
      navigator.sendBeacon(
        `/api/signature/${signatureId}/autosave`,
        new Blob([JSON.stringify({ signatures, fieldValues })], { type: 'application/json' })
      );
      
      // Show warning
      e.preventDefault();
      e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [signatures, fieldValues, signatureId, completed]);




// Helper function to scroll to a specific field
const scrollToField = (fieldId: string) => {
  const field = signatureFields.find(f => f.id === fieldId);
  if (!field) return;
  
  const pageHeight = 297 * 3.78; // mm to pixels
  const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);
  
  window.scrollTo({
    top: topPosition - 100, // 100px offset for sticky header
    behavior: 'smooth'
  });
  
  // Highlight the field briefly
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      const fieldElement = window.document.querySelector(`[data-field-id="${fieldId}"]`);
      if (fieldElement) {
        fieldElement.classList.add('ring-4', 'ring-purple-500', 'ring-opacity-50');
        setTimeout(() => {
          fieldElement.classList.remove('ring-4', 'ring-purple-500', 'ring-opacity-50');
        }, 2000);
      }
    }
  }, 500);
};




 //   Check if a field should be visible based on conditional logic
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

       

       
if (!res.ok) {
   //  Handle scheduled documents
  if (data.isScheduled) {
    setIsScheduled(true);
    setScheduledDate(data.scheduledDate);
    setError(data.message);
    setLoading(false);
    return;
  }
 //   Handle access denied
  if (data.accessDenied) {
    setError(`This document was reassigned to ${data.newRecipient?.name || 'another person'}. You no longer have access.`);
    setLoading(false);
    return;
  }
  setError(data.message || 'Failed to load signature request');
  setLoading(false);
  return;
}

// ⭐ Handle view-only mode
if (data.viewOnlyMode) {
  console.log('👁️ Entering view-only mode');
  setViewOnlyMode(true);
  if (data.isDelegated) {
    setIsDelegatedMode(true); //   ADD THIS
    setDelegationInfo({
      delegatedTo: data.delegatedTo,
    });
  }else {
  setReassignmentInfo({
    originalRecipient: data.originalRecipient,
    currentRecipient: data.currentRecipient,
  });
  }
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

 
//   FIXED: Check if intent video is required
if (signatureRequest.intentVideoRequired) {
  console.log('🎥 Intent video is required for this document');
  setIntentVideoRequired(true);
  
  // Check if already recorded
  if (signatureRequest.intentVideoUrl) {
    console.log('✅ Intent video already recorded');
    setIntentVideoBlob(signatureRequest.intentVideoUrl); // This will be Cloudinary URL
  } else {
    console.log('⚠️ Intent video not recorded yet');
  }
}



const ownerRes = await fetch(`/api/signature/${signatureId}/owner-info`);
if (ownerRes.ok) {
  const ownerData = await ownerRes.json();
  setDocumentOwnerEmail(ownerData.email || null);
}

//   CHECK IF SELFIE VERIFICATION IS REQUIRED
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



// ── UNIFIED SIGNATURE TRACKING ──────────────────────────────
useEffect(() => {
  if (!signatureId || !pdfUrl) return;

  // 1. Track initial view
  fetch(`/api/signature/${signatureId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'viewed', timestamp: new Date().toISOString() }),
  }).catch(() => {});

  // 2. Track time on unload
  const startTime = Date.now();
  const handleUnload = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (timeSpent > 2) {
      navigator.sendBeacon(
        `/api/signature/${signatureId}/track`,
        new Blob(
          [JSON.stringify({ action: 'time_spent', timeSpent })],
          { type: 'application/json' }
        )
      );
    }
  };

  // 3. Track pages scrolled
  let currentPageStart = Date.now();
    let currentTrackedPage = 1;
    
    const pagesViewed = new Set<number>();
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const container = globalThis.document.getElementById('pdf-scroll-container');
        const scrollTop = container ? container.scrollTop : window.scrollY;
        const pageHeight = 297 * 3.78;
        const newPage = Math.floor(scrollTop / pageHeight) + 1;
        
        if (newPage !== currentTrackedPage) {
          // Send time spent on previous page
          const timeSpent = Math.floor((Date.now() - currentPageStart) / 1000);
          if (timeSpent > 0) {
            fetch(`/api/signature/${signatureId}/track`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'page_time', page: currentTrackedPage, timeSpent }),
            }).catch(() => {});
          }
          currentTrackedPage = newPage;
          currentPageStart = Date.now();
        }
        
        if (document && newPage <= (document?.numPages || 1) && !pagesViewed.has(newPage)) {
          pagesViewed.add(newPage);
          fetch(`/api/signature/${signatureId}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'page_scroll', page: newPage }),
          }).catch(() => {});
        }
      }, 500);
    };
    
    // Also send page time on unload
    const handleUnloadPageTime = () => {
      const timeSpent = Math.floor((Date.now() - currentPageStart) / 1000);
      if (timeSpent > 0) {
        navigator.sendBeacon(
          `/api/signature/${signatureId}/track`,
          new Blob([JSON.stringify({ action: 'page_time', page: currentTrackedPage, timeSpent })], 
            { type: 'application/json' })
        );
      }
    };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('beforeunload', handleUnloadPageTime);

  const pdfContainer = globalThis.document.getElementById('pdf-scroll-container');
  if (pdfContainer) {
    pdfContainer.addEventListener('scroll', handleScroll);
  } else {
    window.addEventListener('scroll', handleScroll);
  }

  return () => {
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('beforeunload', handleUnloadPageTime);
    const pdfContainer = globalThis.document.getElementById('pdf-scroll-container');
    if (pdfContainer) {
      pdfContainer.removeEventListener('scroll', handleScroll);
    } else {
      window.removeEventListener('scroll', handleScroll);
    }
    clearTimeout(scrollTimeout);
  };
}, [signatureId, pdfUrl, document]);

   


  

  
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
  console.log('🔍 intentVideoRequired:', intentVideoRequired);
  console.log('🔍 intentVideoBlob:', intentVideoBlob);
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

  //   CHECK IF SELFIE VERIFICATION IS REQUIRED BUT NOT DONE
  if (selfieRequired && !selfieVerified) {
    console.log('📸 Selfie verification required - opening modal');
    setShowSelfieModal(true);
    return;
  }

  // ✅ Step 3: Check intent video (BEFORE submitting)
  if (intentVideoRequired && !intentVideoBlob) {
    console.log('🎥 Intent video required - opening modal');
    setShowIntentVideoModal(true);
    return; // ⭐ STOP HERE - don't submit yet
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
        intentVideoUrl: intentVideoBlob,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || 'Failed to submit signature');
      setSubmitting(false);
      return;
    }

    //   NEW: Track completion timing
try {
  await fetch(`/api/signature/${signatureId}/track-time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'completed',
    }),
  });
  console.log('⏱️ Completion time tracked');
} catch (err) {
  console.error('Failed to track completion time:', err);
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

  {/* Scheduled Document Banner */}
{isScheduled && scheduledDate && (
  <div className="max-w-7xl mx-auto px-4 py-3 mb-4">
    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Clock className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">
            📅 Document Not Yet Available
          </h3>
          <p className="text-sm text-amber-800">
            This document is scheduled to be available on:{' '}
            <strong>
              {new Date(scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </strong>
          </p>
          <p className="text-sm text-amber-700 mt-2">
            Please check back after this date and time to view and sign the document.
          </p>
        </div>
      </div>
    </div>
  </div>
)}

  
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
    <div className="min-h-screen bg-slate-900">
      <Toaster position="top-center" richColors />
<div className="bg-[#1a1a2e] border-b border-white/10 sticky top-0 z-40">
  <div className="flex items-center justify-between px-6 py-3">

    {/* Left: DocMetrics branding */}
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-white text-sm">DocMetrics</span>
           
        </div>
      </div>
    </div>

    {/* Center: Progress */}
    <div className="flex items-center gap-3 flex-shrink-0">
      <span className="text-xs font-medium px-3 py-1.5 rounded-full tabular-nums"
        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
        {Object.keys(signatures).filter(id => myFields.some(f => f.id === id)).length}
        <span className="text-white/30 mx-1">/</span>
        <span className="text-indigo-300">{myFields.length} fields</span>
      </span>
    </div>

    {/* Right: Tools */}
    <div className="flex-1 flex justify-end">
      <div className="flex items-center gap-1">

        {/* Auto-save indicator */}
        {autoSaveStatus === 'saving' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50">
            <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white/70 rounded-full" />
            Saving...
          </div>
        )}
        {autoSaveStatus === 'saved' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400">
            <Check className="h-3 w-3" />
            Saved
          </div>
        )}
        

        {/* Message icon */}
        <div className="relative">
          <button
            onClick={() => setShowMessagePopover(v => !v)}
            className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 group relative"
            style={{ background: showMessagePopover ? 'rgba(99,102,241,0.2)' : 'transparent' }}
          >
            <Mail className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Message Sender
            </span>
          </button>

          {showMessagePopover && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMessagePopover(false)} />
              <div className="absolute right-0 top-12 z-50 w-80 rounded-xl shadow-2xl overflow-hidden"
                style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
    {documentOwnerEmail ? documentOwnerEmail[0].toUpperCase() : '?'}
  </div>
  <div>
<p className="text-sm font-semibold text-white break-all">
      {documentOwnerEmail}
    </p>
    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Document sender</p>
  </div>
</div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-white mb-3">Send a message</p>
                  {messageSentToSender ? (
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                      <p className="text-sm font-semibold text-white">Message sent!</p>
                      <button onClick={() => { setMessageSentToSender(false); setMessageToSender(''); }}
                        className="mt-1 text-xs underline" style={{ color: 'rgba(165,180,252,0.7)' }}>
                        Send another
                      </button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={messageToSender}
                        onChange={(e) => setMessageToSender(e.target.value)}
                        placeholder="Type your message to the document owner..."
                        className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none text-white"
                        rows={3}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          From: <span style={{ color: '#a5b4fc' }}>{recipient.email}</span>
                        </p>
                        <button
                          disabled={!messageToSender.trim() || isSendingMessage}
                         onClick={async () => {
  if (!messageToSender.trim()) return;
  setIsSendingMessage(true);
  try {
    const res = await fetch(`/api/signature/${signatureId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageToSender.trim(),
        senderEmail: recipient.email,
        sessionId: `sign-${signatureId}`,
      }),
    });
    if (res.ok) {
      setMessageSentToSender(true);
      toast.success('Message sent successfully!');
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed to send message');
    }
  } catch (err) {
    console.error('Failed to send message:', err);
    toast.error('Network error — please try again');
  } finally {
    setIsSendingMessage(false);
  }
}}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                          {isSendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help icon */}
        <div className="relative">
          <button
            onClick={() => setShowHelpPopover(v => !v)}
            className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 group relative"
            style={{ background: showHelpPopover ? 'rgba(99,102,241,0.2)' : 'transparent' }}
          >
            <AlertCircle className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Help
            </span>
          </button>

          {showHelpPopover && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowHelpPopover(false)} />
              <div className="absolute right-0 top-12 z-50 w-72 rounded-xl shadow-2xl p-5"
                style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">DocMetrics</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Secure E-Signature</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Your signature is encrypted, timestamped, and legally binding. All activity is logged for audit purposes.
                </p>
                <div className="space-y-2">
                  {[
                    { icon: '🔒', text: 'End-to-end encrypted' },
                    { icon: '⚖️', text: 'Legally binding signature' },
                    { icon: '📋', text: 'Full audit trail maintained' },
                  ].map(b => (
                    <div key={b.text} className="flex items-center gap-2">
                      <span>{b.icon}</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{b.text}</span>
                    </div>
                  ))}
                </div>

                <span
  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
  onClick={() => { setShowHelpPopover(false); window.open('/about', '_blank'); }}
>
  Learn more about DocMetrics →
</span>
              </div>
            </>
          )}
        </div>

        {/* Awaiting turn badge */}
        {isAwaitingTurn && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
            <Clock className="h-3.5 w-3.5" />
            Awaiting turn
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Progress bar */}
  <div className="h-0.5 w-full bg-white/5">
    <div className="h-full transition-all duration-300"
      style={{
        width: `${myFields.length > 0 ? (Object.keys(signatures).filter(id => myFields.some(f => f.id === id)).length / myFields.length) * 100 : 0}%`,
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
      }} />
  </div>
</div>

{/* View-Only Mode Banner */}
{viewOnlyMode && (reassignmentInfo || delegationInfo) && (
  <div className="px-4 py-3">
    <div className="max-w-7xl mx-auto">
      <div className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {delegationInfo ? (
              <>
                <h3 className="font-semibold text-blue-200 mb-1">
                  👁️ View-Only — You Delegated This Document
                </h3>
                <p className="text-sm text-blue-300">
                  You delegated signing authority to{' '}
                  <strong>{delegationInfo.delegatedTo?.name}</strong> ({delegationInfo.delegatedTo?.email}).
                  {delegationInfo.delegatedTo?.reason && (
                    <span className="block mt-1"><strong>Reason:</strong> {delegationInfo.delegatedTo.reason}</span>
                  )}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-blue-200 mb-1">👁️ View-Only Mode</h3>
                <p className="text-sm text-blue-300">
                  This document was reassigned to{' '}
                  <strong>{reassignmentInfo.currentRecipient?.name}</strong> ({reassignmentInfo.currentRecipient?.email}).
                  You can view but cannot sign.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* Awaiting Turn Banner */}
{isAwaitingTurn && (
  <div className="px-4 py-3">
    <div className="max-w-7xl mx-auto">
      <div className="bg-amber-950/50 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Waiting for Previous Signer</p>
            <p className="text-xs text-amber-400 mt-0.5">
              You can review the document, but signing is disabled until the previous signer completes.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* Sidebar - LEFT, fixed, does not scroll */}
       <div className="w-96 flex-shrink-0 overflow-y-auto border-r border-white/10 p-4 bg-slate-900">
          <div className="rounded-xl shadow-2xl p-6"
            style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>

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

            <h3 className="font-semibold text-white mb-4">Signature Progress</h3>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-white/60 mb-2">
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
              {allFields.map(field => {
                const isMyField = field.recipientIndex === recipient?.index;
                const isFilled = field.type === 'attachment'
                  ? (attachments[field.id]?.length > 0)
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
                          field.type === 'attachment' ? `📎 ${field.attachmentLabel || 'Attachment'}` :
                          field.type === 'dropdown' ? `📋 ${field.label || 'Dropdown'}` :
                          field.type === 'radio' ? `⭕ ${field.label || 'Radio Button'}` :
                          'Field'}
                        {!isMyField && ' (Other signer)'}
                      </span>
                      {signatures[field.id] && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-1">Page {field.page}</p>
                    {field.type === 'attachment' && field.isRequired && !isFilled && (
                      <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {!isAwaitingTurn && !completed && !isDelegatedMode && (
              <button
                onClick={() => setShowDelegateModal(true)}
                disabled={submitting}
                className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                <UserPlus className="h-5 w-5" />
                Delegate to Someone Else
              </button>
            )}

            {intentVideoRequired && (
              <div className={`mb-3 p-3 rounded-lg border ${
                intentVideoBlob ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Camera className={`h-5 w-5 ${intentVideoBlob ? 'text-green-600' : 'text-yellow-600'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${intentVideoBlob ? 'text-green-900' : 'text-yellow-900'}`}>
                      {intentVideoBlob ? '✅ Video Recorded' : '📹 Video Recording Required'}
                    </p>
                    <p className={`text-xs ${intentVideoBlob ? 'text-green-700' : 'text-yellow-700'}`}>
                      {intentVideoBlob ? 'Your acknowledgement has been captured' : 'Click "Complete Signing" to record your video'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!allFieldsFilled && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Missing Required Fields:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {myFields
                    .filter(f => !signatures[f.id])
                    .map(f => (
                      <li key={f.id}>
                        • Page {f.page}: {f.type} field
                        <button
                          onClick={() => scrollToField(f.id)}
                          className="ml-2 text-blue-600 underline"
                        >
                          Go there
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {!viewOnlyMode && !isDelegatedMode && !isAwaitingTurn && (
              <div className="mb-3 p-3 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {'I agree to use electronic records and signatures and to DocMetrics\' '}
                    <span
                      className="underline font-medium cursor-pointer"
                      style={{ color: '#a5b4fc' }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open('/terms', '_blank'); }}
                    >
                      Terms and Conditions
                    </span>
                    {'. By signing, I confirm that I have reviewed and agree to the contents of this document.'}
                  </p>
                </label>
              </div>
            )}

            <button
              onClick={completeSignature}
              disabled={!allFieldsFilled || submitting || isAwaitingTurn || viewOnlyMode || isDelegatedMode || !agreedToTerms}
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                allFieldsFilled && !submitting && !isAwaitingTurn && !viewOnlyMode && !isDelegatedMode && agreedToTerms && !(intentVideoRequired && !intentVideoBlob)
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {viewOnlyMode || isDelegatedMode ? (
                <><Eye className="h-5 w-5" />{isDelegatedMode ? 'You Delegated This' : 'View-Only Access'}</>
              ) : submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Submitting...</>
              ) : isAwaitingTurn ? (
                <><Clock className="h-5 w-5" />Waiting for Your Turn</>
              ) : selfieRequired && !selfieVerified ? (
                <><Camera className="h-5 w-5" />Verify Identity & Sign</>
              ) : intentVideoRequired && !intentVideoBlob ? (
                <><Camera className="h-5 w-5" />Record Video & Sign</>
              ) : allFieldsFilled ? (
                <><Check className="h-5 w-5" />Complete Signing</>
              ) : (
                'Complete All Fields'
              )}
            </button>

            {!isAwaitingTurn && !isDelegatedMode && (
              <button
                onClick={() => setShowDeclineModal(true)}
                disabled={submitting}
                className="w-full mt-3 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* PDF Column - scrolls independently, NO scrollbar visible */}
        <div
          className="flex-1 overflow-y-auto"
        id="pdf-scroll-container"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' as any }}
        >
          <style>{`
            #pdf-scroll-container::-webkit-scrollbar { display: none; }
            #pdf-scroll-container embed::-webkit-scrollbar { display: none; }
            embed { scrollbar-width: none; }
          `}</style>
          <div className="p-4">
            <div className="rounded-lg shadow-2xl overflow-hidden bg-slate-800">
              <div id="pdf-signing-container" className="relative" style={{ minHeight: `${297 * document.numPages}mm` }}>
                {pdfUrl ? (
                  <>
                    <embed
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      type="application/pdf"
                      className="w-full"
                      style={{
                        border: 'none',
                        pointerEvents: 'none',
                        height: `${297 * document.numPages}mm`,
                        display: 'block',
                      }}
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      {signatureFields
                        .filter((field) => {
                          const isMyField = field.recipientIndex === recipient?.index;
                          const isVisible = isFieldVisible(field);
                          return isMyField || isVisible;
                        })
                        .map((field) => {
                          const isFilled = field.type === 'attachment'
                            ? (attachments[field.id]?.length > 0)
                            : signatures[field.id];
                          const isMyField = field.recipientIndex === recipient?.index;
                          const isVisible = isFieldVisible(field);
                          const pageHeight = 297 * 3.78;
                          const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);

                          return (
                            <div
                              key={field.id}
                              data-field-id={field.id}
                              className={`absolute rounded transition-all ${
                                isFilled ? "bg-transparent border-0"
                                  : !isVisible ? "hidden"
                                  : "bg-yellow-50/80 border-2 border-yellow-400 animate-pulse hover:bg-yellow-100/80"
                              }`}
                              style={{
                                left: `${field.x}%`,
                                top: `${topPosition}px`,
                                width: field.width ? `${field.width}px` :
                                  field.type === "signature" ? "150px" :
                                  field.type === "checkbox" ? "24px" :
                                  field.type === "attachment" ? "150px" :
                                  field.type === "dropdown" ? "180px" :
                                  field.type === "radio" ? "150px" : "120px",
                                height: field.height ? `${field.height}px` :
                                  field.type === "signature" ? "45px" :
                                  field.type === "checkbox" ? "24px" :
                                  field.type === "attachment" ? "40px" :
                                  field.type === "dropdown" ? "35px" :
                                  field.type === "radio" ? "auto" : "32px",
                                transform: "translate(-50%, 0%)",
                                cursor: (field.type === "signature" || field.type === "attachment") && !isFilled ? "pointer" : "default",
                                pointerEvents: !isVisible ? "none" : field.type === "checkbox" ? "auto" : isFilled ? "none" : "auto",
                                zIndex: 10,
                              }}
                              onClick={() => {
                                if (!isFilled && isMyField && isVisible) {
                                  if (field.type === "signature") setActiveField(field);
                                  else if (field.type === "text") { setActiveTextField(field); setTextFieldInput(""); }
                                  else if (field.type === "checkbox") handleCheckboxToggle(field.id);
                                  else if (field.type === "attachment") { setActiveAttachmentField(field); setShowAttachmentModal(true); }
                                  else if (field.type === "dropdown") { setActiveDropdownField(field); setShowDropdownModal(true); }
                                  else if (field.type === "radio") { setActiveRadioField(field); setShowRadioModal(true); }
                                }
                              }}
                            >
                              <div className="h-full flex flex-col items-center justify-center p-2">
                                {isFilled ? (
                                  <>
                                    {field.type === "signature" && (
                                      <img src={signatures[field.id].data} alt="Signature" className="max-h-full max-w-full object-contain" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }} />
                                    )}
                                    {field.type === "date" && (
                                      <div className="text-center w-full">
                                        <p className="text-sm font-medium text-slate-900 leading-tight">{signatures[field.id].data}</p>
                                      </div>
                                    )}
                                    {field.type === "text" && (
                                      <p className="text-sm font-medium text-slate-900 text-center px-2 leading-tight">{signatures[field.id].data}</p>
                                    )}
                                    {field.type === "checkbox" && (
                                      <div className="flex items-center gap-2 w-full h-full px-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleCheckboxToggle(field.id); }}>
                                        {fieldValues[field.id] ? <CheckSquare className="h-5 w-5 text-purple-600 flex-shrink-0" /> : <Square className="h-5 w-5 text-slate-400 flex-shrink-0" />}
                                        {field.label && <p className="text-xs font-medium text-slate-900 mt-1 text-center whitespace-nowrap text-ellipsis">{field.label}</p>}
                                      </div>
                                    )}
                                    {field.type === "attachment" && attachments[field.id] && (
                                      <div className="text-center w-full">
                                        <Paperclip className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                        <p className="text-xs font-medium text-green-800">{attachments[field.id].length} file(s) uploaded</p>
                                        <button onClick={(e) => { e.stopPropagation(); setActiveAttachmentField(field); setShowAttachmentModal(true); }} className="text-xs text-blue-600 hover:underline mt-1">View Files</button>
                                      </div>
                                    )}
                                    {field.type === "dropdown" && (
                                      <div className="w-full h-full flex items-center justify-center px-2">
                                        <p className="text-sm font-medium text-slate-900 text-center truncate">{fieldValues[field.id] || signatures[field.id]?.data || ""}</p>
                                      </div>
                                    )}
                                    {field.type === "radio" && (
                                      <div className="w-full px-2 space-y-1">
                                        {field.label && <p className="text-xs font-semibold text-slate-700 mb-2">{field.label}</p>}
                                        {field.options?.map((option, idx) => (
                                          <label key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-1 rounded">
                                            <input type="radio" name={`radio-${field.id}`} value={option} checked={fieldValues[field.id] === option}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                setFieldValues(prev => ({ ...prev, [field.id]: value }));
                                                setSignatures(prev => ({ ...prev, [field.id]: { type: "radio", data: value, timestamp: new Date().toISOString() } }));
                                              }}
                                              disabled={!isMyField} className="h-4 w-4 text-purple-600 focus:ring-purple-500" />
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
                                        <p className="text-xs font-medium text-yellow-700">📎 {field.attachmentLabel || "Upload Required"}</p>
                                        {field.isRequired && <p className="text-xs text-red-600 font-semibold mt-1">* Required</p>}
                                        <p className="text-xs text-slate-600 mt-1">Click to upload</p>
                                      </>
                                    ) : field.type === "checkbox" ? (
                                      <div className="flex items-center gap-2 w-full h-full px-2">
                                        <Square className="h-5 w-5 text-yellow-700 flex-shrink-0" />
                                        {field.label && <p className="text-xs text-yellow-700 font-medium truncate">{field.label}</p>}
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-xs font-medium text-yellow-700">
                                          {field.type === "signature" ? (isMyField ? "✍️ Click to Sign" : "⏳ Awaiting Signature")
                                            : field.type === "date" ? (isMyField ? "📅 Auto-filled" : "📅 Date pending")
                                            : field.type === "dropdown" ? (isMyField ? "📋 Select Option" : "⏳ Awaiting Selection")
                                            : field.type === "radio" ? (isMyField ? "⭕ Choose Option" : "⏳ Awaiting Choice")
                                            : isMyField ? "📝 Click to Fill" : "⏳ Awaiting Input"}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1 font-semibold">
                                          {isMyField ? recipient.name : (field as any).recipientName || `Recipient ${field.recipientIndex + 1}`}
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
     {/* Decline to Sign Drawer */}
{showDeclineModal && (
  <>
    {/* Backdrop - Click to close */}
    <div 
      className="fixed inset-0 bg-black/50 z-50 transition-opacity"
      onClick={() => {
        setShowDeclineModal(false);
        setDeclineReason('');
      }}
    />
    
    {/* Drawer */}
    <div className="fixed inset-y-0 right-0 w-full sm:w-[550px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <X className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Decline to Sign</h2>
              <p className="text-sm text-red-100 mt-1">
                Please provide a reason for declining
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowDeclineModal(false);
              setDeclineReason('');
            }}
            className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="h-[calc(100vh-120px)] overflow-y-auto p-6">
        <div className="space-y-4">
          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for declining <span className="text-red-500">*</span>
            </label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please explain why you're declining to sign this document..."
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:outline-none resize-none"
              rows={5}
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum 10 characters • {declineReason.length}/500
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              <strong>⚠️ Warning:</strong> Declining this document will:
            </p>
            <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
              <li>Cancel the entire signing process</li>
              <li>Notify all parties involved</li>
              <li>Prevent further signatures</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          {/* Document Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Document Details:</p>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Document:</strong> {document?.filename}</p>
              <p><strong>Your Name:</strong> {recipient?.name}</p>
              <p><strong>Your Email:</strong> {recipient?.email}</p>
            </div>
          </div>

          {/* Actions - Sticky at bottom */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 flex gap-3">
            <button
              onClick={() => {
                setShowDeclineModal(false);
                setDeclineReason('');
              }}
              disabled={decliningDocument}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDecline}
              disabled={declineReason.trim().length < 10 || decliningDocument}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
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
  </>
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

{/* Delegate Signing Drawer */}
{showDelegateModal && recipient && (
  <>
    {/* Backdrop - Click to close */}
    <div 
      className="fixed inset-0 bg-black/50 z-50 transition-opacity"
      onClick={() => setShowDelegateModal(false)}
    />
    
    {/* Drawer */}
    <div className="fixed inset-y-0 right-0 w-full sm:w-[650px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Delegate Signing Authority</h2>
              <p className="text-sm text-purple-100 mt-1">
                Transfer signing responsibility to someone else
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDelegateModal(false)}
            className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="h-[calc(100vh-120px)] overflow-y-auto p-6">
        <DelegateSigningModal
          isOpen={true}
          onClose={() => setShowDelegateModal(false)}
          signatureId={signatureId!}
          currentRecipient={{
            name: recipient.name,
            email: recipient.email,
          }}
          onDelegated={() => {
            setShowDelegateModal(false);
            alert('✅ Signing authority delegated successfully! The delegate will receive an email.');
            router.push('/');
          }}
          renderAsDrawer={true}
        />
      </div>
    </div>
  </>
)}

{/* Intent & Acknowledgement Video Modal */}
{showIntentVideoModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              Record Intent & Acknowledgement
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Record a short video confirming your intent to sign this document
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!intentVideoBlob ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                📹 What to say in your video (30 seconds max):
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• State your full name: <strong>{recipient?.name}</strong></li>
                <li>• Confirm you are signing: <strong>"{document?.filename}"</strong></li>
                <li>• State today's date: <strong>{new Date().toLocaleDateString()}</strong></li>
                <li>• Say: <em>"I acknowledge and agree to sign this document"</em></li>
              </ul>
            </div>

            <video
              id="intent-video-preview"
              className="w-full rounded-lg bg-slate-900 aspect-video"
              autoPlay
              muted
              playsInline
            />

            <div className="flex gap-3">
              {!recordingIntentVideo ? (
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user', width: 1280, height: 720 },
                        audio: true,
                      });
                      
                      const video = globalThis.document.getElementById('intent-video-preview') as HTMLVideoElement;
                      if (video) {
                        video.srcObject = stream;
                        video.muted = true;
                      }

                      // Try multiple codecs for compatibility
                      let mimeType = 'video/webm;codecs=vp8,opus';
                      if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = 'video/webm;codecs=vp9,opus';
                      }
                      if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = 'video/webm';
                      }

                      const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: mimeType,
                        videoBitsPerSecond: 2500000,
                      });
                      
                      const chunks: Blob[] = [];

                      mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                          chunks.push(e.data);
                        }
                      };

                      mediaRecorder.onstop = async () => {
                        if (chunks.length === 0) {
                          alert('No video data recorded. Please try again.');
                          stream.getTracks().forEach((track) => track.stop());
                          return;
                        }

                        const blob = new Blob(chunks, { type: mimeType });
                        
                        // Stop camera
                        stream.getTracks().forEach((track) => track.stop());

                        // Upload video
                        try {
                          const formData = new FormData();
                          formData.append('video', blob, 'intent-video.webm');

                          const res = await fetch(`/api/signature/${signatureId}/record-intent-video`, {
                            method: 'POST',
                            body: formData,
                          });
                          
                          const data = await res.json();
                          if (data.success) {
                            console.log('✅ Intent video uploaded:', data.videoUrl);
                            setIntentVideoBlob(data.videoUrl); // Store Cloudinary URL
                          } else {
                            alert('Failed to save video. Please try again.');
                          }
                        } catch (err) {
                          console.error('❌ Upload error:', err);
                          alert('Failed to save video. Please try again.');
                        }
                      };

                      mediaRecorder.start(1000);
                      setMediaRecorderRef(mediaRecorder);
                      setRecordingIntentVideo(true);

                      // Auto-stop after 30 seconds
                      setTimeout(() => {
                        if (mediaRecorder.state === 'recording') {
                          mediaRecorder.stop();
                          setRecordingIntentVideo(false);
                        }
                      }, 30000);

                    } catch (err) {
                      console.error('❌ Camera access error:', err);
                      alert('Failed to access camera. Please check permissions and try again.');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (mediaRecorderRef && mediaRecorderRef.state === 'recording') {
                      mediaRecorderRef.stop();
                      setRecordingIntentVideo(false);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                >
                  <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
                  Stop Recording
                </button>
              )}
            </div>

            {recordingIntentVideo && (
              <p className="text-xs text-center text-slate-600 animate-pulse">
                🔴 Recording in progress... Speak clearly into your camera
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 font-medium flex items-center gap-2">
                <Check className="h-4 w-4" />
                Video recorded successfully!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Your intent and acknowledgement video has been saved.
              </p>
            </div>

            {/* ⭐ REMOVED: Video preview - just show confirmation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <Camera className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-900 font-medium">
                Recording Complete
              </p>
              <p className="text-xs text-blue-700 mt-1">
                You can now continue to sign the document.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIntentVideoBlob(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
              >
                Re-record
              </button>
              <button
                onClick={async () => {
                  if (!intentVideoBlob) {
                    alert('Please record your intent video first');
                    return;
                  }
                  setShowIntentVideoModal(false);
                  await submitSignature();
                }}
                disabled={!intentVideoBlob}
                className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  intentVideoBlob
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="h-5 w-5" />
                Continue to Sign
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default DocSendSigningPage;