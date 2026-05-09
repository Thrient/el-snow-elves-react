# 变量布局编辑器重设计 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 LayoutBuilder 从「左侧组件面板 + 点击添加」改为「左侧待布局变量 + 拖拽到右侧 + 弹窗选控件」的双区拖拽模式。

**Architecture:** 使用 HTML5 原生 Drag & Drop API，无需额外依赖。左侧面板展示 `values` 中未布局的变量（drag source），右侧展示已布局网格（drop zone + 内部拖拽排序）。拖入时弹出 ComponentPickerModal 按默认值类型过滤控件。

**Tech Stack:** React 19, TypeScript, Ant Design 6, UnoCSS

---

### Task 1: 创建类型兼容性工具

**Files:**
- Create: `src/utils/type-compat.ts`

- [ ] **Step 1: 创建文件并实现类型判断和过滤函数**

```ts
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
  string: ["el-input", "el-textarea", "el-select", "el-date-picker", "el-color-picker", "el-radio", "el-checkbox-group"],
  number: ["el-input-number", "el-slider", "el-select", "el-radio"],
  boolean: ["el-switch", "el-checkbox"],
  empty: [],
};

export const ALL_COMPONENT_MODELS: CellModel[] = [
  "el-input", "el-input-number", "el-switch", "el-select", "el-textarea",
  "el-checkbox", "el-checkbox-group", "el-radio", "el-slider", "el-date-picker", "el-color-picker",
];

export function compatibleModels(val: unknown): CellModel[] {
  const t = detectValueType(val);
  if (t === "empty") return ALL_COMPONENT_MODELS;
  return COMPATIBLE[t];
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd D:/Code/el-snow-elves-react && npx tsc --noEmit src/utils/type-compat.ts
```

Expected: No errors.

- [ ] **Step 3: 提交**

```bash
git add src/utils/type-compat.ts
git commit -m "feat: add type compatibility utility for variable layout filtering"
```

---

### Task 2: 提取共享 MiniPreview 组件

**Files:**
- Create: `src/components/mini-preview/MiniPreview.tsx`
- Modify: `src/pages/task-editor/TaskVarsSection.tsx`

MiniPreview 接受一个 Cell 进行可视化预览。现提取为独立组件供 TaskVarsSection 和 ComponentPickerModal 共用。

- [ ] **Step 1: 创建 MiniPreview 组件**

`src/components/mini-preview/MiniPreview.tsx`:

```tsx
import type { FC } from "react";
import type { Cell } from "@/types/task";

interface Props {
  cell: Cell;
}

const MiniPreview: FC<Props> = ({ cell }) => {
  const model = cell.model ?? "el-input";
  const label = cell.text;
  const ph = cell.placeholder;

  switch (model) {
    case "el-switch":
      return (
        <span className="inline-flex items-center gap-1.5">
          {label && <span className="text-[10px] text-[#374151]">{label}</span>}
          <span className="inline-block w-7 h-[14px] rounded-full bg-[#c0c6cc] relative align-middle">
            <span className="absolute top-[2px] left-[2px] w-[10px] h-[10px] rounded-full bg-white shadow-sm" />
          </span>
        </span>
      );
    case "el-checkbox":
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-[#c0c6cc]" />
          {label && <span className="text-[10px] text-[#374151]">{label}</span>}
        </span>
      );
    case "el-checkbox-group":
      return (
        <span className="inline-flex flex-col gap-0.5">
          {label && <span className="text-[10px] text-[#374151]">{label}</span>}
          {(cell.options ?? []).length > 0
            ? cell.options!.slice(0, 3).map((o, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-[#6b7280]">
                <span className="w-2.5 h-2.5 rounded-sm border border-[#c0c6cc]" />{o.label || o.value}
              </span>
            ))
            : <span className="text-[9px] text-[#bfbfbf]">无选项</span>
          }
        </span>
      );
    case "el-radio":
      return (
        <span className="inline-flex flex-col gap-0.5">
          {label && <span className="text-[10px] text-[#374151]">{label}</span>}
          {(cell.options ?? []).length > 0
            ? cell.options!.slice(0, 3).map((o, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-[#6b7280]">
                <span className="w-2.5 h-2.5 rounded-full border border-[#c0c6cc]" />{o.label || o.value}
              </span>
            ))
            : <span className="text-[9px] text-[#bfbfbf]">无选项</span>
          }
        </span>
      );
    case "el-slider":
      return (
        <span className="inline-flex items-center gap-1.5 w-full">
          {label && <span className="text-[10px] text-[#374151] shrink-0">{label}</span>}
          <span className="flex-1 h-1 rounded-full bg-[#e5e7eb] relative">
            <span className="absolute left-[30%] top-[-3px] w-[10px] h-[10px] rounded-full bg-white border-2 border-[#4b8bf4]" />
          </span>
        </span>
      );
    case "el-input-number":
      return (
        <span className="inline-flex items-center gap-1.5 w-full">
          {label && <span className="text-[10px] text-[#374151] shrink-0">{label}</span>}
          <span className="flex-1 h-[22px] rounded border border-[#d9d9d9] bg-white px-2 flex items-center gap-1">
            <span className="text-[9px] text-[#bfbfbf] w-0 flex-1 truncate">{ph || "0"}</span>
            <span className="flex flex-col leading-none text-[#bfbfbf] text-[8px]">▲▼</span>
          </span>
        </span>
      );
    case "el-select":
      return (
        <span className="inline-flex items-center gap-1.5 w-full">
          {label && <span className="text-[10px] text-[#374151] shrink-0">{label}</span>}
          <span className="flex-1 h-[22px] rounded border border-[#d9d9d9] bg-white px-2 flex items-center justify-between">
            <span className="text-[9px] text-[#bfbfbf]">{ph || "选择..."}</span>
            <span className="text-[8px] text-[#bfbfbf] ml-1">▼</span>
          </span>
        </span>
      );
    case "el-textarea":
      return (
        <span className="inline-flex flex-col gap-0.5 w-full">
          {label && <span className="text-[10px] text-[#374151]">{label}</span>}
          <span className="h-[30px] rounded border border-[#d9d9d9] bg-white px-2 py-0.5">
            <span className="text-[9px] text-[#bfbfbf]">{ph || ""}</span>
          </span>
        </span>
      );
    case "el-date-picker":
      return (
        <span className="inline-flex items-center gap-1.5 w-full">
          {label && <span className="text-[10px] text-[#374151] shrink-0">{label}</span>}
          <span className="flex-1 h-[22px] rounded border border-[#d9d9d9] bg-white px-2 flex items-center gap-1">
            <span className="text-[10px]">📅</span>
            <span className="text-[9px] text-[#bfbfbf]">{ph || cell.format || "YYYY-MM-DD"}</span>
          </span>
        </span>
      );
    case "el-color-picker":
      return (
        <span className="inline-flex items-center gap-1.5">
          {label && <span className="text-[10px] text-[#374151]">{label}</span>}
          <span className="w-[22px] h-[22px] rounded border border-[#d9d9d9] bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 w-full">
          {label && <span className="text-[10px] text-[#374151] shrink-0">{label}</span>}
          <span className="flex-1 h-[22px] rounded border border-[#d9d9d9] bg-white px-2 flex items-center">
            <span className="text-[9px] text-[#bfbfbf]">{ph || ""}</span>
          </span>
        </span>
      );
  }
};

export default MiniPreview;
```

- [ ] **Step 2: 更新 TaskVarsSection.tsx 使用共享 MiniPreview**

替换 TaskVarsSection.tsx 中第 51-175 行的 MiniPreview 本地组件为 import:

```tsx
// 删除第 51-175 行的 Field 和 MiniPreview 本地定义
// 在第 5 行附近添加:
import MiniPreview from "@/components/mini-preview/MiniPreview";
```

保留 `Field` 组件（CellEditor 仍在使用）。只删除 `MiniPreview` 本地定义（第 59-175 行）。

使用 Edit 工具精确替换：
- `old_string`: 从 `/** Minimal visual preview` 到 `};` 结束的整个 MiniPreview 组件
- `new_string`: 空（替换为 import，在文件顶部添加 import 语句）
- 在 import 区域添加 `import MiniPreview from "@/components/mini-preview/MiniPreview";`

- [ ] **Step 3: 验证编译**

```bash
cd D:/Code/el-snow-elves-react && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: 提交**

```bash
git add src/components/mini-preview/MiniPreview.tsx src/pages/task-editor/TaskVarsSection.tsx
git commit -m "refactor: extract MiniPreview to shared component"
```

---

### Task 3: 创建 ComponentPickerModal

**Files:**
- Create: `src/pages/task-editor/ComponentPickerModal.tsx`

弹窗展示兼容的控件类型，每个控件带默认值预览。用户点击选择后关闭弹窗并回调。

- [ ] **Step 1: 创建 ComponentPickerModal**

`src/pages/task-editor/ComponentPickerModal.tsx`:

```tsx
import { useState, useMemo, type FC } from "react";
import { Modal } from "antd";
import type { CellModel } from "@/types/task";
import { compatibleModels, detectValueType } from "@/utils/type-compat";
import MiniPreview from "@/components/mini-preview/MiniPreview";

interface Props {
  open: boolean;
  varName: string;
  varValue: unknown;
  onSelect: (model: CellModel) => void;
  onCancel: () => void;
}

const MODEL_META: Record<string, { label: string; short: string; color: string; bg: string }> = {
  "el-input":        { label: "文本输入", short: "Aa", color: "#6366f1", bg: "#eef2ff" },
  "el-input-number": { label: "数字输入", short: "12", color: "#10b981", bg: "#ecfdf5" },
  "el-switch":       { label: "开关",     short: "⇄",  color: "#f59e0b", bg: "#fffbeb" },
  "el-select":       { label: "下拉选择", short: "☰",  color: "#8b5cf6", bg: "#f5f3ff" },
  "el-textarea":     { label: "多行文本", short: "¶",  color: "#06b6d4", bg: "#ecfeff" },
  "el-checkbox":     { label: "复选框",   short: "☑",  color: "#ef4444", bg: "#fef2f2" },
  "el-checkbox-group":{ label: "多选组",  short: "☑☑",color: "#ec4899", bg: "#fdf2f8" },
  "el-radio":        { label: "单选组",   short: "◉",  color: "#f97316", bg: "#fff7ed" },
  "el-slider":       { label: "滑块",     short: "—",  color: "#6366f1", bg: "#eef2ff" },
  "el-date-picker":  { label: "日期选择", short: "📅", color: "#14b8a6", bg: "#f0fdfa" },
  "el-color-picker": { label: "颜色选择", short: "◐",  color: "#a855f7", bg: "#faf5ff" },
};

function formatPreviewValue(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "boolean") return val ? "true" : "false";
  return String(val);
}

const ComponentPickerModal: FC<Props> = ({ open, varName, varValue, onSelect, onCancel }) => {
  const models = useMemo(() => compatibleModels(varValue), [varValue]);
  const valueType = useMemo(() => detectValueType(varValue), [varValue]);
  const previewStr = formatPreviewValue(varValue);

  const allModels = Object.keys(MODEL_META) as CellModel[];
  const incompatible = allModels.filter((m) => !models.includes(m));

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">选择控件类型</span>
          <code className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono">
            {`{${varName}}`}
          </code>
          {previewStr && (
            <span className="text-xs text-slate-400">= &quot;{previewStr}&quot;</span>
          )}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={680}
      destroyOnClose
    >
      <div className="grid grid-cols-3 gap-3 pt-2">
        {models.map((model) => {
          const meta = MODEL_META[model] ?? { label: model, short: "?", color: "#9ca3af", bg: "#f9fafb" };
          const previewCell = {
            span: 12,
            model,
            store: varName,
            placeholder: model === "el-input" || model === "el-textarea"
              ? previewStr
              : undefined,
            text: model === "el-switch" || model === "el-checkbox" || model === "el-radio"
              ? varName
              : undefined,
          };

          return (
            <button
              key={model}
              onClick={() => onSelect(model)}
              className="flex flex-col gap-2 p-4 rounded-xl border-2 border-slate-100
                hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30
                transition-all duration-150 cursor-pointer text-left bg-white"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.short}
                </span>
                <span className="text-xs font-medium text-slate-700">{meta.label}</span>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 min-h-[40px] flex items-center">
                <MiniPreview cell={previewCell} />
              </div>
            </button>
          );
        })}
      </div>

      {incompatible.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-[10px] text-slate-400">
            因默认值类型为 <strong className="text-slate-500">{valueType}</strong>，已自动隐藏不兼容控件：{incompatible.map((m) => MODEL_META[m]?.label ?? m).join("、")}
          </span>
        </div>
      )}
    </Modal>
  );
};

export default ComponentPickerModal;
```

- [ ] **Step 2: 验证编译**

```bash
cd D:/Code/el-snow-elves-react && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: 提交**

```bash
git add src/pages/task-editor/ComponentPickerModal.tsx
git commit -m "feat: add ComponentPickerModal for choosing control type with value-based filtering"
```

---

### Task 4: 重写 LayoutBuilder — 整体结构和左侧面板

**Files:**
- Modify: `src/pages/task-editor/LayoutBuilder.tsx`

完全重写。本 Task 创建新的骨架结构 + 左侧「待布局变量」面板。

- [ ] **Step 1: 重写 LayoutBuilder 为全新实现**

用 Write 工具完整重写 `src/pages/task-editor/LayoutBuilder.tsx`：

```tsx
import {
  useState, useCallback, useRef, useMemo,
  type FC, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent,
} from "react";
import { Button, Input, InputNumber, Select, Switch, Tooltip, Dropdown } from "antd";
import type { MenuProps } from "antd";
import type { Cell, CellModel, CellOption } from "@/types/task";
import { detectValueType } from "@/utils/type-compat";
import MiniPreview from "@/components/mini-preview/MiniPreview";
import ComponentPickerModal from "./ComponentPickerModal";

/* ── helpers ── */

function cloneLayout(l: Cell[][]): Cell[][] {
  return l.map((r) => r.map((c) => ({ ...c })));
}

function usedStores(layout: Cell[][]): Set<string> {
  const s = new Set<string>();
  for (const r of layout) for (const c of r) if (c.store) s.add(c.store);
  return s;
}

function rowUsedSpan(row: Cell[]): number {
  return row.reduce((s, c) => s + (c.span ?? 1), 0);
}

/* ── model display metadata ── */

const MODEL_META: Record<string, { label: string; short: string; color: string; bg: string }> = {
  "el-input":        { label: "文本输入", short: "Aa", color: "#6366f1", bg: "#eef2ff" },
  "el-input-number": { label: "数字输入", short: "12", color: "#10b981", bg: "#ecfdf5" },
  "el-switch":       { label: "开关",     short: "⇄",  color: "#f59e0b", bg: "#fffbeb" },
  "el-select":       { label: "下拉选择", short: "☰",  color: "#8b5cf6", bg: "#f5f3ff" },
  "el-textarea":     { label: "多行文本", short: "¶",  color: "#06b6d4", bg: "#ecfeff" },
  "el-checkbox":     { label: "复选框",   short: "☑",  color: "#ef4444", bg: "#fef2f2" },
  "el-checkbox-group":{ label: "多选组",  short: "☑☑",color: "#ec4899", bg: "#fdf2f8" },
  "el-radio":        { label: "单选组",   short: "◉",  color: "#f97316", bg: "#fff7ed" },
  "el-slider":       { label: "滑块",     short: "—",  color: "#6366f1", bg: "#eef2ff" },
  "el-date-picker":  { label: "日期选择", short: "📅", color: "#14b8a6", bg: "#f0fdfa" },
  "el-color-picker": { label: "颜色选择", short: "◐",  color: "#a855f7", bg: "#faf5ff" },
};

const OPTION_MODELS = new Set<CellModel>(["el-select", "el-checkbox-group", "el-radio"]);

const DEFAULT_CELL_SPAN = 12;

/* ── props ── */

export interface LayoutBuilderProps {
  initialLayout?: Cell[][];
  initialValues?: Record<string, unknown>;
  onConfirm?: (layout: Cell[][], values: Record<string, unknown>) => void;
  onCancel?: () => void;
}

/* ── sub: label ── */

const Lbl: FC<{ t: string }> = ({ t }) => (
  <span className="text-[11px] font-medium text-slate-500 block mb-1">{t}</span>
);

/* ── main ── */

const LayoutBuilder: FC<LayoutBuilderProps> = ({ initialLayout = [], initialValues = {}, onConfirm, onCancel }) => {
  const [layout, setLayout] = useState<Cell[][]>(() => cloneLayout(initialLayout));
  const [values, setValues] = useState<Record<string, unknown>>({ ...initialValues });

  // selection
  const [sel, setSel] = useState<{ ri: number; ci: number } | null>(null);
  const selCell = sel ? layout[sel.ri]?.[sel.ci] ?? null : null;

  // picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingVar, setPendingVar] = useState<{ name: string; value: unknown; ri: number; ci: number } | null>(null);

  // drag state
  const [dragOverPos, setDragOverPos] = useState<{ ri: number; ci: number } | null>(null);
  const [dragFromLeft, setDragFromLeft] = useState<{ key: string; value: unknown } | null>(null);

  // context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; ri: number; ci: number } | null>(null);

  /* ── computed ── */

  const unboundVars = useMemo(() => {
    const used = usedStores(layout);
    return Object.entries(values)
      .filter(([k]) => !used.has(k))
      .map(([k, v]) => ({ key: k, value: v, type: detectValueType(v) }));
  }, [values, layout]);

  /* ── layout ops ── */

  const applyLayout = useCallback((l: Cell[][]) => setLayout(l), []);

  const addCell = useCallback((ri: number, ci: number, store: string, model: CellModel) => {
    setLayout((prev) => {
      const next = cloneLayout(prev);
      if (!next[ri]) {
        // new row
        next.push([{ span: DEFAULT_CELL_SPAN, model, store }]);
        return next;
      }
      const cell: Cell = { span: DEFAULT_CELL_SPAN, model, store };
      next[ri].splice(ci, 0, cell);
      return next;
    });
  }, []);

  const updateCell = useCallback((ri: number, ci: number, patch: Partial<Cell>) => {
    setLayout((prev) => {
      const next = cloneLayout(prev);
      if (next[ri]) next[ri][ci] = { ...next[ri][ci], ...patch };
      return next;
    });
  }, []);

  const removeCell = useCallback((ri: number, ci: number) => {
    setLayout((prev) => {
      const next = cloneLayout(prev);
      next[ri] = next[ri].filter((_, j) => j !== ci);
      return next.filter((r) => r.length > 0);
    });
    setSel(null);
  }, []);

  const moveCell = useCallback((fromRi: number, fromCi: number, toRi: number, toCi: number) => {
    setLayout((prev) => {
      const next = cloneLayout(prev);
      const cell = next[fromRi][fromCi];
      next[fromRi].splice(fromCi, 1);
      if (next[fromRi].length === 0) next.splice(fromRi, 1);
      // adjust target indices if from row was removed
      const adjustedRi = fromRi < toRi || (fromRi === toRi && fromCi < toCi) ? toRi : toRi;
      let adjustedCi = toCi;
      if (fromRi === toRi && fromCi < toCi) adjustedCi = toCi - 1;
      if (!next[adjustedRi]) next[adjustedRi] = [];
      next[adjustedRi].splice(adjustedCi, 0, cell);
      return next;
    });
    setSel({ ri: toRi, ci: toCi });
  }, []);

  const addRow = useCallback(() => {
    setLayout((prev) => [...cloneLayout(prev), []]);
  }, []);

  const deleteRow = useCallback((ri: number) => {
    setLayout((prev) => cloneLayout(prev).filter((_, i) => i !== ri));
    if (sel?.ri === ri) setSel(null);
  }, [sel]);

  /* ── picker callback ── */

  const handlePickerSelect = useCallback((model: CellModel) => {
    if (pendingVar) {
      addCell(pendingVar.ri, pendingVar.ci, pendingVar.name, model);
    }
    setPickerOpen(false);
    setPendingVar(null);
  }, [pendingVar, addCell]);

  /* ── drop handler ── */

  const handleDrop = useCallback((ri: number, ci: number, e: ReactDragEvent) => {
    e.preventDefault();
    const key = e.dataTransfer.getData("text/plain");
    if (!key) return;
    const val = values[key];
    if (val === undefined) return;
    setPendingVar({ name: key, value: val, ri, ci });
    setPickerOpen(true);
    setDragOverPos(null);
  }, [values]);

  const handleDragOver = useCallback((ri: number, e: ReactDragEvent) => {
    e.preventDefault();
    const row = layout[ri];
    const used = row ? rowUsedSpan(row) : 0;
    const remaining = 24 - used;
    if (remaining >= DEFAULT_CELL_SPAN) {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }, [layout]);

  /* ── context menu ── */

  const handleContextMenu = useCallback((ri: number, ci: number, e: ReactMouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, ri, ci });
    setSel({ ri, ci });
  }, []);

  const ctxMenuItems: MenuProps["items"] = useMemo(() => {
    if (!ctxMenu) return [];
    const { ri, ci } = ctxMenu;
    const cell = layout[ri]?.[ci];
    if (!cell) return [];

    return [
      {
        key: "changeModel",
        label: "更换控件",
        onClick: () => {
          setPendingVar({ name: cell.store ?? "", value: values[cell.store ?? ""] ?? "", ri, ci });
          setPickerOpen(true);
          setCtxMenu(null);
        },
      },
      { type: "divider" as const },
      {
        key: "span6", label: "宽度 6",
        onClick: () => { updateCell(ri, ci, { span: 6 }); setCtxMenu(null); },
      },
      {
        key: "span8", label: "宽度 8",
        onClick: () => { updateCell(ri, ci, { span: 8 }); setCtxMenu(null); },
      },
      {
        key: "span12", label: "宽度 12",
        onClick: () => { updateCell(ri, ci, { span: 12 }); setCtxMenu(null); },
      },
      {
        key: "span24", label: "宽度 24",
        onClick: () => { updateCell(ri, ci, { span: 24 }); setCtxMenu(null); },
      },
      { type: "divider" as const },
      {
        key: "remove",
        label: "移除",
        danger: true,
        onClick: () => { removeCell(ri, ci); setCtxMenu(null); },
      },
    ];
  }, [ctxMenu, layout, values, updateCell, removeCell]);

  /* ── cell drag (within grid) ── */

  const handleCellDragStart = useCallback((ri: number, ci: number, e: ReactDragEvent) => {
    e.dataTransfer.setData("application/layout-move", JSON.stringify({ ri, ci }));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleCellDrop = useCallback((toRi: number, toCi: number, e: ReactDragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/layout-move");
    if (!raw) return;
    const { ri: fromRi, ci: fromCi } = JSON.parse(raw);
    if (fromRi === toRi && fromCi === toCi) return;
    moveCell(fromRi, fromCi, toRi, toCi);
  }, [moveCell]);

  /* ── confirm ── */

  const handleConfirm = () => {
    const final = cloneLayout(layout).filter((r) => r.length > 0);
    const used = usedStores(final);
    const finalVals: Record<string, unknown> = {};
    for (const k of used) finalVals[k] = values[k] ?? "";
    onConfirm?.(final, finalVals);
  };

  /* ── editor: field render ── */

  const renderField = (ri: number, ci: number, cell: Cell, field: string) => {
    const val = (cell as any)[field];
    const set = (v: any) => updateCell(ri, ci, { [field]: v === undefined || v === "" || v === false ? undefined : v });

    switch (field) {
      case "text":
        return <div key="text"><Lbl t="标签"/><Input size="small" className="text-xs" value={val ?? ""} placeholder="控件标签" onChange={(e) => set(e.target.value || undefined)}/></div>;
      case "placeholder":
        return <div key="ph"><Lbl t="占位提示"/><Input size="small" className="text-xs" value={val ?? ""} placeholder="placeholder" onChange={(e) => set(e.target.value || undefined)}/></div>;
      case "disabled":
        return <div key="dis"><Lbl t="禁用"/><Switch size="small" checked={val ?? false} onChange={set}/></div>;
      case "min":
        return <div key="min"><Lbl t="最小值"/><InputNumber size="small" className="w-full" value={val ?? undefined} placeholder="不限" onChange={(v) => set(v ?? undefined)}/></div>;
      case "max":
        return <div key="max"><Lbl t="最大值"/><InputNumber size="small" className="w-full" value={val ?? undefined} placeholder="不限" onChange={(v) => set(v ?? undefined)}/></div>;
      case "step":
        return <div key="step"><Lbl t="步长"/><InputNumber size="small" className="w-full" value={val ?? undefined} placeholder="1" onChange={(v) => set(v ?? undefined)}/></div>;
      case "rows":
        return <div key="rows"><Lbl t="行数"/><InputNumber size="small" className="w-full" min={1} value={val ?? 4} onChange={(v) => updateCell(ri, ci, { rows: v ?? 4 })}/></div>;
      case "allowClear":
        return <div key="ac"><Lbl t="可清除"/><Switch size="small" checked={val ?? false} onChange={set}/></div>;
      case "maxLength":
        return <div key="ml"><Lbl t="最大长度"/><InputNumber size="small" className="w-full" min={0} value={val} placeholder="不限" onChange={(v) => set(v ?? undefined)}/></div>;
      case "mode":
        return <div key="mode"><Lbl t="多选"/><Switch size="small" checked={val === "multiple"} onChange={(v) => set(v ? "multiple" : undefined)}/></div>;
      case "optionType":
        return <div key="ot"><Lbl t="样式"/><Select size="small" className="w-full" value={val} allowClear placeholder="默认" options={[{value:"default",label:"默认"},{value:"button",label:"按钮"}]} onChange={(v) => set(v || undefined)}/></div>;
      case "format":
        return <div key="fmt"><Lbl t="日期格式"/><Input size="small" className="text-xs" value={val ?? ""} placeholder="YYYY-MM-DD" onChange={(e) => set(e.target.value || undefined)}/></div>;
      default: return null;
    }
  };

  const modelFields: Record<string, string[]> = {
    "el-input":        ["text","placeholder","disabled","maxLength","allowClear"],
    "el-input-number": ["text","placeholder","disabled","min","max","step"],
    "el-select":       ["text","placeholder","disabled","mode","allowClear"],
    "el-textarea":     ["text","placeholder","disabled","rows","maxLength"],
    "el-slider":       ["text","disabled","min","max","step"],
    "el-switch":       ["text","disabled"],
    "el-checkbox":     ["text","disabled"],
    "el-checkbox-group":["text","disabled"],
    "el-radio":        ["text","disabled","optionType"],
    "el-date-picker":  ["text","placeholder","disabled","format"],
    "el-color-picker": ["text","disabled"],
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div className="flex gap-4 select-none" style={{ minHeight: 480, maxHeight: "calc(100vh - 200px)" }}>

      {/* ═══ LEFT: 待布局变量 ═══ */}
      <div className="w-[200px] shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-slate-700">待布局</span>
            <span className="text-[10px] text-slate-400 ml-auto bg-slate-200 px-1.5 py-0.5 rounded-full">
              {unboundVars.length}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {unboundVars.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[11px] text-slate-300 text-center px-2">
              所有变量已布局
            </div>
          ) : (
            unboundVars.map(({ key, value, type }) => {
              const typeIcon = type === "number" ? "#" : type === "boolean" ? "⇄" : "Aa";
              const typeColor = type === "number" ? "#10b981" : type === "boolean" ? "#f59e0b" : "#6366f1";
              const valStr = value === null || value === undefined ? "" : String(value);

              return (
                <div
                  key={key}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", key);
                    e.dataTransfer.effectAllowed = "move";
                    setDragFromLeft({ key, value });
                  }}
                  onDragEnd={() => setDragFromLeft(null)}
                  className="flex flex-col gap-1 px-3 py-2.5 rounded-lg border border-slate-100
                    bg-white hover:border-indigo-200 hover:shadow-sm cursor-grab active:cursor-grabbing
                    transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: typeColor }}>
                      {typeIcon}
                    </span>
                    <code className="text-[11px] font-medium text-slate-700 truncate">{key}</code>
                  </div>
                  {valStr && (
                    <span className="text-[10px] text-slate-400 truncate pl-7">{valStr}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="px-2 py-2 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[10px] text-slate-400">拖入右侧布局区即可添加</span>
        </div>
      </div>

      {/* ═══ RIGHT: 布局画布 ═══ */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        {/* toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <span className="text-xs font-semibold text-slate-700">布局画布</span>
          <span className="text-[10px] text-slate-400">
            {layout.reduce((s, r) => s + r.length, 0)} 控件 · {layout.length} 行
          </span>
          <div className="flex-1" />
          <Button size="small" onClick={addRow} className="text-[11px]">+ 添加行</Button>
        </div>

        {/* grid area */}
        <div
          className="flex-1 overflow-y-auto p-4 bg-slate-50/30"
          onClick={() => { setSel(null); setCtxMenu(null); }}
        >
          {layout.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <span className="text-2xl">⊞</span>
              </div>
              <span className="text-xs">从左侧拖拽变量到此处开始构建布局</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {layout.map((row, ri) => {
                const totalSpan = rowUsedSpan(row);
                const remaining = 24 - totalSpan;
                const canDrop = remaining >= DEFAULT_CELL_SPAN;

                return (
                  <div
                    key={ri}
                    className={`rounded-xl border-2 transition-all duration-150 bg-white
                      ${dragOverPos?.ri === ri ? "border-indigo-300 shadow-lg shadow-indigo-100/50" : "border-slate-200 shadow-sm"}`}
                    onDragOver={(e) => handleDragOver(ri, e)}
                    onDrop={(e) => handleDrop(ri, row.length, e)}
                    onDragEnter={() => setDragOverPos({ ri, ci: row.length })}
                    onDragLeave={() => setDragOverPos(null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* row header */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-[10px] bg-slate-50/80 border-b border-slate-100">
                      <span className="w-5 h-5 rounded-md bg-slate-200 text-[10px] font-bold text-slate-500 flex items-center justify-center">
                        {ri + 1}
                      </span>
                      <span className={`text-[10px] font-mono font-medium ${totalSpan === 24 ? "text-emerald-500" : totalSpan > 24 ? "text-red-400" : "text-slate-400"}`}>
                        {totalSpan}/24
                      </span>
                      {totalSpan > 24 && <span className="text-[9px] text-red-400">溢出</span>}
                      {!canDrop && remaining > 0 && (
                        <span className="text-[9px] text-amber-500">空间不足</span>
                      )}
                      <div className="flex-1" />
                      <Button type="text" size="small" danger className="!text-[10px] !p-0 !w-5 !h-5"
                        onClick={(e) => { e.stopPropagation(); deleteRow(ri); }}>
                        ×
                      </Button>
                    </div>

                    {/* cells */}
                    <div
                      className="relative flex items-stretch"
                      style={{ minHeight: 64, display: "grid", gridTemplateColumns: "repeat(24, 1fr)" }}
                    >
                      {row.map((cell, ci) => {
                        const span = cell.span ?? 1;
                        const meta = MODEL_META[cell.model ?? "el-input"] ?? MODEL_META["el-input"];
                        const isSel = sel?.ri === ri && sel?.ci === ci;

                        return (
                          <div
                            key={ci}
                            draggable
                            onDragStart={(e) => handleCellDragStart(ri, ci, e)}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => handleCellDrop(ri, ci, e)}
                            onContextMenu={(e) => handleContextMenu(ri, ci, e)}
                            onClick={(e) => { e.stopPropagation(); setSel({ ri, ci }); }}
                            className={`relative rounded-lg border-2 transition-all duration-150 cursor-pointer
                              flex flex-col justify-center px-2.5 py-1.5 min-w-0 overflow-hidden
                              ${isSel
                                ? "border-indigo-400 shadow-md shadow-indigo-200/50 z-10"
                                : "border-transparent hover:border-slate-300"}`}
                            style={{
                              gridColumn: `span ${span}`,
                              backgroundColor: isSel ? "#f8f9ff" : meta.bg,
                            }}
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l" style={{ backgroundColor: meta.color }} />
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[9px] font-semibold text-slate-600 truncate">{meta.label}</span>
                              <span className="text-[8px] text-slate-400 ml-auto shrink-0">{span}c</span>
                            </div>
                            {cell.store && (
                              <code className="text-[10px] font-medium text-indigo-600 truncate">{`{${cell.store}}`}</code>
                            )}
                            <div className="mt-0.5 scale-[0.85] origin-left pointer-events-none">
                              <MiniPreview cell={cell} />
                            </div>
                            {isSel && (
                              <button
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-100
                                  hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center
                                  text-[10px] transition-colors"
                                onClick={(e) => { e.stopPropagation(); removeCell(ri, ci); }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* empty space / drop zone */}
                      {remaining > 0 && (
                        <div
                          className={`border rounded-lg flex items-center justify-center transition-colors
                            ${canDrop && dragFromLeft
                              ? "border-dashed border-indigo-300 bg-indigo-50/40 text-indigo-400"
                              : "border-dashed border-slate-200 text-slate-300"}`}
                          style={{ gridColumn: `span ${remaining}`, minHeight: 48 }}
                          onDrop={(e) => handleDrop(ri, row.length, e)}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <span className="text-[10px]">
                            {canDrop ? "拖入此处" : `仅余 ${remaining} 列`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── editor panel (bottom dock) ── */}
        {selCell && (
          <div
            className="border-t-2 border-indigo-200 bg-white px-4 py-3"
            style={{ maxHeight: 240, overflowY: "auto" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_META[selCell.model ?? "el-input"]?.color }} />
              <span className="text-xs font-semibold text-slate-700">
                {MODEL_META[selCell.model ?? "el-input"]?.label ?? "控件"}
              </span>
              <span className="text-[10px] text-slate-400">
                行 {sel!.ri + 1} · 格 {(sel!.ci ?? 0) + 1}
              </span>
              <div className="flex-1" />
              <Button type="text" size="small" danger className="!text-[10px]"
                onClick={() => removeCell(sel!.ri, sel!.ci!)}>删除</Button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-2">
              <div>
                <Lbl t="变量名"/>
                <Input size="small" className="text-xs" value={selCell.store ?? ""} readOnly/>
              </div>
              <div>
                <Lbl t="宽度"/>
                <InputNumber size="small" className="w-full" min={1} max={24}
                  value={selCell.span ?? DEFAULT_CELL_SPAN}
                  onChange={(v) => updateCell(sel!.ri, sel!.ci!, { span: v ?? DEFAULT_CELL_SPAN })}/>
              </div>
              <div>
                <Lbl t="默认值"/>
                <Input size="small" className="text-xs"
                  value={selCell.store ? (typeof values[selCell.store] === "string" ? values[selCell.store] as string : JSON.stringify(values[selCell.store])) : ""}
                  readOnly/>
              </div>
              <div className="flex items-end pb-0.5">
                <Button size="small" onClick={() => {
                  setPendingVar({ name: selCell.store ?? "", value: values[selCell.store ?? ""] ?? "", ri: sel!.ri, ci: sel!.ci! });
                  setPickerOpen(true);
                }}>换控件</Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {(modelFields[selCell.model ?? "el-input"] ?? []).map((f) => renderField(sel!.ri, sel!.ci!, selCell, f))}
            </div>

            {OPTION_MODELS.has(selCell.model ?? "el-input") && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-medium text-slate-500">选项列表</span>
                  <Button type="dashed" size="small" className="text-[10px]"
                    onClick={() => {
                      const opts = [...(selCell.options ?? []), { label: "", value: "" }];
                      updateCell(sel!.ri, sel!.ci!, { options: opts });
                    }}>
                    + 添加
                  </Button>
                </div>
                <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                  {(selCell.options ?? []).length === 0 && (
                    <span className="text-[10px] text-slate-400">暂无选项</span>
                  )}
                  {(selCell.options ?? []).map((opt: CellOption, oi: number) => (
                    <div key={oi} className="flex items-center gap-2">
                      <Input size="small" placeholder="标签" className="flex-1 text-xs"
                        value={opt.label}
                        onChange={(e) => {
                          const opts = (selCell.options ?? []).map((o, i) => i === oi ? { ...o, label: e.target.value } : o);
                          updateCell(sel!.ri, sel!.ci!, { options: opts });
                        }}/>
                      <Input size="small" placeholder="值" className="flex-1 text-xs"
                        value={typeof opt.value === "number" ? String(opt.value) : opt.value}
                        onChange={(e) => {
                          const opts = (selCell.options ?? []).map((o, i) => i === oi ? { ...o, value: e.target.value } : o);
                          updateCell(sel!.ri, sel!.ci!, { options: opts });
                        }}/>
                      <Button type="text" size="small" className="!text-slate-300 hover:!text-red-500"
                        onClick={() => {
                          updateCell(sel!.ri, sel!.ci!, { options: (selCell.options ?? []).filter((_, i) => i !== oi) });
                        }}>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* bottom bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 rounded-br-xl shrink-0">
          <div className="flex-1" />
          <Button size="small" onClick={onCancel}>取消</Button>
          <Button type="primary" size="small" onClick={handleConfirm}>保存布局</Button>
        </div>
      </div>

      {/* ═══ ComponentPickerModal ═══ */}
      <ComponentPickerModal
        open={pickerOpen}
        varName={pendingVar?.name ?? ""}
        varValue={pendingVar?.value ?? ""}
        onSelect={handlePickerSelect}
        onCancel={() => { setPickerOpen(false); setPendingVar(null); }}
      />

      {/* ═══ Context Menu ═══ */}
      {ctxMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setCtxMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setCtxMenu(null); }}
        >
          <div
            className="absolute z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[140px]"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            {ctxMenuItems.map((item: any) => {
              if (item.type === "divider") return <div key={item.type + Math.random()} className="h-px bg-slate-100 my-1" />;
              return (
                <button
                  key={item.key}
                  className={`w-full text-left px-4 py-1.5 text-xs hover:bg-slate-50 transition-colors
                    ${item.danger ? "text-red-500 hover:bg-red-50" : "text-slate-700"}`}
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutBuilder;
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd D:/Code/el-snow-elves-react && npx tsc --noEmit
```

Expected: No errors. Fix any type issues.

- [ ] **Step 3: 启动开发服务器验证 UI**

```bash
cd D:/Code/el-snow-elves-react && npm run dev
```

- 打开任务编辑器，点击「变量编辑」
- 验证左侧「待布局变量」面板正确显示未绑定的变量
- 验证拖拽变量到右侧布局区触发了控件选择弹窗
- 验证弹窗按默认值类型过滤
- 验证布局内拖拽排序功能
- 验证右键菜单

- [ ] **Step 4: 提交**

```bash
git add src/pages/task-editor/LayoutBuilder.tsx
git commit -m "feat: rewrite LayoutBuilder with dual-panel drag-and-drop variable layout"
```

---

### Task 5: 最终验证和收尾

- [ ] **Step 1: 完整流程测试**

在浏览器中执行完整流程：
1. 打开任务 → 点击「变量编辑」
2. 确认左侧显示 `values` 中未布局的变量
3. 拖拽变量到右侧布局区 → 弹窗出现 → 按类型过滤
4. 选择控件 → 变量加入布局，span = 12
5. 拖拽另一个变量到同一行 → 两个各占 12
6. 尝试拖入第三个变量 → 空间不足，拖入被拒绝
7. 拖拽布局内的卡片换位
8. 右键卡片 → 更换控件 / 调整宽度 / 移除
9. 点击卡片 → 底部编辑面板编辑属性
10. 保存布局 → 确认 `onConfirm` 回调正确

- [ ] **Step 2: 修复任何发现的问题**

- [ ] **Step 3: 提交最终修复**

```bash
git add -A
git commit -m "fix: polish variable layout drag-and-drop interactions"
```
