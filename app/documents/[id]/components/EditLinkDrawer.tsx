"use client";

import { toast } from "sonner";
import { Copy, Trash2, X, LinkIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLink: any;
  setEditingLink: (link: any) => void;
  params: { id: any };
  onConfirm: (opts: any) => void;
};

export default function EditLinkDrawer({
  open, onOpenChange, editingLink, setEditingLink, params, onConfirm,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <div className="h-full flex flex-col bg-[#fafafa]">
        {/* Header */}
        <div className="bg-white border-b px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Edit Link</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingLink?.recipientEmail || "Public link"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

            {/* Link Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">Link Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <LinkIcon className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <span className="text-xs font-mono text-slate-600 truncate flex-1">
                    {editingLink?.link?.replace("https://", "").replace("http://", "")}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(editingLink?.link || "");
                      toast.success("Link copied!");
                    }}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                  >
                    Copy
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-slate-500">Created</p><p className="font-medium text-slate-900">{editingLink?.createdAgo}</p></div>
                  <div><p className="text-xs text-slate-500">Total visits</p><p className="font-medium text-slate-900">{editingLink?.visits}</p></div>
                  <div><p className="text-xs text-slate-500">Time spent</p><p className="font-medium text-slate-900">{editingLink?.totalTime}</p></div>
                  <div><p className="text-xs text-slate-500">Completion</p><p className="font-medium text-slate-900">{editingLink?.completion}</p></div>
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Access Control</h3>
              </div>
              <div className="divide-y divide-slate-100">
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Link active</div>
                    <div className="text-xs text-slate-400 mt-0.5">Recipients can open this link</div>
                  </div>
                  <Switch
                    checked={editingLink?.enabled}
                    onCheckedChange={async (checked) => {
                      try {
                        const res = await fetch(`/api/documents/${params.id}/share`, {
                          method: "PATCH",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ shareId: editingLink?.shareId, active: checked }),
                        });
                        if (res.ok) {
                          toast.success(checked ? "Link enabled" : "Link disabled");
                          setEditingLink({ ...editingLink, enabled: checked });
                          window.location.reload();
                        } else {
                          toast.error("Failed to update link");
                        }
                      } catch {
                        toast.error("Network error");
                      }
                    }}
                  />
                </label>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Allow download</div>
                    <div className="text-xs text-slate-400 mt-0.5">Viewer can save a copy</div>
                  </div>
                  <Switch defaultChecked />
                </label>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Allow printing</div>
                    <div className="text-xs text-slate-400 mt-0.5">Viewer can print the document</div>
                  </div>
                  <Switch defaultChecked />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-red-100 bg-red-50">
                <h3 className="font-semibold text-red-900 text-sm">Danger Zone</h3>
              </div>
              <div className="p-5 space-y-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!confirm("Create a duplicate of this link with the same settings?")) return;
                    try {
                      const res = await fetch(`/api/documents/${params.id}/share`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          requireEmail: editingLink?.settings?.requireEmail ?? true,
                          allowDownload: editingLink?.settings?.allowDownload ?? true,
                          allowPrint: editingLink?.settings?.allowPrint ?? true,
                          notifyOnView: editingLink?.settings?.notifyOnView ?? true,
                          recipientEmails: editingLink?.recipientEmail ? [editingLink.recipientEmail] : [],
                          recipientNames: editingLink?.recipientName ? [editingLink.recipientName + " (Copy)"] : [],
                          allowedEmails: editingLink?.recipientEmail ? [editingLink.recipientEmail] : [],
                          password: null,
                          expiresIn: "7",
                          allowForwarding: editingLink?.settings?.allowForwarding ?? true,
                          notifyOnDownload: editingLink?.settings?.notifyOnDownload ?? false,
                          selfDestruct: editingLink?.settings?.selfDestruct ?? false,
                          availableFrom: null,
                          linkType: editingLink?.settings?.linkType ?? "email-gated",
                          customMessage: editingLink?.settings?.customMessage ?? null,
                          sharedByName: editingLink?.settings?.sharedByName ?? null,
                          logoUrl: editingLink?.settings?.logoUrl ?? null,
                          enableWatermark: editingLink?.settings?.enableWatermark ?? false,
                          watermarkText: editingLink?.settings?.watermarkText ?? null,
                          watermarkPosition: editingLink?.settings?.watermarkPosition ?? "bottom",
                          requireNDA: editingLink?.settings?.requireNDA ?? false,
                          ndaText: editingLink?.settings?.ndaText ?? null,
                          ndaTemplateId: editingLink?.settings?.ndaTemplateId ?? null,
                          customNdaText: null,
                          trackDetailedAnalytics: editingLink?.settings?.trackDetailedAnalytics ?? true,
                          sendEmailNotification: false,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success("Link duplicated successfully!");
                        onOpenChange(false);
                        window.location.reload();
                      } else {
                        toast.error(data.error || "Failed to duplicate link");
                      }
                    } catch {
                      toast.error("Network error");
                    }
                  }}
                  className="w-full justify-start gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate this link
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    onConfirm({
                      title: "Delete Link",
                      message: `Are you sure you want to permanently delete the link for ${editingLink?.recipientEmail || "this recipient"}?`,
                      danger: true,
                      onConfirm: async () => {
                        try {
                          const res = await fetch(
                            `/api/documents/${params.id}/share?shareId=${editingLink?.shareId}`,
                            { method: "DELETE", credentials: "include" }
                          );
                          if (res.ok) {
                            toast.success("Link deleted");
                            onOpenChange(false);
                            window.location.reload();
                          } else {
                            toast.error("Failed to delete link");
                          }
                        } catch {
                          toast.error("Network error");
                        }
                      },
                    });
                  }}
                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete this link permanently
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}