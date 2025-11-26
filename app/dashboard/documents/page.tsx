"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Loader2, CheckCircle } from 'lucide-react';

interface Signer {
  name: string;
  email: string;
  status: string;
  signedAt?: string;
}

interface Document {
  _id: string;
  filename: string;
  uploadedAt: string;
  signedPdfUrl: string;
  completedAt: string;
  numPages: number;
  signers: Signer[];
}

export default function UploaderDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get user email from your auth system
    // For now, you can hardcode or get from localStorage
    const email = localStorage.getItem('userEmail') || prompt('Enter your email:');
    if (email) {
      setUserEmail(email);
      fetchDocuments(email);
    }
  }, []);

  const fetchDocuments = async (email: string) => {
    try {
      const res = await fetch(`/api/user/documents?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError(data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load documents');
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const res = await fetch(`/api/document/${documentId}/download`);
      
      if (!res.ok) {
        alert('Failed to download document');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document');
    }
  };

  const handleView = async (documentId: string) => {
    try {
      const res = await fetch(`/api/document/${documentId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('View error:', err);
      alert('Failed to view document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Signed Documents</h1>
          <p className="text-slate-600">View and download all your completed documents</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-xl p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No signed documents yet</h3>
            <p className="text-slate-500">Documents you upload will appear here once signed</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{doc.filename}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                      <div>
                        <span className="font-medium">Completed:</span>{' '}
                        {new Date(doc.completedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Pages:</span> {doc.numPages || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Signers:</span> {doc.signers.length}
                      </div>
                    </div>

                    {/* Signers */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Signers:</h4>
                      <div className="flex flex-wrap gap-2">
                        {doc.signers.map((signer, idx) => (
                          <div key={idx} className="bg-green-50 px-3 py-1 rounded-full text-sm">
                            <span className="text-green-700 font-medium">{signer.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleView(doc._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(doc._id, doc.filename)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}