"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileSignature, ArrowLeft, Edit, Mail } from "lucide-react";

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplateData();
  }, [params.id]);

  const fetchTemplateData = async () => {
    // Fetch document
    const docRes = await fetch(`/api/documents/${params.id}`, {
      credentials: "include",
    });
    const docData = await docRes.json();
    setDoc(docData.document);

    // Fetch template config
    const templateRes = await fetch(`/api/documents/${params.id}/template`, {
      credentials: "include",
    });
    const templateData = await templateRes.json();
    setTemplate(templateData.template);

    // Fetch PDF
    const pdfRes = await fetch(`/api/documents/${params.id}/file?serve=blob`, {
      credentials: "include",
    });
    const blob = await pdfRes.blob();
    setPdfUrl(URL.createObjectURL(blob));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/documents/${params.id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{doc?.filename} - Template Preview</h1>
              <p className="text-sm text-slate-500">{template?.recipients?.length} recipients, {template?.signatureFields?.length} fields</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(`/documents/${params.id}/signature?mode=edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
            <Button onClick={() => router.push(`/documents/${params.id}/signature?mode=send`)} className="bg-purple-600">
              <Mail className="h-4 w-4 mr-2" />
              Send to Recipients
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Template Info */}
          <div className="col-span-4 space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Recipients ({template?.recipients?.length})</h3>
              {template?.recipients?.map((r: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 rounded mb-2">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-slate-500">{r.role || 'Signer'}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Signature Fields ({template?.signatureFields?.length})</h3>
              {template?.signatureFields?.map((f: any, i: number) => (
                <div key={i} className="text-sm p-2 bg-slate-50 rounded mb-2">
                  {f.type} - Page {f.page} - {template.recipients[f.recipientIndex]?.name}
                </div>
              ))}
            </div>
          </div>

          {/* Right: PDF Preview with Fields */}
          <div className="col-span-8 bg-white rounded-lg border p-4">
            {pdfUrl && (
              <div className="relative">
                <embed src={pdfUrl} type="application/pdf" className="w-full h-[800px]" />
                {/* Overlay signature fields as visual markers */}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}