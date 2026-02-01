// app/settings/nda-templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  FileText,
  Star,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface NdaTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  isSystemDefault: boolean;
  template: string;
  variables: string[];
  version: string;
  usageCount: number;
  createdAt: string;
}

export default function NdaTemplatesPage() {
  const router = useRouter();
  
  const [templates, setTemplates] = useState<NdaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NdaTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/nda-templates', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateText(getDefaultTemplate());
    setSetAsDefault(false);
    setShowEditor(true);
  };

  const handleEdit = (template: NdaTemplate) => {
    if (template.isSystemDefault) {
      // Duplicate system template
      setEditingTemplate(null);
      setTemplateName(`${template.name} (Copy)`);
      setTemplateText(template.template);
      setSetAsDefault(false);
    } else {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateText(template.template);
      setSetAsDefault(template.isDefault);
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    if (!templateText.trim()) {
      alert('Please enter template content');
      return;
    }

    setSaving(true);

    try {
      if (editingTemplate) {
        // Update existing
        const res = await fetch(`/api/nda-templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: templateName,
            template: templateText,
            setAsDefault,
          }),
        });

        if (res.ok) {
          alert('✅ Template updated successfully');
          setShowEditor(false);
          fetchTemplates();
        } else {
          const data = await res.json();
          alert(`❌ ${data.error || 'Failed to update template'}`);
        }
      } else {
        // Create new
        const res = await fetch('/api/nda-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: templateName,
            template: templateText,
            setAsDefault,
          }),
        });

        if (res.ok) {
          alert('✅ Template created successfully');
          setShowEditor(false);
          fetchTemplates();
        } else {
          const data = await res.json();
          alert(`❌ ${data.error || 'Failed to create template'}`);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: NdaTemplate) => {
    if (template.isSystemDefault) {
      alert('Cannot delete system default template');
      return;
    }

    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/nda-templates/${template.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        alert('✅ Template deleted');
        fetchTemplates();
      } else {
        alert('❌ Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Failed to delete template');
    }
  };

  const handleSetDefault = async (template: NdaTemplate) => {
    try {
      const res = await fetch(`/api/nda-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          setAsDefault: true,
        }),
      });

      if (res.ok) {
        alert('✅ Default template updated');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Set default error:', error);
    }
  };

  const handlePreview = () => {
    const previewData = {
      viewerName: 'John Doe',
      viewerEmail: 'john@company.com',
      viewerCompany: 'Acme Corporation',
      documentTitle: 'Sample Document.pdf',
      ownerName: 'Your Name',
      ownerCompany: 'Your Company Inc.',
      viewDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      viewTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
    };

    let preview = templateText;
    preview = preview.replace(/\{\{viewer_name\}\}/g, previewData.viewerName);
    preview = preview.replace(/\{\{viewer_email\}\}/g, previewData.viewerEmail);
    preview = preview.replace(/\{\{viewer_company\}\}/g, previewData.viewerCompany);
    preview = preview.replace(/\{\{document_title\}\}/g, previewData.documentTitle);
    preview = preview.replace(/\{\{owner_name\}\}/g, previewData.ownerName);
    preview = preview.replace(/\{\{owner_company\}\}/g, previewData.ownerCompany);
    preview = preview.replace(/\{\{view_date\}\}/g, previewData.viewDate);
    preview = preview.replace(/\{\{view_time\}\}/g, previewData.viewTime);

    setPreviewText(preview);
    setShowPreview(true);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = templateText;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setTemplateText(before + `{{${variable}}}` + after);

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/settings')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  NDA Templates
                </h1>
                <p className="text-sm text-slate-500">
                  Manage your Non-Disclosure Agreement templates
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreateNew}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">About NDA Templates</p>
              <p>
                Create reusable NDA templates with dynamic variables. When viewers access 
                your documents, the variables will be automatically filled with their information.
              </p>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Templates Yet
            </h3>
            <p className="text-slate-600 mb-6">
              Create your first NDA template to use when sharing documents
            </p>
            <Button
              onClick={handleCreateNew}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4" />
              Create First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* Template Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {template.name}
                      </h3>
                      {template.isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </span>
                      )}
                      {template.isSystemDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          System
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Version {template.version}</span>
                      <span>•</span>
                      <span>Used {template.usageCount} times</span>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="h-8 w-8 p-0"
                    >
                      {template.isSystemDefault ? <Copy className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </Button>
                    {!template.isSystemDefault && (
                      <>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(template)}
                            className="h-8 w-8 p-0"
                            title="Set as default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Template Preview */}
                <div className="bg-slate-50 rounded-lg p-3 border mb-4">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono line-clamp-6">
                    {template.template}
                  </pre>
                </div>

                {/* Variables Used */}
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">
                      Variables Used:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-mono"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create NDA Template'}
            </DialogTitle>
            <DialogDescription>
              Use variables like {`{{viewer_name}}`} to personalize the NDA
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Editor */}
              <div className="col-span-2 space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Standard Company NDA"
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Template Content</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      className="gap-2"
                    >
                      <FileText className="h-3 w-3" />
                      Preview
                    </Button>
                  </div>
                  <Textarea
                    id="template-editor"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    placeholder="Enter your NDA text here..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {templateText.length} characters
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600"
                  />
                  <span className="text-sm text-slate-700">
                    Set as my default template
                  </span>
                </label>
              </div>

              {/* Right: Variables Helper */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Available Variables
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Click to insert into template
                  </p>
                  <div className="space-y-2">
                    {[
                      { var: 'viewer_name', desc: 'Viewer\'s full name' },
                      { var: 'viewer_email', desc: 'Viewer\'s email' },
                      { var: 'viewer_company', desc: 'Viewer\'s company' },
                      { var: 'document_title', desc: 'Document filename' },
                      { var: 'owner_name', desc: 'Your name' },
                      { var: 'owner_company', desc: 'Your company' },
                      { var: 'view_date', desc: 'Current date' },
                      { var: 'view_time', desc: 'Current time' },
                    ].map((item) => (
                      <button
                        key={item.var}
                        onClick={() => insertVariable(item.var)}
                        className="w-full text-left p-2 rounded border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <code className="text-xs font-mono text-purple-600 block mb-0.5">
                          {`{{${item.var}}}`}
                        </code>
                        <span className="text-xs text-slate-600">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-900">
                    <strong>💡 Tip:</strong> Variables will be automatically 
                    replaced with actual values when viewers see the NDA.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditor(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>NDA Preview</DialogTitle>
            <DialogDescription>
              This is how viewers will see the NDA (with sample data)
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-white border rounded-lg p-6 max-h-[60vh] overflow-y-auto">
            <pre className="text-sm text-slate-900 whitespace-pre-wrap font-sans">
              {previewText}
            </pre>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getDefaultTemplate(): string {
  return `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{view_date}} between:

DISCLOSING PARTY: {{owner_company}} ("Owner")
RECEIVING PARTY: {{viewer_name}} at {{viewer_email}}{{viewer_company}} ("Recipient")

SUBJECT MATTER: "{{document_title}}"

1. CONFIDENTIAL INFORMATION
The Recipient acknowledges that the document titled "{{document_title}}" contains confidential and proprietary information belonging to the Owner.

2. OBLIGATIONS
The Recipient agrees to:
   a) Maintain the confidentiality of all information contained in the document
   b) Not disclose, copy, or distribute any part of the document to third parties
   c) Use the information solely for the purpose for which it was shared
   d) Not use the information for competitive purposes

3. TERM
This Agreement shall remain in effect for a period of two (2) years from {{view_date}}.

4. LEGAL CONSEQUENCES
Unauthorized disclosure may result in legal action for damages and injunctive relief.

ACCEPTANCE:
By clicking "I Accept," {{viewer_name}} acknowledges having read and agreed to these terms on {{view_date}} at {{view_time}}.`;
}