import { useState, type FC } from "react";
import { AutoComplete, Button, Input, InputNumber, Select, Tooltip } from "antd";
import { CloseOutlined, DeleteOutlined, LeftOutlined } from "@ant-design/icons";
import type { Step } from "@/types/task";
import type { EditorCtx } from "./constants";
import { ACTION_OPTS, ACTIONS_WITH_TEMPLATES, ACTION_PARAMS, PARAM_META, PLAIN_VALUE_PARAMS } from "./constants";
import SubflowModalItem from "./SubflowModalItem";
import PosInput from "./PosInput";
import CoordPickerModal from "@/components/coord-picker/CoordPickerModal";

/* ================================================================
   StepPanel — dashboard + single-expand editing panel
   ================================================================ */

interface Props {
  stepName: string; step: Step; isCommon: boolean; ctx: EditorCtx;
  onClose: () => void; onRename: (name: string) => void;
  onUpdate: (field: string, value: unknown) => void; onDelete: () => void;
}

// ---- Card registry ----

type CardKey = "flow" | "params" | "prefix" | "postfix" | "failure_extra" | "success_extra" | "set" | "retry" | "extends";

const CARDS: { key: CardKey; label: string; color: string; light: string; desc: string; summary(s: Step): string }[] = [
  { key: "flow",   label: "流程跳转", color: "#16a34a", light: "#dcfce7", desc: "成功 / 失败 / 无条件",
    summary: s => [s.success && `✓${s.success}`, s.failure && `✗${s.failure}`, s.next && `→${s.next}`].filter(Boolean).join("  ") || "" },
  { key: "params", label: "执行参数", color: "#ca8a04", light: "#fef9c3", desc: "模板图片 / 阈值 / 坐标",
    summary: s => { const n = ((s.params?.args as string[]) ?? []).length + Object.keys(s.params ?? {}).filter(k => k !== "args").length; return n ? `${n} 个参数` : ""; } },
  { key: "prefix", label: "前置步骤", color: "#16a34a", light: "#dcfce7", desc: "主步骤前执行",
    summary: s => s.prefix?.length ? `${s.prefix.length} 个` : "" },
  { key: "postfix",label: "后置步骤", color: "#f59e0b", light: "#fef3c7", desc: "主步骤后执行",
    summary: s => s.postfix?.length ? `${s.postfix.length} 个` : "" },
  { key: "failure_extra", label: "失败附加", color: "#dc2626", light: "#fecaca", desc: "失败时额外执行",
    summary: s => s.failure_extra?.length ? `${s.failure_extra.length} 个` : "" },
  { key: "success_extra", label: "成功附加", color: "#2563eb", light: "#bfdbfe", desc: "成功时额外执行",
    summary: s => s.success_extra?.length ? `${s.success_extra.length} 个` : "" },
  { key: "set",    label: "set 变量", color: "#9333ea", light: "#e9d5ff", desc: "设置运行时变量",
    summary: s => s.set?.length ? `${s.set.length} 个` : "" },
  { key: "retry",  label: "失败重试", color: "#dc2626", light: "#fecaca", desc: "失败后自动重试",
    summary: s => s.retry?.times ? `${s.retry.times}次 · ${s.retry.interval ?? 0}ms` : "" },
  { key: "extends",label: "继承模板", color: "#8b5cf6", light: "#ddd6fe", desc: "复用已有步骤配置",
    summary: s => s.extends || "" },
];

// ---- Inline sub-editors ----

const FlowEditor: FC<{ step: Step; stepKeys: string[]; stepName: string; onUpdate: Props["onUpdate"] }> =
  ({ step, stepKeys, stepName, onUpdate }) => {
    const items = [
      { k: "success" as const, label: "成功", hint: "执行成功", color: "#16a34a", bg: "#f0fdf4" },
      { k: "failure" as const, label: "失败", hint: "执行失败", color: "#dc2626", bg: "#fef2f2" },
      { k: "next"    as const, label: "无条件", hint: "无论结果", color: "#6b7280", bg: "#f9fafb" },
    ];
    return (
      <div className="space-y-2">
        {items.map(({ k, label, hint, color, bg }) => (
          <div key={k} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#eef0f2] bg-white hover:border-[#dde0e6] transition-colors">
            <div className="flex items-center gap-1.5 shrink-0 w-[72px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[11px] font-medium text-[#374151]">{label}</span>
              <span className="text-[10px] text-[#c0c4cc]">{hint}</span>
            </div>
            <Select className="flex-1" size="small" allowClear showSearch
              placeholder="选择目标步骤" popupMatchSelectWidth={false}
              value={(step as any)[k] || undefined}
              options={stepKeys.filter(sk => sk !== stepName).map(sk => ({ value: sk, label: sk }))}
              onChange={(v) => onUpdate(k, v ?? "")} />
          </div>
        ))}
      </div>
    );
  };

const ParamsEditor: FC<{ step: Step; ctx: EditorCtx; onUpdate: Props["onUpdate"] }> = ({ step, ctx, onUpdate }) => {
  const [coordOpen, setCoordOpen] = useState(false);
  const params = step.params ?? {};
  const args = (params.args as string[]) ?? [];
  const other = Object.keys(params).filter(k => k !== "args");
  const showArgs = step.action ? ACTIONS_WITH_TEMPLATES.has(step.action) : false;
  const allowed = step.action ? (ACTION_PARAMS[step.action] ?? []) : [];
  const canAdd = allowed.filter(k => !params[k]);

  return (
    <div className="space-y-2.5">
      {showArgs && (
        <div className="rounded-lg border border-[#eef0f2] bg-white p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0" />
            <span className="text-[11px] font-medium text-[#374151]">模板图片</span>
            <code className="text-[10px] text-[#c0c4cc]">args</code>
          </div>
          <Select mode="tags" className="w-full" size="small" placeholder="输入图片名回车添加" value={args}
            onChange={(v) => onUpdate("params", { ...params, args: v })} />
        </div>
      )}
      {other.map(key => {
        const meta = PARAM_META[key];
        const raw = typeof params[key] === "string" ? params[key] as string : JSON.stringify(params[key]);
        return (
          <div key={key} className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eef0f2] bg-white hover:border-[#dde0e6] transition-colors">
            <span className="text-[11px] font-medium text-[#6b7280] w-[72px] shrink-0 truncate">{meta?.label ?? key}</span>
            <div className="flex-1 flex items-center">
              {PLAIN_VALUE_PARAMS.has(key) ? (
                key === "pos" ? (
                  <PosInput params={params} onUpdate={onUpdate} hwnd={ctx.hwnd} onCoordOpen={() => setCoordOpen(true)} />
                ) : (
                  <Input size="small" variant="borderless" className="flex-1 text-[12px]" placeholder={key === "box" ? "[x,y,w,h]" : ""}
                    value={raw} onChange={(e) => {
                      let v: unknown = e.target.value; const n = Number(v);
                      if (v !== "" && !isNaN(n)) v = n;
                      onUpdate("params", { ...params, [key]: v });
                    }} />
                )
              ) : (
                <AutoComplete className="flex-1" size="small" variant="borderless" value={raw}
                  options={ctx.variableOptions}
                  filterOption={(iv, opt) => opt?.label?.toLowerCase().includes(iv.toLowerCase()) ?? false}
                  onChange={(v) => {
                    let val: unknown = v; const n = Number(v);
                    if (v !== "" && !isNaN(n)) val = n;
                    onUpdate("params", { ...params, [key]: val });
                  }} />
              )}
            </div>
            <button onClick={() => { const p = { ...params }; delete p[key]; onUpdate("params", p); }}
              className="text-[#c0c4cc] hover:text-[#ff4d4f] opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1">×</button>
          </div>
        );
      })}
      {canAdd.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center pt-1">
          <span className="text-[10px] text-[#c0c4cc] mr-1">添加参数</span>
          {canAdd.map(k => {
            const meta = PARAM_META[k];
            return (
              <button key={k} onClick={() => onUpdate("params", { ...params, [k]: "" })}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-dashed border-[#d0d5dd] text-[#6b7280] hover:text-[#1677ff] hover:border-[#1677ff] hover:bg-[#eff6ff] transition-colors">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta?.color ?? "#9ca3af" }} />
                {meta?.label ?? k}
              </button>
            );
          })}
        </div>
      )}
      {ctx.hwnd && <CoordPickerModal open={coordOpen} hwnd={ctx.hwnd}
        onClose={() => setCoordOpen(false)}
        onPick={(x, y) => onUpdate("params", { ...params, pos: [x, y] })} />}
    </div>
  );
};

const SubListEditor: FC<{
  list: any[]; ctx: EditorCtx; isKeyValue?: boolean; onChange: (v: any[]) => void;
}> = ({ list, ctx, isKeyValue, onChange }) => {
  const arr = list ?? [];
  return (
    <div className="space-y-2">
      {arr.map((item, i) => isKeyValue ? (
        <div key={i} className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eef0f2] bg-white hover:border-[#dde0e6] transition-colors">
          <span className="w-5 h-5 rounded-full bg-[#eef2ff] flex items-center justify-center text-[10px] font-semibold text-[#1677ff] shrink-0">{i + 1}</span>
          <Input size="small" variant="borderless" placeholder="变量名" className="flex-1 font-medium text-[12px]" value={item.name}
            onChange={(e) => { const u = [...arr]; u[i] = { ...u[i], name: e.target.value }; onChange(u); }} />
          <span className="text-[10px] text-[#c0c4cc]">=</span>
          <AutoComplete className="flex-1" size="small" variant="borderless" placeholder="值" value={item.value as string}
            options={ctx.variableOptions}
            filterOption={(iv, opt) => opt?.label?.toLowerCase().includes(iv.toLowerCase()) ?? false}
            onChange={(v) => { const u = [...arr]; u[i] = { ...u[i], value: v }; onChange(u); }} />
          <button onClick={() => onChange(arr.filter((_, j) => j !== i))}
            className="text-[#c0c4cc] hover:text-[#ff4d4f] opacity-0 group-hover:opacity-100 transition-all shrink-0">×</button>
        </div>
      ) : (
        <SubflowModalItem key={i} index={i} item={item} ctx={ctx} arr={arr} onChange={onChange} />
      ))}
      <button onClick={() => onChange([...arr, isKeyValue ? { name: "", value: "" } : { step: "" }])}
        className="flex items-center justify-center gap-1 w-full text-[11px] text-[#8b8fa3] hover:text-[#1677ff] hover:bg-[#eef2ff] py-2 rounded-lg border border-dashed border-[#d0d5dd] hover:border-[#1677ff] transition-colors">
        ＋ 添加{isKeyValue ? "变量" : "步骤"}
      </button>
    </div>
  );
};

// ---- Main ----

const StepPanel: FC<Props> = ({ stepName, step, isCommon, ctx, onClose, onRename, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState<CardKey | null>(null);
  const [nameEdit, setNameEdit] = useState(false);
  const [nameDraft, setNameDraft] = useState(stepName);

  const card = expanded ? CARDS.find(c => c.key === expanded)! : null;

  return (
    <div className="flex flex-col h-full bg-[#fafbfc]">
      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-3 flex items-center gap-2 bg-white border-b border-[#eef0f2]">
        {isCommon && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#fff7e6] text-[#f59e0b] font-semibold tracking-wide shrink-0">公共</span>
        )}
        {nameEdit ? (
          <Input size="small" autoFocus className="!font-semibold flex-1" value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={() => { if (nameDraft && nameDraft !== stepName) onRename(nameDraft); setNameEdit(false); }}
            onPressEnter={() => { if (nameDraft && nameDraft !== stepName) onRename(nameDraft); setNameEdit(false); }} />
        ) : (
          <h3 className="flex-1 min-w-0 text-sm font-semibold text-[#1a1a2e] truncate cursor-pointer select-none"
            onDoubleClick={() => { setNameDraft(stepName); setNameEdit(true); }}
            title="双击重命名">{stepName}</h3>
        )}
        <Tooltip title="删除步骤"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onDelete} /></Tooltip>
        <Tooltip title="关闭面板"><Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} /></Tooltip>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Basic info */}
        <div className="rounded-xl border border-[#eef0f2] bg-white p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-[#1677ff]" />
            <span className="text-[11px] font-semibold text-[#1a1a2e]">基础</span>
          </div>
          <Select className="w-full" size="small" allowClear showSearch placeholder="选择动作…"
            value={step.action || undefined} popupMatchSelectWidth={false}
            onChange={v => onUpdate("action", v ?? "")}
            options={ACTION_OPTS.map(o => ({
              ...o, label: <span className="flex items-center gap-2">
                <code className="text-[11px] font-semibold text-[#1a1a2e] bg-[#f0f2f5] px-1.5 py-0.5 rounded">{o.label}</code>
                <span className="text-[11px] text-[#8b8fa3]">{o.desc}</span></span>,
            }))} />
          <Input size="small" placeholder="步骤说明…" value={step.description || ""}
            onChange={e => onUpdate("description", e.target.value || undefined)} />
        </div>

        {/* Dashboard or Expanded */}
        {expanded === null ? (
          /* ── Dashboard ── */
          <div className="grid grid-cols-2 gap-2">
            {CARDS.map(c => {
              const s = c.summary(step);
              const on = s !== "";
              return (
                <button key={c.key} onClick={() => setExpanded(c.key)}
                  className={`group flex flex-col gap-2 px-3.5 py-3 rounded-xl border border-solid text-left transition-all duration-150 outline-none
                    focus-visible:ring-2 focus-visible:ring-[#1677ff]/20
                    ${on
                      ? "border-[#eef0f2] bg-white hover:border-[#d0d5dd] hover:shadow-sm"
                      : "border-dashed border-[#dde0e6] bg-white/50 hover:border-[#1677ff] hover:bg-[#f0f5ff]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: on ? c.color : "#d0d5dd" }} />
                      <span className="text-[11px] font-semibold text-[#1a1a2e]">{c.label}</span>
                    </div>
                    {on && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: c.light, color: c.color }}>
                        <span className="text-[8px] leading-none font-bold">●</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center min-w-0">
                    <span className={`text-[10px] leading-tight truncate w-full ${on ? "text-[#6b7280]" : "text-[#c0c4cc]"}`}>
                      {on ? s : c.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── Expanded section ── */
          <div className="rounded-xl border border-[#eef0f2] bg-white overflow-hidden">
            {/* Section header with back button */}
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: card.light }}>
              <button onClick={() => setExpanded(null)}
                className="inline-flex items-center gap-0.5 text-[11px] leading-none font-medium transition-colors hover:opacity-70 shrink-0 outline-none border-0 bg-transparent cursor-pointer"
                style={{ color: card.color }}>
                <LeftOutlined className="text-[10px] leading-none align-middle" />
                <span>仪表盘</span>
              </button>
              <span className="text-[10px] leading-none opacity-40" style={{ color: card.color }}>|</span>
              <span className="text-[11px] leading-none font-semibold" style={{ color: card.color }}>{card.label}</span>
              <span className="text-[10px] leading-none text-[#8b8fa3] ml-auto">{card.desc}</span>
            </div>
            {/* Section body */}
            <div className="p-4">
                {expanded === "flow" && (
                  <FlowEditor step={step} stepKeys={ctx.stepKeys} stepName={stepName} onUpdate={onUpdate} />
                )}
                {expanded === "params" && (
                  <ParamsEditor step={step} ctx={ctx} onUpdate={onUpdate} />
                )}
                {(expanded === "prefix" || expanded === "postfix" || expanded === "failure_extra" || expanded === "success_extra") && (
                  <SubListEditor list={(step as any)[expanded] ?? []} ctx={ctx}
                    onChange={(v) => onUpdate(expanded, v)} />
                )}
                {expanded === "set" && (
                  <SubListEditor list={step.set ?? []} ctx={ctx} isKeyValue
                    onChange={(v) => onUpdate("set", v)} />
                )}
                {expanded === "retry" && (
                  <div className="rounded-lg border border-[#eef0f2] overflow-hidden">
                    <div className="flex divide-x divide-[#eef0f2]">
                      <div className="flex items-center gap-2 px-3 py-2.5 flex-1">
                        <span className="text-[11px] font-medium text-[#8b8fa3] shrink-0">重试</span>
                        <InputNumber size="small" min={0} variant="borderless" className="flex-1"
                          value={step.retry?.times ?? 0}
                          onChange={v => onUpdate("retry", { times: v ?? 0, interval: step.retry?.interval ?? 0 })} />
                        <span className="text-[11px] text-[#c0c4cc] shrink-0">次</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2.5 flex-1">
                        <span className="text-[11px] font-medium text-[#8b8fa3] shrink-0">间隔</span>
                        <InputNumber size="small" min={0} step={100} variant="borderless" className="flex-1"
                          value={step.retry?.interval ?? 0}
                          onChange={v => onUpdate("retry", { times: step.retry?.times ?? 1, interval: v ?? 0 })} />
                        <span className="text-[11px] text-[#c0c4cc] shrink-0">ms</span>
                      </div>
                    </div>
                  </div>
                )}
                {expanded === "extends" && (
                  <Select className="w-full" size="small" allowClear showSearch placeholder="选择一个步骤作为模板"
                    value={step.extends || undefined} popupMatchSelectWidth={false}
                    options={ctx.stepKeys.filter(k => k !== stepName).map(k => ({ value: k, label: k }))}
                    onChange={v => onUpdate("extends", v ?? "")} />
                )}
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StepPanel;
