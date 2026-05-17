import type { CellModel } from "@/types/task";

export type ValueType = "string" | "number" | "boolean" | "empty";

export function detectValueType(val: unknown): ValueType {
  if (val === null || val === undefined || val === "") return "empty";
  if (typeof val === "number") return "number";
  if (typeof val === "boolean") return "boolean";
  if (typeof val === "string") {
    if (/^-?\d+(\.\d+)?$/.test(val.trim())) return "number";
    if (val.trim().toLowerCase() === "true" || val.trim().toLowerCase() === "false") return "boolean";
    return "string";
  }
  return "string";
}

const COMPATIBLE: Record<ValueType, CellModel[]> = {
  string: ["el-input", "el-textarea", "el-select", "el-input-tags", "el-date-picker", "el-color-picker", "el-radio", "el-checkbox-group"],
  number: ["el-input-number", "el-slider", "el-select", "el-radio"],
  boolean: ["el-switch", "el-checkbox"],
  empty: [],
};

export const ALL_COMPONENT_MODELS: CellModel[] = [
  "el-input", "el-input-number", "el-switch", "el-select", "el-input-tags", "el-textarea",
  "el-checkbox", "el-checkbox-group", "el-radio", "el-slider", "el-date-picker", "el-color-picker",
];

export function compatibleModels(val: unknown): CellModel[] {
  const t = detectValueType(val);
  if (t === "empty") return ALL_COMPONENT_MODELS;
  return COMPATIBLE[t];
}
