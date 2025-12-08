"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Link as LinkIcon } from "lucide-react";

type SignatureField = {
  id: string | number;
  type: "signature" | "date" | "text" | "checkbox";
  label?: string;
  recipientIndex: number;
  page: number;
  y: number;
  conditional?: {
    enabled: boolean;
    dependsOn: string | number;
    condition: "checked" | "unchecked" | "equals" | "not_equals" | "contains";
    value?: string;
  };
};

interface ConditionalFieldBuilderProps {
  field: SignatureField;
  allFields: SignatureField[];
  onUpdate: (field: SignatureField) => void;
  onClose: () => void;
}

export default function ConditionalFieldBuilder({
  field,
  allFields,
  onUpdate,
  onClose,
}: ConditionalFieldBuilderProps) {
  const [enabled, setEnabled] = useState(field.conditional?.enabled || false);
  const [dependsOn, setDependsOn] = useState<string>(
    field.conditional?.dependsOn?.toString() || ""
  );
  const [condition, setCondition] = useState<string>(
    field.conditional?.condition || "checked"
  );
  const [value, setValue] = useState(field.conditional?.value || "");

  // Only checkboxes/text can be dependencies
  const eligibleDependencies = allFields.filter(
    (f) =>
      f.id !== field.id &&
      f.recipientIndex === field.recipientIndex &&
      (f.type === "checkbox" || f.type === "text") &&
      (f.page < field.page || (f.page === field.page && f.y < field.y))
  );
  const selectedDependency = eligibleDependencies.find(
    (f) => f.id.toString() === dependsOn
  );

  const handleSave = () => {
    if (!enabled) {
      const updatedField = { ...field };
      delete updatedField.conditional;
      onUpdate(updatedField);
      onClose();
      return;
    }
    if (field.type === "signature" || field.type === "date") {
      onClose();
      return;
    }
    if (!dependsOn) {
      alert("Please select a field to depend on");
      return;
    }
    if ((condition === "equals" || condition === "contains") && !value) {
      alert("Please enter a value for this condition");
      return;
    }
    const updatedField: SignatureField = {
      ...field,
      conditional: {
        enabled: true,
        dependsOn,
        condition: condition as any,
        value: condition === "equals" || condition === "contains" ? value : undefined,
      },
    };
    onUpdate(updatedField);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white scroolbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conditional Logic</DialogTitle>
          <DialogDescription>
            Show or hide this field based on another field's value
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
            <div>
              <Label className="text-sm font-medium">Enable Conditional Logic</Label>
              <p className="text-xs text-slate-600 mt-1">
                This field will show/hide based on another field
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {enabled && (
            <>
              {field.type === "signature" || field.type === "date" ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Conditional Logic Not Available
                      </p>
                      <p className="text-xs text-yellow-800 mt-1">
                        Conditional logic cannot be applied to {field.type} fields.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {eligibleDependencies.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">
                            No Eligible Fields
                          </p>
                          <p className="text-xs text-yellow-800 mt-1">
                            Add a checkbox or text field for the same recipient BEFORE this field to use conditional logic.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Show this field when:
                        </Label>
                        <select
                          value={dependsOn}
                          onChange={(e) => setDependsOn(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">Select a field...</option>
                          {eligibleDependencies.map((f) => (
                            <option key={f.id} value={f.id.toString()}>
                              {f.type === "checkbox"
                                ? `☑️ ${f.label || "Checkbox"}`
                                : `📝 Text: ${f.label || "Text Field"}`}{" "}
                              (Page {f.page})
                            </option>
                          ))}
                        </select>
                      </div>
                      {dependsOn && selectedDependency && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Condition</Label>
                          {selectedDependency.type === "checkbox" && (
                            <select
                              value={condition}
                              onChange={(e) => setCondition(e.target.value)}
                              className="w-full border rounded-lg px-3 py-2"
                            >
                              <option value="checked">is checked</option>
                              <option value="unchecked">is unchecked</option>
                            </select>
                          )}
                          {selectedDependency.type === "text" && (
                            <>
                              <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 mb-3"
                              >
                                <option value="equals">equals</option>
                                <option value="not_equals">does not equal</option>
                                <option value="contains">contains</option>
                              </select>
                              <Input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Enter value..."
                                className="w-full"
                              />
                            </>
                          )}
                        </div>
                      )}
                      {dependsOn && selectedDependency && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <LinkIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Logic Preview:
                              </p>
                              <p className="text-sm text-blue-800">
                                This {field.type} field will {" "}
                                <strong>only show</strong> when{" "}
                                <strong>
                                  {selectedDependency.label || `${selectedDependency.type} field`}
                                </strong>{" "}
                                {condition === "checked" && "is checked"}
                                {condition === "unchecked" && "is NOT checked"}
                                {condition === "equals" && `equals "${value}"`}
                                {condition === "not_equals" && `does NOT equal "${value}"`}
                                {condition === "contains" && `contains "${value}"`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={enabled && !dependsOn && eligibleDependencies.length > 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Save Logic
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
