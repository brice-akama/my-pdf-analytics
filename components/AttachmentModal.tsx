// components/AttachmentModal.tsx
"use client";
import React, { useState, useRef } from 'react';
import { X, Upload, File, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { 
  ATTACHMENT_TYPES, 
  validateAttachment, 
  formatFileSize,
  AttachmentType 
} from  '../lib/attachmentConfig';

interface Attachment {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  attachmentType: string;
  description?: string;
  url: string;
  uploadedAt: string;
  isRequired: boolean;
}

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureId: string;
  existingAttachments?: Attachment[];
  onAttachmentsChange?: () => void;
  fieldId: string;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  isOpen,
  onClose,
  signatureId,
  existingAttachments = [],
  onAttachmentsChange,
  fieldId
}) => {
  const [selectedType, setSelectedType] = useState<AttachmentType>(ATTACHMENT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>(existingAttachments);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Validate file
    const validation = validateAttachment(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType.id);
      formData.append('description', description);
      formData.append('required', isRequired.toString());
      formData.append('fieldId', fieldId);
      

      const res = await fetch(`/api/signature/${signatureId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to upload attachment');
        setUploading(false);
        return;
      }

      setSuccess(`✅ ${file.name} uploaded successfully!`);
      
      // Add to attachments list
      const newAttachment: Attachment = {
        id: data.attachment.id,
        filename: data.attachment.filename,
        fileSize: data.attachment.fileSize,
        fileType: data.attachment.fileType,
        attachmentType: selectedType.id,
        description: description || undefined,
        url: data.attachment.url,
        uploadedAt: new Date().toISOString(),
        isRequired: isRequired,
      };

      setAttachments(prev => [newAttachment, ...prev]);
      
      // Reset form
      setDescription('');
      setIsRequired(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Notify parent component
      if (onAttachmentsChange) {
        onAttachmentsChange();
      }

      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload attachment. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    setDeleting(attachmentId);
    setError(null);

    try {
      const res = await fetch(
        `/api/signature/${signatureId}/attachments?attachmentId=${attachmentId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to delete attachment');
        setDeleting(null);
        return;
      }

      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      setSuccess('Attachment deleted successfully');

      if (onAttachmentsChange) {
        onAttachmentsChange();
      }

      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete attachment');
    } finally {
      setDeleting(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📎';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Upload Required Documents</h3>
            <p className="text-sm text-slate-500 mt-1">
              Attach supporting documents needed to complete this signature
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Alert Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-8">
            <h4 className="font-semibold text-slate-900 mb-4">Upload New Attachment</h4>
            
            {/* Document Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                What type of document are you uploading?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ATTACHMENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:border-purple-400 ${
                      selectedType.id === type.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{type.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{type.description}</p>
                      </div>
                      {selectedType.id === type.id && (
                        <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Use Case Examples */}
            {selectedType && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  📌 Common examples for {selectedType.name}:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  {selectedType.examples.map((example, idx) => (
                    <li key={idx}>• {example}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional notes about this document..."
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={2}
              />
            </div>

            {/* Required Checkbox */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="requiredDoc"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 text-purple-600 rounded"
              />
              <label htmlFor="requiredDoc" className="text-sm text-slate-700">
                Mark this document as required
              </label>
            </div>

            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              className="hidden"
              disabled={uploading}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-700 font-medium">Uploading...</p>
                  <p className="text-sm text-slate-500 mt-1">Please wait</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 font-medium mb-2">Click to upload {selectedType.name}</p>
                  <p className="text-sm text-slate-500">
                    PDF, Images, Word, Excel (max 10MB)
                  </p>
                </div>
              )}
            </button>
          </div>

          {/* Existing Attachments */}
          {attachments.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">
                Uploaded Documents ({attachments.length})
              </h4>
              <div className="space-y-3">
                {attachments.map((attachment) => {
                  const typeInfo = ATTACHMENT_TYPES.find(t => t.id === attachment.attachmentType);
                  return (
                    <div
                      key={attachment.id}
                      className="border-2 border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">{typeInfo?.icon || '📎'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {attachment.filename}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {typeInfo?.name || 'Document'} • {formatFileSize(attachment.fileSize)}
                            </p>
                            {attachment.description && (
                              <p className="text-sm text-slate-500 mt-2 italic">
                                "{attachment.description}"
                              </p>
                            )}
                            {attachment.isRequired && (
                              <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Required
                              </span>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                              Uploaded {new Date(attachment.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <a
                            href={`/api/signature/${signatureId}/attachments/${attachment.id}?action=view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View
                          </a>
                          <a
                          
  
    href={`/api/signature/${signatureId}/attachments/${attachment.id}?action=download`}
    download={attachment.filename}
    className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
  >
    Download
  </a>
                          <button
                            onClick={() => handleDelete(attachment.id)}
                            disabled={deleting === attachment.id}
                            className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {deleting === attachment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-700">
              <strong>💡 Note:</strong> All attachments are securely stored and encrypted. They will be 
              included with the signed document and visible to all parties involved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};