import { useEffect, useMemo, useState, type FC } from "react";
import { AutoComplete, Button, Input, InputNumber, Popover, Select } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { EditorCtx } from "./constants";

const COMPARE_OPS = ["==", "!=", ">", "<", ">=", "<="];

type Cond = { var: string; op: string; val: string; logic: string };

/** 从 {xxx} 中提取变量名 */
const stripBraces = (v: string) => v.startsWith("{") ? v.slice(1, -1) : v;

/** 构建单条条件片段：var == 'val' */
const condPart = (c: Cond) => `${stripBraces(c.var)} ${c.op} '${c.val}'`;

/** 构建完整表达式：{part1 && part2} */
const buildExpr = (conds: Cond[]) => {
  const valid = conds.filter((c) => c.var);
  if (valid.length === 0) return "";
  return `{${valid.map((c, i) => (i > 0 ? ` ${c.logic} ` : "") + condPart(c)).join("")}}`;
};

/** 解析表达式回 Cond[]，兼容多种格式 */
const parseExpr = (expr: string): Cond[] => {
  if (!expr) return [];
  let inner = expr.trim();
  // 去掉外层 {...} 包裹
  if (inner.startsWith("{") && inner.endsWith("}") && inner.indexOf("{", 1) === -1) {
    inner = inner.slice(1, -1);
  }
  // 按 && 或 || 分割
  const parts = inner.split(/\s*(&&|\|\|)\s*/);
  const result: Cond[] = [];
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i].trim();
    if (seg === "&&" || seg === "||") continue;
    // 兼容: var == 'val' 或 var == "val" 或 {var} == 'val' 或 {var == 'val'}
    let s = seg;
    if (s.startsWith("{")) s = s.slice(1);
    if (s.endsWith("}")) s = s.slice(0, -1);
    const m = s.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*['"]?([^'"]*?)['"]?$/);
    if (m) {
      const logic = (i > 1 && parts[i - 1]?.trim() === "||") ? "||" : "&&";
      result.push({ var: `{${m[1].trim()}}`, op: m[2], val: m[3], logic });
    }
  }
  return result;
};

const defaultCond = (logic = "&&"): Cond => ({ var: "", op: "==", val: "", logic });

// ── WhenEditor ──────────────────────────────────────────
const WhenEditor: FC<{
  itemWhen: string; varOnlyOptions: { value: string; label: string }[];
  updateItem: (updater: (o: any) => any) => void;
}> = ({ itemWhen, varOnlyOptions, updateItem }) => {
  const [conds, setConds] = useState<Cond[]>([defaultCond()]);

  useEffect(() => {
    const parsed = parseExpr(itemWhen);
    setConds(parsed.length > 0 ? parsed : [defaultCond()]);
  }, [itemWhen]);

  const sync = (next: Cond[]) => {
    setConds(next);
    const expr = buildExpr(next);
    if (expr) updateItem((o) => { o.when = expr; return o; });
  };

  const setCond = (i: number, p: Partial<Cond>) => {
    const next = [...conds]; next[i] = { ...next[i], ...p }; sync(next);
  };

  return (
    <div className="flex flex-col gap-3 w-[420px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-[#10b981]" />
          <span className="text-[13px] font-bold text-[#1a1a2e]">when 条件</span>
        </div>
        <Button type="primary" size="small" ghost icon={<PlusOutlined />}
          onClick={() => sync([...conds, defaultCond()])}>添加条件</Button>
      </div>

      <div className="flex flex-col">
        {conds.map((c, i) => (
          <div key={i}>
            {i > 0 && (
              <div className="flex items-center justify-center py-1.5 gap-1">
                <div className="h-px flex-1 bg-[#e8eaed]" />
                <button
                  className={`text-[11px] px-3 py-0.5 rounded-full border font-medium transition-all select-none
                    ${c.logic === "&&"
                      ? "border-[#3b82f6] bg-[#eef2ff] text-[#3b82f6]"
                      : "border-[#f59e0b] bg-[#fff7e6] text-[#f59e0b]"}`}
                  onClick={() => setCond(i, { logic: c.logic === "&&" ? "||" : "&&" })}>
                  {c.logic === "&&" ? "且" : "或"}
                </button>
                <div className="h-px flex-1 bg-[#e8eaed]" />
              </div>
            )}
            <div className="flex items-center rounded-lg border border-[#e8eaed] bg-white hover:border-[#d0d5dd] transition-colors overflow-hidden">
              <div className="flex items-center gap-1.5 flex-1 px-3 py-2">
                <Select size="small" variant="borderless" className="flex-1 font-semibold"
                  placeholder="变量" showSearch value={c.var || undefined}
                  popupMatchSelectWidth={false}
                  options={varOnlyOptions.filter((o) => o.value.startsWith("{"))}
                  onChange={(v) => setCond(i, { var: v ?? "" })} />
                <Select size="small" variant="borderless" style={{ width: 52 }}
                  value={c.op} options={COMPARE_OPS.map((op) => ({ value: op }))}
                  className="font-mono"
                  onChange={(v) => setCond(i, { op: v })} />
                <Input size="small" variant="borderless" className="flex-1" placeholder="期望值"
                  value={c.val} onChange={(e) => setCond(i, { val: e.target.value })} />
                <Button type="text" size="small"
                  className="!text-[#d0d5dd] hover:!text-[#dc2626] shrink-0"
                  onClick={() => {
                    if (conds.length <= 1) sync([defaultCond()]);
                    else sync(conds.filter((_, idx) => idx !== i));
                  }}>×</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {buildExpr(conds) ? (
        <div className="rounded-lg bg-[#f6f8fb] border border-[#e0e4ea] px-3 py-2.5">
          <code className="text-[12px] text-[#374151] break-all font-mono">{buildExpr(conds)}</code>
        </div>
      ) : null}
    </div>
  );
};

interface Props {
  index: number; item: any; ctx: EditorCtx; arr: any[]; color?: string; onChange: (v: any[]) => void;
}

const SubflowModalItem: FC<Props> = ({ index: i, item, ctx, arr, color = "#9ca3af", onChange }) => {
  const stepName = typeof item === "string" ? item : item.step;
  const itemWhen = typeof item === "object" ? (item.when ?? "") : "";
  const argsObj = typeof item === "object" && item.args && typeof item.args === "object"
    ? item.args as Record<string, unknown> : undefined;
  const argsEntries = argsObj ? Object.entries(argsObj) : [];
  const argsCount = argsEntries.filter(([k]) => k).length;
  const repeatMatch = stepName.match(/^(.+)\*(\d+)$/);
  const baseName = repeatMatch ? repeatMatch[1] : stepName;
  const repeatCount = repeatMatch ? parseInt(repeatMatch[2]) : 1;

  const updateItem = (updater: (o: any) => any) => {
    const u = [...arr];
    u[i] = updater(typeof u[i] === "string" ? { step: u[i] } : { ...u[i] });
    onChange(u);
  };
  const setArgs = (entries: [string, unknown][]) => {
    if (entries.length === 0) { updateItem((o) => { o.args = undefined; return o; }); return; }
    const obj: Record<string, unknown> = {};
    for (const [k, v] of entries) obj[k] = v;
    updateItem((o) => { o.args = obj; return o; });
  };
  const handleStepChange = (v: string | undefined) => {
    const newBase = v ?? "";
    updateItem((o) => {
      o.step = repeatCount > 1 && v ? `${v}*${repeatCount}` : newBase;
      if (!o.args || (typeof o.args === "object" && Object.keys(o.args).length === 0)) {
        const def = ctx.stepParamsMap[newBase];
        if (def && Object.keys(def).length > 0) o.args = { ...def };
      }
      return o;
    });
  };

  const stepParamKeys = useMemo(() => {
    const p = ctx.stepParamsMap[baseName];
    return p ? Object.keys(p).map((k) => ({ value: k, label: k })) : [];
  }, [ctx.stepParamsMap, baseName]);
  const varOnlyOptions = useMemo(
    () => [...ctx.builtinVars, ...ctx.configVars, ...ctx.taskValueVars, ...ctx.setVars],
    [ctx.builtinVars, ctx.configVars, ctx.taskValueVars, ctx.setVars],
  );
  const allOptions = useMemo(
    () => [...ctx.builtinVars, ...ctx.configVars, ...ctx.taskValueVars,
           ...ctx.setVars, ...ctx.taskSteps, ...ctx.taskCommonSteps, ...ctx.globalCommonSteps],
    [ctx.builtinVars, ctx.configVars, ctx.taskValueVars,
     ctx.setVars, ctx.taskSteps, ctx.taskCommonSteps, ctx.globalCommonSteps],
  );

  return (
    <div className="group rounded-xl border border-dashed bg-white transition-colors flex-1 min-w-0"
      style={{ borderColor: `${color}4d`, background: `linear-gradient(135deg, ${color}0a, #fff)` }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5">
        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0"
          style={{ background: `${color}18`, color }}>{i + 1}</span>
        <Select size="small" variant="borderless" className="flex-1 min-w-0 font-semibold" showSearch allowClear
          placeholder="选择步骤" value={baseName || undefined} popupMatchSelectWidth={false}
          options={[...ctx.taskSteps, ...ctx.taskCommonSteps, ...ctx.globalCommonSteps]} onChange={handleStepChange} />
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <span className="text-[10px] text-[#9ca3af]">×</span>
          <InputNumber size="small" variant="borderless" min={1} max={99} style={{ width: 36 }} value={repeatCount}
            onChange={(v) => updateItem((o) => { o.step = v && v > 1 ? `${baseName}*${v}` : baseName; return o; })} />
          {/* when */}
          <Popover trigger="click" placement="bottomLeft" content={<WhenEditor
            itemWhen={itemWhen} varOnlyOptions={varOnlyOptions} updateItem={updateItem} />}>
            <span className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer shrink-0 border transition-colors inline-block text-center min-w-[40px]
              ${itemWhen ? "border-[#3b82f6] bg-[#eef2ff] text-[#3b82f6] font-medium" : "border-dashed border-[#d0d5dd] text-[#9ca3af] hover:border-[#3b82f6] hover:text-[#3b82f6]"}`}>
              when{itemWhen ? "*" : ""}
            </span>
        </Popover>
        {/* args */}
        {stepParamKeys.length > 0 || argsCount > 0 ? (
          <Popover trigger="click" placement="bottomRight" content={
            <div className="flex flex-col gap-2 w-80">
              <div className="text-[12px] font-semibold text-[#1a1a2e]">args 参数</div>
              {argsEntries.map(([key, val], ei) => (
                <div key={ei} className="flex items-center gap-2">
                  <AutoComplete className="flex-1" size="small" placeholder="键" value={key || undefined}
                    options={stepParamKeys}
                    filterOption={(iv, opt) => opt?.label?.toLowerCase().includes(iv.toLowerCase()) ?? false}
                    onChange={(v) => {
                      const def = ctx.stepParamsMap[baseName]?.[v ?? ""];
                      const next = [...argsEntries];
                      next[ei] = [v ?? "", def !== undefined ? (typeof def === "string" ? def : JSON.stringify(def)) : val];
                      setArgs(next);
                    }} />
                  <span className="text-[10px] text-[#9ca3af]">:</span>
                  <AutoComplete className="flex-1" size="small" placeholder="值"
                    value={typeof val === "string" ? val : JSON.stringify(val)} options={allOptions}
                    filterOption={(iv, opt) => opt?.label?.toLowerCase().includes(iv.toLowerCase()) ?? false}
                    onChange={(v) => { const next = [...argsEntries]; next[ei] = [key, v]; setArgs(next); }} />
                  <Button type="text" size="small" className="!text-[#d0d5dd] hover:!text-[#dc2626] shrink-0"
                    onClick={() => { const next = [...argsEntries]; next.splice(ei, 1); setArgs(next); }}>×</Button>
                </div>
              ))}
              <Button type="dashed" size="small" block onClick={() => setArgs([...argsEntries, ["", ""]])}>+ 添加参数</Button>
            </div>
          }>
            <span className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer shrink-0 border transition-colors inline-block text-center min-w-[40px]
              ${argsCount > 0 ? "border-[#3b82f6] bg-[#eef2ff] text-[#3b82f6] font-medium"
                : "border-dashed border-[#d0d5dd] text-[#9ca3af] hover:border-[#3b82f6] hover:text-[#3b82f6]"}`}>
              {argsCount > 0 ? `args ${argsCount}` : "args"}
            </span>
          </Popover>
        ) : null}
          <Button type="text" size="small"
            className="!text-[#c0c4cc] hover:!text-[#dc2626] opacity-0 group-hover:opacity-100 transition-all shrink-0"
            onClick={() => { const u = [...arr]; u.splice(i, 1); onChange(u); }}><DeleteOutlined className="text-[11px]" /></Button>
        </div>
      </div>
    </div>
  );
};

export default SubflowModalItem;
