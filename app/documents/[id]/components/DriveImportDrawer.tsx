"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FileText, Clock, Loader2, Search, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";

type Contact = { email: string; name?: string; company?: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (contacts: Contact[]) => void;
  router: any;
};

export default function DriveImportDrawer({ open, onOpenChange, onImport, router }: Props) {
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/integrations/google-drive/files", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setDriveFiles(data.files || []);
      else if (res.status === 401) toast.error("Please reconnect Google Drive");
      else toast.error(data.error || "Failed to load files");
    } catch { toast.error("Network error"); }
    finally { setLoadingFiles(false); }
  };

  // Load files when drawer opens
  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (o) loadFiles();
  };

  const handleFileClick = async (file: any) => {
    toast.loading("Importing CSV from Drive...");
    try {
      const res = await fetch("/api/integrations/google-drive/import", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, fileName: file.name }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.version === 1) {
          toast.success("Imported from Google Drive!", { description: `${data.filename} added to documents` });
        } else {
          toast.success("New version created!", { description: `Updated to Version ${data.version}` });
        }
        onOpenChange(false);
        router.refresh();
        return;
      }

      // Try parsing as CSV contacts
      const blob = await res.blob();
      const text = await blob.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) || [];
      const emailIndex = headers.findIndex((h) => h.includes("email"));

      if (emailIndex === -1) { toast.error('CSV must have an "email" column'); return; }

      const nameIndex = headers.findIndex((h) => h.includes("name"));
      const companyIndex = headers.findIndex((h) => h.includes("company"));

      const contacts: Contact[] = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        return {
          email: cols[emailIndex]?.toLowerCase() || "",
          name: nameIndex >= 0 ? cols[nameIndex] : undefined,
          company: companyIndex >= 0 ? cols[companyIndex] : undefined,
        };
      }).filter((c) => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));

      if (!contacts.length) { toast.error("No valid emails in CSV"); return; }

      onImport(contacts);
      toast.success(`Found ${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`);
    } catch { toast.error("Import failed"); }
  };

  const filtered = driveFiles.filter(
    (f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()) && f.name.endsWith(".csv")
  );

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Import from Google Drive</h2>
                <p className="text-sm text-slate-600">Select CSV file to import contacts</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search your Drive files..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Found {filtered.length} CSV file(s)</p>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingFiles ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-slate-600 font-medium">Loading your Drive files...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate mb-1 group-hover:text-blue-700 transition-colors">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Modified {new Date(file.modifiedTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />Import
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No CSV files found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Upload CSV files to your Google Drive to import them here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Drawer>
  );
}