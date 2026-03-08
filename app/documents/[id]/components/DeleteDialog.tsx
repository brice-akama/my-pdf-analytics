"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  isDeleting: boolean;
  onConfirm: () => void;
};

export default function DeleteDialog({ open, onOpenChange, filename, isDeleting, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-slate-600 mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{filename}</span>? This action
            cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}