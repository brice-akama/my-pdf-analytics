"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  danger?: boolean;
};

type Props = {
  state: ConfirmDialogState;
  onOpenChange: (open: boolean) => void;
};

export default function ConfirmDialog({ state, onOpenChange }: Props) {
  return (
    <Dialog
      open={state.open}
      onOpenChange={(o) => onOpenChange(o)}
    >
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600 py-2">{state.message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              state.onConfirm();
              onOpenChange(false);
            }}
            className={
              state.danger ? "bg-red-600 hover:bg-red-700 text-white" : ""
            }
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}