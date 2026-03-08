"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, X, ChevronLeft, ChevronRight, FileSignature, Clock, Edit, Trash2, Users, Mail } from 'lucide-react';
import { toast } from 'sonner';

type Recipient = { name: string; email: string; role?: string; color?: string };
type SignatureField = { id: string | number; type: 'signature' | 'date' | 'text'; x: number; y: number; page: number; recipientIndex: number; width?: number; height?: number };
type SignatureRequestType = { recipientEmail?: string; recipientName?: string; message?: string; dueDate?: string; isTemplate: boolean; step?: number; recipients?: Recipient[]; signatureFields?: SignatureField[] };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: { _id: string; filename: string; numPages: number };
  pdfUrl: string | null;
  isSending: boolean;
  setIsSending: (v: boolean) => void;
  signatureRequest: SignatureRequestType;
  setSignatureRequest: (v: SignatureRequestType) => void;
  onSuccess: (links: any[]) => void;
  fetchDocument: () => void;
};

export default function SignatureDialog({
  open, onOpenChange, doc, pdfUrl, isSending, setIsSending,
  signatureRequest, setSignatureRequest, onSuccess, fetchDocument,
}: Props) {
  const step = signatureRequest.step || 1;

  const handleClose = () => {
    onOpenChange(false);
    setSignatureRequest({ recipientEmail: '', recipientName: '', message: '', dueDate: '', isTemplate: false, step: 1, recipients: [], signatureFields: [] });
  };

  const handleNext = () => {
    if (step === 1) {
      const valid = (signatureRequest.recipients || []).filter(r => r.name && r.email);
      if (valid.length === 0 && !signatureRequest.isTemplate) { alert('Please add at least one recipient with name and email'); return; }
    }
    setSignatureRequest({ ...signatureRequest, step: step + 1 });
  };

  const handleBack = () => setSignatureRequest({ ...signatureRequest, step: step - 1 });

  const handleSend = async () => {
    try {
      if (signatureRequest.isTemplate) {
        if ((signatureRequest.signatureFields || []).length === 0) { alert('Please add at least one signature field'); return; }
        setIsSending(true);
        const res = await fetch(`/api/documents/${doc._id}/template`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatureFields: signatureRequest.signatureFields, recipients: signatureRequest.recipients }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) { alert(data.message || 'Failed to save template'); setIsSending(false); return; }
        alert('✅ Document converted to signable template!');
        handleClose();
        await fetchDocument();
      } else {
        const valid = (signatureRequest.recipients || []).filter(r => r.name && r.email);
        if (valid.length === 0) { alert('Please add at least one recipient with name and email'); return; }
        setIsSending(true);
        const res = await fetch('/api/signature/create', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: doc._id, recipients: signatureRequest.recipients, signatureFields: signatureRequest.signatureFields, message: signatureRequest.message, dueDate: signatureRequest.dueDate }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) { alert(data.message || 'Failed to send signature request'); setIsSending(false); return; }
        onSuccess(data.signatureRequests);
        handleClose();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 bg-white flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {signatureRequest.isTemplate ? 'Convert to Signable Template' : 'Request Signature'}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {signatureRequest.isTemplate ? `Step ${step} of 3: Setup Template` : `Step ${step} of 3: ${step === 1 ? 'Add Recipients' : step === 2 ? 'Place Signature Fields' : 'Review & Send'}`}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}><X className="h-5 w-5" /></Button>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="px-6 py-3 bg-slate-50 border-b">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-purple-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">

          {/* Step 1: Recipients */}
          {step === 1 && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Who needs to sign?</h3>
                  <p className="text-sm text-slate-600">Add recipients and set signing order</p>
                </div>
                <div className="space-y-3">
                  {(signatureRequest.recipients || []).map((recipient, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white hover:border-purple-300 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-semibold">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Full Name</Label>
                              <Input value={recipient.name} onChange={(e) => { const u = [...(signatureRequest.recipients || [])]; u[index].name = e.target.value; setSignatureRequest({ ...signatureRequest, recipients: u }); }} placeholder="John Doe" className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Email Address</Label>
                              <Input type="email" value={recipient.email} onChange={(e) => { const u = [...(signatureRequest.recipients || [])]; u[index].email = e.target.value; setSignatureRequest({ ...signatureRequest, recipients: u }); }} placeholder="john@company.com" className="mt-1" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-700">Role (optional)</Label>
                            <Input value={recipient.role || ''} onChange={(e) => { const u = [...(signatureRequest.recipients || [])]; u[index].role = e.target.value; setSignatureRequest({ ...signatureRequest, recipients: u }); }} placeholder="e.g., Client, Manager, Legal" className="mt-1" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { const u = (signatureRequest.recipients || []).filter((_, i) => i !== index); setSignatureRequest({ ...signatureRequest, recipients: u }); }} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => { const u = [...(signatureRequest.recipients || []), { name: '', email: '', role: '', color: `hsl(${Math.random() * 360}, 70%, 50%)` }]; setSignatureRequest({ ...signatureRequest, recipients: u }); }} className="w-full border-dashed">
                    <Users className="h-4 w-4 mr-2" />Add Another Recipient
                  </Button>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium">Message to Recipients (optional)</Label>
                    <Textarea value={signatureRequest.message} onChange={(e) => setSignatureRequest({ ...signatureRequest, message: e.target.value })} placeholder="Please review and sign this document..." rows={3} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Due Date (optional)</Label>
                    <Input type="date" value={signatureRequest.dueDate} onChange={(e) => setSignatureRequest({ ...signatureRequest, dueDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Place Fields */}
          {step === 2 && (
            <div className="h-full flex">
              {/* Sidebar */}
              <div className="w-56 border-r bg-slate-50 p-4 overflow-y-auto flex-shrink-0">
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">Signature Fields</h3>
                <div className="space-y-2 mb-4">
                  {(signatureRequest.recipients || []).map((recipient, index) => {
                    const count = (signatureRequest.signatureFields || []).filter(f => f.recipientIndex === index).length;
                    return (
                      <div key={index} className="p-2 bg-white rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: recipient.color }} />
                          <span className="text-xs font-medium text-slate-900 truncate flex-1">{recipient.name || `Recipient ${index + 1}`}</span>
                          {count > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{count}</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{recipient.email}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700 mb-2">Drag to place:</p>
                  {(['signature', 'date', 'text'] as const).map((type) => (
                    <Button key={type} variant="outline" className="w-full justify-start text-xs py-2" draggable onDragStart={(e) => e.dataTransfer.setData('fieldType', type)}>
                      {type === 'signature' ? <FileSignature className="h-3 w-3 mr-2" /> : type === 'date' ? <Clock className="h-3 w-3 mr-2" /> : <Edit className="h-3 w-3 mr-2" />}
                      {type === 'signature' ? 'Signature' : type === 'date' ? 'Date Signed' : 'Text Field'}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-slate-700 mb-2">Quick Actions:</p>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs py-1.5"
                    onClick={() => {
                      const newFields: SignatureField[] = (signatureRequest.recipients || []).map((_, index) => ({ id: Date.now() + index, type: 'signature', x: 25, y: 60 + (index * 15), page: 1, recipientIndex: index }));
                      setSignatureRequest({ ...signatureRequest, signatureFields: [...(signatureRequest.signatureFields || []), ...newFields] });
                    }}>
                    <FileSignature className="h-3 w-3 mr-1" />Auto-place
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 py-1.5"
                    onClick={() => { if (window.confirm('Remove all fields from this page?')) { setSignatureRequest({ ...signatureRequest, signatureFields: (signatureRequest.signatureFields || []).filter(f => f.page !== 1) }); } }}
                    disabled={(signatureRequest.signatureFields || []).filter(f => f.page === 1).length === 0}>
                    <Trash2 className="h-3 w-3 mr-1" />Clear Page
                  </Button>
                </div>
                <div className="mt-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">💡 Drag fields onto the document</p>
                </div>
              </div>

              {/* PDF Area */}
              <div className="flex-1 p-4 overflow-auto bg-slate-100 flex flex-col">
                <div
                  id="pdf-container"
                  className="flex-1 bg-white shadow-2xl rounded-lg overflow-hidden relative mx-auto"
                  style={{ width: '210mm', minHeight: `${297 * doc.numPages}mm`, maxWidth: '100%', position: 'relative' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fieldType = e.dataTransfer.getData('fieldType') as 'signature' | 'date' | 'text';
                    const container = document.getElementById('pdf-container');
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const pageHeight = 297 * 3.78;
                    const pageNumber = Math.floor(y / pageHeight) + 1;
                    const yPercent = ((y % pageHeight) / pageHeight) * 100;
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const newField: SignatureField = { id: Date.now(), type: fieldType, x, y: yPercent, page: pageNumber, recipientIndex: 0 };
                    setSignatureRequest({ ...signatureRequest, signatureFields: [...(signatureRequest.signatureFields || []), newField] });
                  }}
                >
                  {pdfUrl ? (
                    <>
                      <embed src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full" style={{ border: 'none', pointerEvents: 'none', height: `${297 * doc.numPages}mm`, display: 'block' }} />
                      {(signatureRequest.signatureFields || []).map((field) => {
                        const pageHeight = 297 * 3.78;
                        const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);
                        const recipient = (signatureRequest.recipients || [])[field.recipientIndex];
                        return (
                          <div key={field.id}
                            className="absolute border-2 rounded cursor-move bg-white/95 shadow-xl group hover:shadow-2xl transition-all hover:z-50"
                            style={{ left: `${field.x}%`, top: `${topPosition}px`, borderColor: recipient?.color || '#9333ea', width: field.type === 'signature' ? '180px' : '140px', height: field.type === 'signature' ? '70px' : '45px', transform: 'translate(-50%, 0%)' }}
                            draggable
                            onDragEnd={(e) => {
                              const container = document.getElementById('pdf-container');
                              if (!container) return;
                              const rect = container.getBoundingClientRect();
                              const y = e.clientY - rect.top;
                              const pH = 297 * 3.78;
                              const pageNumber = Math.floor(y / pH) + 1;
                              const yPct = ((y % pH) / pH) * 100;
                              const newX = ((e.clientX - rect.left) / rect.width) * 100;
                              setSignatureRequest({ ...signatureRequest, signatureFields: (signatureRequest.signatureFields || []).map(f => f.id === field.id ? { ...f, x: newX, y: yPct, page: pageNumber } : f) });
                            }}
                          >
                            <div className="h-full flex flex-col items-center justify-center px-2 relative">
                              <select value={field.recipientIndex}
                                onChange={(e) => { setSignatureRequest({ ...signatureRequest, signatureFields: (signatureRequest.signatureFields || []).map(f => f.id === field.id ? { ...f, recipientIndex: parseInt(e.target.value) } : f) }); }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-1 left-1 right-1 text-xs border rounded px-1 py-0.5 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                style={{ fontSize: '10px' }}>
                                {(signatureRequest.recipients || []).map((r, idx) => <option key={idx} value={idx}>{r.name || `Recipient ${idx + 1}`}</option>)}
                              </select>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  {field.type === 'signature' ? <FileSignature className="h-4 w-4" /> : field.type === 'date' ? <Clock className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                                  <span className="text-xs font-semibold">{field.type === 'signature' ? 'Sign Here' : field.type === 'date' ? 'Date' : 'Text'}</span>
                                </div>
                                <p className="text-xs text-slate-600 truncate px-2">{recipient?.name || `Recipient ${field.recipientIndex + 1}`}</p>
                              </div>
                              <Button variant="ghost" size="icon"
                                className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                                onClick={(e) => { e.stopPropagation(); setSignatureRequest({ ...signatureRequest, signatureFields: (signatureRequest.signatureFields || []).filter(f => f.id !== field.id) }); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center" style={{ minHeight: '297mm' }}>
                      <div className="text-center">
                        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Loading document...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Review & Send</h3>
                  <p className="text-sm text-slate-600">Double-check everything before sending</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <h4 className="font-medium text-slate-900 mb-3">Document</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center"><FileText className="h-6 w-6 text-red-600" /></div>
                    <div><p className="font-medium text-slate-900">{doc.filename}</p><p className="text-sm text-slate-500">{doc.numPages} pages</p></div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <h4 className="font-medium text-slate-900 mb-3">Recipients ({(signatureRequest.recipients || []).length})</h4>
                  <div className="space-y-2">
                    {(signatureRequest.recipients || []).map((r, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center"><span className="text-purple-600 font-semibold text-sm">{idx + 1}</span></div>
                        <div className="flex-1"><p className="font-medium text-slate-900">{r.name}</p><p className="text-sm text-slate-600">{r.email}</p>{r.role && <p className="text-xs text-slate-500 mt-0.5">{r.role}</p>}</div>
                        <div className="text-right"><p className="text-xs text-slate-500">{(signatureRequest.signatureFields || []).filter(f => f.recipientIndex === idx).length} fields</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <h4 className="font-medium text-slate-900 mb-3">Signature Fields ({(signatureRequest.signatureFields || []).length})</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ type: 'signature', label: 'Signatures', color: 'text-purple-600' }, { type: 'date', label: 'Date Fields', color: 'text-blue-600' }, { type: 'text', label: 'Text Fields', color: 'text-green-600' }].map((s) => (
                      <div key={s.type} className="bg-white rounded-lg p-3 text-center">
                        <div className={`text-2xl font-bold ${s.color}`}>{(signatureRequest.signatureFields || []).filter(f => f.type === s.type).length}</div>
                        <p className="text-xs text-slate-600 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {signatureRequest.message && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-medium text-slate-900 mb-2">Message</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{signatureRequest.message}</p>
                  </div>
                )}
                {signatureRequest.dueDate && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-medium text-slate-900 mb-2">Due Date</h4>
                    <p className="text-sm text-slate-700">{new Date(signatureRequest.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><Mail className="h-5 w-5 text-purple-600" /></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-2">Email Preview</h4>
                      <div className="bg-white rounded-lg p-4 border text-sm">
                        <p className="text-slate-600 mb-3">Hi {(signatureRequest.recipients || [])[0]?.name},</p>
                        <p className="text-slate-600 mb-3">You've been requested to review and sign <strong>{doc.filename}</strong>.</p>
                        {signatureRequest.message && <p className="text-slate-600 mb-3 border-l-4 border-purple-300 pl-3 italic">"{signatureRequest.message}"</p>}
                        <Button className="bg-purple-600 hover:bg-purple-700" size="sm">Review & Sign Document</Button>
                        {signatureRequest.dueDate && <p className="text-xs text-slate-500 mt-3">Please complete by {new Date(signatureRequest.dueDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {step === 1 && <span>{(signatureRequest.recipients || []).length} recipient(s) added</span>}
            {step === 2 && <span>{(signatureRequest.signatureFields || []).length} field(s) placed</span>}
            {step === 3 && <span>Ready to send</span>}
          </div>
          <div className="flex gap-3">
            {step > 1 && <Button variant="outline" onClick={handleBack}><ChevronLeft className="h-4 w-4 mr-2" />Back</Button>}
            {step < 3 ? (
              <Button onClick={handleNext}>Continue<ChevronRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700" disabled={isSending}>
                {signatureRequest.isTemplate ? (
                  <><FileSignature className="h-4 w-4 mr-2" />{isSending ? 'Saving Template...' : 'Save as Template'}</>
                ) : (
                  <><Mail className="h-4 w-4 mr-2" />{isSending ? 'Sending...' : 'Send Request'}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}