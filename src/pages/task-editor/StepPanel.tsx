import { useState, type FC } from "react";
import { AutoComplete, Button, Input, InputNumber, Select, Tooltip } from "antd";
import { CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { Step } from "@/types/task";
import type { EditorCtx } from "./constants";
import { ACTION_OPTS, ACTIONS_WITH_TEMPLATES, ACTION_PARAMS, PARAM_META, PLAIN_VALUE_PARAMS } from "./constants";
import SubflowModalItem from "./SubflowModalItem";
import PosInput from "./PosInput";
import CoordPickerModal from "@/components/coord-picker/CoordPickerModal";

interface Props {
  stepName: string; step: Step; isCommon: boolean; ctx: EditorCtx;
  onClose: () => void; onRename: (name: string) => void;
  onUpdate: (field: string, value: unknown) => void; onDelete: () => void;
}

// ---- Types ----

type CardKey = "flow" | "params" | "prefix" | "postfix" | "failure_extra" | "success_extra" | "set" | "retry" | "extends";

interface CardDef {
  key: CardKey; label: string; color: string; bg: string; summary: (s: Step) => string;
}

const CARDS: CardDef[] = [
  { key: "flow", label: "流程跳转", color: "#16a34a", bg: "#f0fdf4",
    summary: (s) => {
      const p: string[] = [];
      if (s.success) p.push(`✓ ${s.success}`);
      if (s.failure) p.push(`✗ ${s.failure}`);
      if (s.next) p.push(`→ ${s.next}`);
      return p.length ? p.join("  ·  ") : "";
    },
  },
  { key: "params", label: "执行参数", color: "#ca8a04", bg: "#fefce8",
    summary: (s) => {
      const a = ((s.params?.args as string[]) ?? []).length;
      const o = Object.keys(s.params ?? {}).filter(k => k !== "args").length;
      return a + o ? `${a + o} 个参数` : "";
    },
  },
  { key: "prefix", label: "前置步骤", color: "#16a34a", bg: "#f0fdf4",
    summary: (s) => s.prefix?.length ? `${s.prefix.length} 个步骤` : "",
  },
  { key: "postfix", label: "后置步骤", color: "#f59e0b", bg: "#fffbeb",
    summary: (s) => s.postfix?.length ? `${s.postfix.length} 个步骤` : "",
  },
  { key: "failure_extra", label: "失败附加", color: "#dc2626", bg: "#fef2f2",
    summary: (s) => s.failure_extra?.length ? `${s.failure_extra.length} 个步骤` : "",
  },
  { key: "success_extra", label: "成功附加", color: "#2563eb", bg: "#eff6ff",
    summary: (s) => s.success_extra?.length ? `${s.success_extra.length} 个步骤` : "",
  },
  { key: "set", label: "set 变量", color: "#9333ea", bg: "#faf5ff",
    summary: (s) => s.set?.length ? `${s.set.length} 个变量` : "",
  },
  { key: "retry", label: "失败重试", color: "#dc2626", bg: "#fef2f2",
    summary: (s) => (s.retry?.times ? `${s.retry.times}次 / ${s.retry.interval ?? 0}ms` : ""),
  },
  { key: "extends", label: "继承模板", color: "#8b5cf6", bg: "#f5f3ff",
    summary: (s) => (s.extends ? s.extends : ""),
  },
];

// ---- Inline editors ----

const FlowEditor: FC<{ step: Step; stepKeys: string[]; stepName: string; onUpdate: Props["onUpdate"] }> =
  ({ step, stepKeys, stepName, onUpdate }) => {
    const flows = [
      { k: "success" as const, label: "成功时跳转到", color: "#16a34a", bg: "#f0fdf4", dot: "●" },
      { k: "failure" as const, label: "失败时跳转到", color: "#dc2626", bg: "#fef2f2", dot: "●" },
      { k: "next"    as const, label: "无条件跳转到", color: "#6b7280", bg: "#f8f9fb", dot: "●" },
    ];
    return (
      <div className="flex flex-col gap-2">
        {flows.map(({ k, label, color, bg, dot }) => (
          <div key={k} className="rounded-lg border border-[#eef0f2] overflow-hidden bg-white">
            <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: bg }}>
              <span className="text-[8px]" style={{ color }}>{dot}</span>
              <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
            </div>
            <div className="px-3 py-2">
              <Select className="w-full" size="small" allowClear showSearch
                placeholder="选择目标步骤" popupMatchSelectWidth={false}
                value={(step as any)[k] || undefined}
                options={stepKeys.filter(sk => sk !== stepName).map(sk => ({ value: sk, label: sk }))}
                onChange={(v) => onUpdate(k, v ?? "")} />
            </div>
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
    <div className="flex flex-col gap-3">
      {showArgs && (
        <div className="rounded-lg border border-[#eef0f2] bg-white p-3">
          <div className="text-[10px] text-[#8b8fa3] uppercase tracking-wide mb-1.5">模板图片 · args</div>
          <Select mode="tags" className="w-full" size="small" placeholder="输入图片名回车添加" value={args}
            onChange={(v) => onUpdate("params", { ...params, args: v })} />
        </div>
      )}
      {other.map(key => {
        const meta = PARAM_META[key];
        const raw = typeof params[key] === "string" ? params[key] as string : JSON.stringify(params[key]);
        return (
          <div key={key} className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eef0f2] bg-white hover:border-[#dde0e6] transition-all">
            <span className="text-[11px] font-medium text-[#8b8fa3] w-[68px] shrink-0 truncate">{meta?.label ?? key}</span>
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
            <button onClick={() => { const p = { ...params }; delete p[key]; onUpdate("params", p); }}
              className="text-[#c0c4cc] hover:text-[#ff4d4f] opacity-0 group-hover:opacity-100 transition-all shrink-0 text-xs">×</button>
          </div>
        );
      })}
      {canAdd.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-[#c0c4cc] self-center mr-1">可添加</span>
          {canAdd.map(k => {
            const meta = PARAM_META[k];
            return (
              <button key={k} onClick={() => onUpdate("params", { ...params, [k]: "" })}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-dashed border-[#d0d5dd] text-[#6b7280] hover:text-[#1677ff] hover:border-[#1677ff] hover:bg-[#eef2ff] transition-colors">
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
  const add = () => onChange([...arr, isKeyValue ? { name: "", value: "" } : { step: "" }]);

  return (
    <div className="flex flex-col gap-2">
      {arr.map((item, i) => isKeyValue ? (
        <div key={i} className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eef0f2] bg-white hover:border-[#dde0e6] transition-all">
          <span className="w-5 h-5 rounded-full bg-[#eef2ff] flex items-center justify-center text-[10px] font-semibold text-[#1677ff] shrink-0">{i + 1}</span>
          <Input size="small" variant="borderless" placeholder="变量名" className="flex-1 font-medium text-[12px]" value={item.name}
            onChange={(e) => { const u = [...arr]; u[i] = { ...u[i], name: e.target.value }; onChange(u); }} />
          <span className="text-[10px] text-[#c0c4cc]">=</span>
          <AutoComplete className="flex-1" size="small" variant="borderless" placeholder="值" value={item.value as string}
            options={ctx.variableOptions}
            filterOption={(iv, opt) => opt?.label?.toLowerCase().includes(iv.toLowerCase()) ?? false}
            onChange={(v) => { const u = [...arr]; u[i] = { ...u[i], value: v }; onChange(u); }} />
          <button onClick={() => onChange(arr.filter((_, j) => j !== i))}
            className="text-[#c0c4cc] hover:text-[#ff4d4f] opacity-0 group-hover:opacity-100 transition-all shrink-0 text-xs">×</button>
        </div>
      ) : (
        <SubflowModalItem key={i} index={i} item={item} ctx={ctx} arr={arr} onChange={onChange} />
      ))}
      <button onClick={add}
        className="flex items-center justify-center gap-1 text-[11px] text-[#8b8fa3] hover:text-[#1677ff] hover:bg-[#eef2ff] py-2 rounded-lg border border-dashed border-[#d0d5dd] hover:border-[#1677ff] transition-colors">
        + 添加{isKeyValue ? "变量" : "步骤"}
      </button>
    </div>
  );
};

// ---- Main ----

const StepPanel: FC<Props> = ({ stepName, step, isCommon, ctx, onClose, onRename, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState<CardKey | null>(null);
  const [nameEdit, setNameEdit] = useState(false);
  const [nameDraft, setNameDraft] = useState(stepName);

  return (
    <div className="flex flex-col h-full bg-[#fafbfc]">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 flex items-center gap-2 bg-white border-b border-[#eef0f2]">
        {isCommon && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fff7e6] text-[#f59e0b] font-medium shrink-0">公共</span>
        )}
        {nameEdit ? (
          <Input size="small" autoFocus className="!font-semibold flex-1" value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => { if (nameDraft && nameDraft !== stepName) onRename(nameDraft); setNameEdit(false); }}
            onPressEnter={() => { if (nameDraft && nameDraft !== stepName) onRename(nameDraft); setNameEdit(false); }} />
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-1.5 group/name">
            <h3 className="text-sm font-semibold text-[#1a1a2e] truncate cursor-default"
              onDoubleClick={() => { setNameDraft(stepName); setNameEdit(true); }}>{stepName}</h3>
            <button onClick={() => { setNameDraft(stepName); setNameEdit(true); }}
              className="text-[#c0c4cc] hover:text-[#6b7280] opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0">
              <EditOutlined className="text-[11px]" />
            </button>
          </div>
        )}
        <Tooltip title="删除"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onDelete} /></Tooltip>
        <Tooltip title="关闭"><Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} /></Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Action selector */}
        <Select className="w-full" size="small" allowClear showSearch placeholder="选择动作…"
          value={step.action || undefined} popupMatchSelectWidth={false}
          onChange={(v) => onUpdate("action", v ?? "")}
          options={ACTION_OPTS.map(o => ({
            ...o,
            label: <div className="flex items-center gap-2">
              <code className="text-[11px] font-semibold text-[#1a1a2e] bg-[#f0f2f5] px-1.5 py-0.5 rounded">{o.label}</code>
              <span className="text-[11px] text-[#8b8fa3]">{o.desc}</span>
            </div>,
          }))} />

        {/* Description */}
        <Input size="small" placeholder="步骤说明…"
          value={step.description || ""}
          onChange={(e) => onUpdate("description", e.target.value || undefined)} />

        {/* Dashboard or Expanded */}
        {expanded === null ? (
          <div className="grid grid-cols-2 gap-2">
            {CARDS.map(card => {
              const s = card.summary(step);
              const configured = s !== "";
              return (
                <button key={card.key} onClick={() => setExpanded(card.key)}
                  className={`group/card flex flex-col gap-2 px-3 py-3 rounded-xl border text-left transition-all
                    ${configured
                      ? "border-[#eef0f2] bg-white hover:border-[#dde0e6] hover:shadow-sm"
                      : "border-dashed border-[#d0d5dd] bg-white/60 hover:border-[#1677ff] hover:bg-[#f0f5ff]"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: configured ? card.color : "#d0d5dd" }} />
                    <span className="text-[11px] font-medium text-[#1a1a2e]">{card.label}</span>
                  </div>
                  <span className={`text-[10px] leading-tight w-full truncate
                    ${configured ? "text-[#6b7280]" : "text-[#c0c4cc]"}`}>
                    {configured ? s : "未配置"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={() => setExpanded(null)}
              className="flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-[#1677ff] transition-colors self-start -mt-1">
              <span>← 返回总览</span>
            </button>

            {/* Expanded content */}
            {expanded === "flow" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#16a34a]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">流程跳转</span>
                </div>
                <FlowEditor step={step} stepKeys={ctx.stepKeys} stepName={stepName} onUpdate={onUpdate} />
              </div>
            )}
            {expanded === "params" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#ca8a04]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">执行参数</span>
                </div>
                <ParamsEditor step={step} ctx={ctx} onUpdate={onUpdate} />
              </div>
            )}
            {expanded === "prefix" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#16a34a]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">前置步骤</span>
                </div>
                <SubListEditor list={step.prefix ?? []} ctx={ctx} onChange={(v) => onUpdate("prefix", v)} />
              </div>
            )}
            {expanded === "postfix" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#f59e0b]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">后置步骤</span>
                </div>
                <SubListEditor list={step.postfix ?? []} ctx={ctx} onChange={(v) => onUpdate("postfix", v)} />
              </div>
            )}
            {expanded === "failure_extra" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#dc2626]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">失败附加</span>
                </div>
                <SubListEditor list={step.failure_extra ?? []} ctx={ctx} onChange={(v) => onUpdate("failure_extra", v)} />
              </div>
            )}
            {expanded === "success_extra" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#2563eb]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">成功附加</span>
                </div>
                <SubListEditor list={step.success_extra ?? []} ctx={ctx} onChange={(v) => onUpdate("success_extra", v)} />
              </div>
            )}
            {expanded === "set" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#9333ea]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">set 变量</span>
                </div>
                <SubListEditor list={step.set ?? []} ctx={ctx} isKeyValue onChange={(v) => onUpdate("set", v)} />
              </div>
            )}
            {expanded === "retry" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#dc2626]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">失败重试</span>
                </div>
                <div className="rounded-lg border border-[#eef0f2] overflow-hidden">
                  <div className="flex divide-x divide-[#eef0f2]">
                    <div className="flex items-center gap-2 px-3 py-2.5 flex-1">
                      <span className="text-[11px] font-medium text-[#8b8fa3] shrink-0">重试</span>
                      <InputNumber size="small" min={0} variant="borderless" className="flex-1"
                        value={step.retry?.times ?? 0}
                        onChange={(v) => onUpdate("retry", { times: v ?? 0, interval: step.retry?.interval ?? 0 })} />
                      <span className="text-[11px] text-[#c0c4cc] shrink-0">次</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 flex-1">
                      <span className="text-[11px] font-medium text-[#8b8fa3] shrink-0">间隔</span>
                      <InputNumber size="small" min={0} step={100} variant="borderless" className="flex-1"
                        value={step.retry?.interval ?? 0}
                        onChange={(v) => onUpdate("retry", { times: step.retry?.times ?? 1, interval: v ?? 0 })} />
                      <span className="text-[11px] text-[#c0c4cc] shrink-0">ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {expanded === "extends" && (
              <div className="rounded-xl border border-[#eef0f2] bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#8b5cf6]" />
                  <span className="text-xs font-semibold text-[#1a1a2e]">继承模板</span>
                </div>
                <Select className="w-full" size="small" allowClear showSearch placeholder="选择一个步骤作为模板"
                  value={step.extends || undefined} popupMatchSelectWidth={false}
                  options={ctx.stepKeys.filter(k => k !== stepName).map(k => ({ value: k, label: k }))}
                  onChange={(v) => onUpdate("extends", v ?? "")} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepPanel;
