"use client";

import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, Edit, FileSignature, Monitor, Paperclip, Settings, X } from "lucide-react";
import type { DocumentType, SignatureField, SignatureRequest, Recipient } from "./types";
import EditDrawer from "./EditDrawer";

// ─── Props ────────────────────────────────────────────────────────────────────

interface StepTwoProps {
  doc: DocumentType;
  mode: string | null;
  pdfUrl: string | null;
  signatureRequest: SignatureRequest;
  setSignatureRequest: React.Dispatch<React.SetStateAction<SignatureRequest>>;
  historyIndex: number;
  fieldHistory: SignatureField[][];
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  editingFieldLogic: SignatureField | null;
  setEditingFieldLogic: (f: SignatureField | null) => void;
  editingLabelField: SignatureField | null;
  setEditingLabelField: (f: SignatureField | null) => void;
  showEditDrawer: boolean;
  setShowEditDrawer: (v: boolean) => void;
}

// ─── Field config ─────────────────────────────────────────────────────────────

const FIELD_TYPES: { type: SignatureField["type"]; label: string; icon: React.ReactNode }[] = [
  { type: "signature",  label: "Signature",  icon: <FileSignature className="h-4 w-4" /> },
  { type: "date",       label: "Date",       icon: <Clock className="h-4 w-4" /> },
  { type: "text",       label: "Text",       icon: <Edit className="h-4 w-4" /> },
  { type: "checkbox",   label: "Checkbox",   icon: <CheckSquare className="h-4 w-4" /> },
  { type: "attachment", label: "Attachment", icon: <Paperclip className="h-4 w-4" /> },
  {
    type: "dropdown", label: "Dropdown",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  },
  {
    type: "radio", label: "Radio",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>,
  },
];

function getFieldDimensions(type: string) {
  switch (type) {
    case "signature":   return { width: "140px", height: "50px" };
    case "dropdown":    return { width: "180px", height: "36px" };
    case "radio":       return { width: "160px", height: "auto" };
    case "text":        return { width: "120px", height: "36px" };
    case "attachment":  return { width: "150px", height: "36px" };
    default:            return { width: "120px", height: "32px" };
  }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function FieldSidebar({
  mode, signatureRequest, setSignatureRequest,
  historyIndex, fieldHistory, setHistoryIndex, setShowEditDrawer,
}: Pick<StepTwoProps, "mode" | "signatureRequest" | "setSignatureRequest" | "historyIndex" | "fieldHistory" | "setHistoryIndex" | "setShowEditDrawer">) {

  const handleUndo = () => {
    if (historyIndex > 0) {
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setSignatureRequest((prev) => ({ ...prev, signatureFields: fieldHistory[next] }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < fieldHistory.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setSignatureRequest((prev) => ({ ...prev, signatureFields: fieldHistory[next] }));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-5 h-full overflow-y-auto">
      <h3 className="font-semibold text-slate-900 text-base">Fields</h3>

      {/* Undo / Redo */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40" disabled={historyIndex <= 0} onClick={handleUndo} title="Undo (Ctrl+Z)">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          Undo
        </Button>
        <Button variant="outline" size="sm" className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40" disabled={historyIndex >= fieldHistory.length - 1} onClick={handleRedo} title="Redo (Ctrl+Y)">
          Redo
          <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
        </Button>
      </div>

      {/* Recipients */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recipients</span>
          <Button variant="ghost" size="sm" onClick={() => setShowEditDrawer(true)} className="text-xs text-purple-600 hover:bg-purple-50 rounded-lg h-7 px-2">
            <Edit className="h-3 w-3 mr-1" />Edit
          </Button>
        </div>
        {signatureRequest.recipients.map((recipient, index) => {
          const fieldCount = signatureRequest.signatureFields.filter((f) => f.recipientIndex === index).length;
          return (
            <div key={index} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="h-7 w-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: recipient.color }}>
                <span className="text-white text-xs font-bold">{recipient.name?.charAt(0) || index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{recipient.name || `Recipient ${index + 1}`}</p>
                <p className="text-xs text-slate-400 truncate">{recipient.email || "No email"}</p>
              </div>
              {fieldCount > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">{fieldCount}</span>
              )}
            </div>
          );
        })}
        {mode === "edit" && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">💡 <strong>Tip:</strong> Create roles like "Client", "Manager". Assign real people when using this template later!</p>
          </div>
        )}
      </div>

      {/* Draggable field types */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Drag to Place</span>
        {FIELD_TYPES.map(({ type, label, icon }) => (
          <div key={type} draggable onDragStart={(e) => e.dataTransfer.setData("fieldType", type)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 cursor-grab active:cursor-grabbing transition-all select-none">
            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">{icon}</div>
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <svg className="h-3.5 w-3.5 text-slate-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs text-slate-500">💡 Drag any field type onto the document to place it.</p>
      </div>
    </div>
  );
}

// ─── Field Overlay ────────────────────────────────────────────────────────────

function FieldOverlay({
  field, recipients, signatureRequest, setSignatureRequest, setEditingFieldLogic, setEditingLabelField,
}: {
  field: SignatureField;
  recipients: Recipient[];
  signatureRequest: SignatureRequest;
  setSignatureRequest: React.Dispatch<React.SetStateAction<SignatureRequest>>;
  setEditingFieldLogic: (f: SignatureField | null) => void;
  setEditingLabelField: (f: SignatureField | null) => void;
}) {
  const PAGE_HEIGHT = 297 * 3.78;
  const topPosition = (field.page - 1) * PAGE_HEIGHT + (field.y / 100) * PAGE_HEIGHT;
  const recipient = recipients[field.recipientIndex];
  const dims = getFieldDimensions(field.type);

  const updateFields = (updated: SignatureField[]) => {
    setSignatureRequest((prev) => ({ ...prev, signatureFields: updated }));
  };

  const removeField = () => {
    updateFields(signatureRequest.signatureFields.filter((f) => f.id !== field.id));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const container = document.getElementById("pdf-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pageNumber = Math.floor(y / PAGE_HEIGHT) + 1;
    const yPercent = ((y % PAGE_HEIGHT) / PAGE_HEIGHT) * 100;
    const newX = ((e.clientX - rect.left) / rect.width) * 100;
    updateFields(signatureRequest.signatureFields.map((f) =>
      f.id === field.id ? { ...f, x: newX, y: yPercent, page: pageNumber } : f
    ));
  };

  const hasSettings = ["attachment", "dropdown", "radio", "checkbox", "text"].includes(field.type);
  const hasLabelEdit = field.type === "text" || field.type === "checkbox";

  return (
    <div
      className="absolute border-2 rounded cursor-move bg-white/95 shadow-xl group hover:shadow-2xl transition-all hover:z-50"
      style={{ left: `${field.x}%`, top: `${topPosition}px`, borderColor: recipient?.color || "#9333ea", width: dims.width, height: dims.height, transform: "translate(-50%, 0%)" }}
      draggable onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col items-center justify-center px-2 relative">

        {/* Recipient selector */}
        <select
          value={field.recipientIndex}
          onChange={(e) => updateFields(signatureRequest.signatureFields.map((f) => f.id === field.id ? { ...f, recipientIndex: parseInt(e.target.value) } : f))}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1 left-1 right-1 text-xs border rounded px-1 py-0.5 bg-white/90 backdrop-blur-sm cursor-pointer z-10"
          style={{ fontSize: "10px" }}
        >
          {recipients.map((r, idx) => <option key={idx} value={idx}>{r.name || `Recipient ${idx + 1}`}</option>)}
        </select>

        {/* Hover label editors */}
        {field.type === "attachment" && (
          <input type="text" value={field.attachmentLabel || ""} onChange={(e) => { e.stopPropagation(); updateFields(signatureRequest.signatureFields.map((f) => f.id === field.id ? { ...f, attachmentLabel: e.target.value } : f)); }} onClick={(e) => e.stopPropagation()} placeholder="e.g., Upload ID..." className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 text-xs border rounded px-2 py-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity w-40 text-center z-20" />
        )}
        {(field.type === "checkbox" || field.type === "text") && (
          <input type="text" value={field.label || ""} onChange={(e) => { e.stopPropagation(); updateFields(signatureRequest.signatureFields.map((f) => f.id === field.id ? { ...f, label: e.target.value } : f)); }} onClick={(e) => e.stopPropagation()} placeholder={field.type === "checkbox" ? "Checkbox label..." : "Field label..."} className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 text-xs border rounded px-2 py-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity w-40 text-center z-20" />
        )}

        {/* Field body */}
        <div className="text-center mt-4">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            {field.type === "signature"   && <FileSignature className="h-4 w-4" />}
            {field.type === "date"        && <Clock className="h-4 w-4" />}
            {field.type === "text"        && <Edit className="h-4 w-4" />}
            {field.type === "checkbox"    && <CheckSquare className="h-4 w-4" />}
            {field.type === "attachment"  && <Paperclip className="h-4 w-4" />}
            {field.type === "dropdown"    && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
            {field.type === "radio"       && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>}

            {field.type !== "checkbox" && field.type !== "attachment" && (
              <span className="text-xs font-semibold">
                {field.type === "signature" ? "Sign Here"
                  : field.type === "date"     ? "Date"
                  : field.type === "text"     ? "Text"
                  : field.type === "dropdown" ? (field.label || "Dropdown")
                  : field.type === "radio"    ? (field.label || "Radio")
                  : "Text"}
              </span>
            )}
            {field.type === "attachment" && <span className="text-xs font-semibold truncate">{field.attachmentLabel || "Upload File"}</span>}
          </div>
          {field.type !== "checkbox" && field.type !== "attachment" && (
            <p className="text-xs text-slate-600 truncate px-2">{recipient?.name || `Recipient ${field.recipientIndex + 1}`}</p>
          )}
        </div>

        {/* Settings button */}
        {hasSettings && (
          <Button variant="ghost" size="icon" className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg z-10" onClick={(e) => { e.stopPropagation(); setEditingFieldLogic(field); }}>
            <Settings className="h-4 w-4" />
          </Button>
        )}

        {/* Edit label button */}
        {hasLabelEdit && (
          <Button variant="ghost" size="icon" className="absolute -top-3 -right-10 h-7 w-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg z-10" onClick={(e) => { e.stopPropagation(); setEditingLabelField(field); }}>
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* Delete button */}
        <Button variant="ghost" size="icon" className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10" onClick={(e) => { e.stopPropagation(); removeField(); }}>
          <X className="h-4 w-4" />
        </Button>

        {/* Conditional badge */}
        {field.conditional?.enabled && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow">Conditional</div>
        )}
      </div>
    </div>
  );
}

// ─── PDF Canvas ───────────────────────────────────────────────────────────────

function PDFCanvas({
  doc, pdfUrl, signatureRequest, setSignatureRequest, setEditingFieldLogic, setEditingLabelField,
}: Pick<StepTwoProps, "doc" | "pdfUrl" | "signatureRequest" | "setSignatureRequest" | "setEditingFieldLogic" | "setEditingLabelField">) {
  const PAGE_HEIGHT = 297 * 3.78;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType") as SignatureField["type"];
    const container = document.getElementById("pdf-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pageNumber = Math.floor(y / PAGE_HEIGHT) + 1;
    const yPercent = ((y % PAGE_HEIGHT) / PAGE_HEIGHT) * 100;
    const x = ((e.clientX - rect.left) / rect.width) * 100;

    const newField: SignatureField = {
      id: Date.now(), type: fieldType, x, y: yPercent, page: pageNumber, recipientIndex: 0,
      label: fieldType === "checkbox" ? "Check this box" : fieldType === "dropdown" ? "Select an option" : fieldType === "radio" ? "Choose one option" : "",
      defaultChecked: false,
      attachmentLabel: fieldType === "attachment" ? "Upload Required Document" : undefined,
      attachmentType:  fieldType === "attachment" ? "supporting_document" : undefined,
      isRequired:      fieldType === "attachment" ? true : false,
      options: (fieldType === "dropdown" || fieldType === "radio") ? ["Option 1", "Option 2", "Option 3"] : undefined,
    };

    setSignatureRequest((prev) => ({ ...prev, signatureFields: [...prev.signatureFields, newField] }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-y-auto h-full">
      <div
        id="pdf-container"
        className="relative bg-slate-100 rounded-lg mx-auto"
        style={{ width: "210mm", minHeight: `${297 * (doc.numPages || 1)}mm`, maxWidth: "100%" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {pdfUrl ? (
          <>
            <embed src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full" style={{ border: "none", pointerEvents: "none", height: `${297 * (doc.numPages || 1)}mm`, display: "block" }} />
            {signatureRequest.signatureFields.map((field) => (
              <FieldOverlay key={field.id} field={field} recipients={signatureRequest.recipients} signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} setEditingFieldLogic={setEditingFieldLogic} setEditingLabelField={setEditingLabelField} />
            ))}
          </>
        ) : (
          <div className="flex items-center justify-center" style={{ minHeight: "297mm" }}>
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Loading document...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function StepTwo({
  doc, mode, pdfUrl, signatureRequest, setSignatureRequest,
  historyIndex, fieldHistory, setHistoryIndex,
  editingFieldLogic, setEditingFieldLogic, editingLabelField, setEditingLabelField,
  showEditDrawer, setShowEditDrawer,
}: StepTwoProps) {
  return (
    <>
      {/* ── Mobile: tell user to switch to desktop ── */}
      <div className="flex lg:hidden flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
          <Monitor className="h-10 w-10 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Use a Desktop to Place Fields
        </h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
          Dragging signature fields onto a document requires a larger screen.
          Open this page on a laptop or desktop to continue placing fields.
        </p>
        {/* Still let them edit recipients on mobile */}
        <Button
          onClick={() => setShowEditDrawer(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-11"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Recipients &amp; Settings
        </Button>
        <p className="text-xs text-slate-400 mt-4">
          {signatureRequest.signatureFields.length > 0
            ? `${signatureRequest.signatureFields.length} field(s) already placed`
            : "No fields placed yet"}
        </p>
      </div>

      {/* ── Desktop: full editor ── */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        <div className="lg:col-span-3">
          <FieldSidebar
            mode={mode}
            signatureRequest={signatureRequest}
            setSignatureRequest={setSignatureRequest}
            historyIndex={historyIndex}
            fieldHistory={fieldHistory}
            setHistoryIndex={setHistoryIndex}
            setShowEditDrawer={setShowEditDrawer}
          />
        </div>
        <div className="lg:col-span-9">
          <PDFCanvas
            doc={doc}
            pdfUrl={pdfUrl}
            signatureRequest={signatureRequest}
            setSignatureRequest={setSignatureRequest}
            setEditingFieldLogic={setEditingFieldLogic}
            setEditingLabelField={setEditingLabelField}
          />
        </div>
      </div>

      {/* ── Edit Drawer (works on both mobile and desktop) ── */}
      <EditDrawer
        open={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        mode={mode}
        signatureRequest={signatureRequest}
        setSignatureRequest={setSignatureRequest}
      />
    </>
  );
}