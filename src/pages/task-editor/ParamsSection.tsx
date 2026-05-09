import { useState, type FC } from "react";
import { AutoComplete, Button, Input, Modal, Select } from "antd";
import type { Step } from "@/types/task";
import type { EditorCtx } from "./constants";
import { ACTIONS_WITH_TEMPLATES, ACTION_PARAMS, PARAM_META, PLAIN_VALUE_PARAMS } from "./constants";
import PosInput from "./PosInput";
import CoordPickerModal from "@/components/coord-picker/CoordPickerModal";

interface Props { step: Step; ctx: EditorCtx; onUpdate: (field: string, value: unknown) => void; }

const ParamsSection: FC<Props> = ({ step, ctx, onUpdate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [coordOpen, setCoordOpen] = useState(false);
  const params = step.params ?? {};
  const args = (params.args as string[]) ?? [];
  const otherKeys = Object.keys(params).filter((k) => k !== "args");
  const total = args.length + otherKeys.length;
  const showArgs = step.action ? ACTIONS_WITH_TEMPLATES.has(step.action) : false;
  const allowed = step.action ? (ACTION_PARAMS[step.action] ?? []) : [];

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-[#ca8a04]" />
        <label className="text-[13px] font-bold text-[#1a1a2e]">执行参数</label>
      </div>
      <div className="rounded-lg border border-[#eef0f2] bg-[#fafbfc] px-4 py-3 cursor-pointer hover:border-[#d0d5dd] hover:bg-[#f0f2f5] transition-all"
        onClick={() => setModalOpen(true)}>
        {total > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            {args.length > 0 && <span className="text-[11px] px-2 py-0.5 rounded bg-[#eef2ff] text-[#3b82f6] font-medium">{args.length} 张图片</span>}
            {otherKeys.map((k) => (
              <span key={k} className="text-[11px] px-2 py-0.5 rounded bg-[#f0f2f5] text-[#374151] font-medium">
                {PARAM_META[k]?.label ?? k}: {typeof params[k] === "string" ? params[k] : JSON.stringify(params[k])}
              </span>
            ))}
            <span className="text-[10px] text-[#9ca3af]">点击编辑</span>
          </div>
        ) : <span className="text-[11px] text-[#9ca3af]">未配置 — 点击编辑</span>}
      </div>

      <Modal title="编辑参数" open={modalOpen} onCancel={() => setModalOpen(false)}
        footer={<Button onClick={() => setModalOpen(false)}>完成</Button>} width={520}>
        <div className="flex flex-col gap-4 pt-2">
          {showArgs && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-[#3b82f6]" />
                <label className="text-[13px] font-bold text-[#1a1a2e]">模板图片</label>
                <code className="text-[10px] text-[#9ca3af]">args</code>
              </div>
              <Select mode="tags" className="w-full" size="middle"
                placeholder="输入图片名回车添加" value={args}
                onChange={(v) => onUpdate("params", { ...params, args: v })} />
            </section>
          )}
          {otherKeys.map((key) => {
            const meta = PARAM_META[key];
            const raw = typeof params[key] === "string" ? params[key] as string : JSON.stringify(params[key]);
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 rounded-full" style={{ background: meta?.color ?? "#9ca3af" }} />
                  <label className="text-[13px] font-bold text-[#1a1a2e]">{meta?.label ?? key}</label>
                  <code className="text-[10px] text-[#9ca3af]">{key}</code>
                </div>
                <div className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eef0f2] bg-white hover:border-[#dde0e6] transition-all">
                  {PLAIN_VALUE_PARAMS.has(key) ? (
                    key === "pos" ? (
                      <PosInput params={params} onUpdate={onUpdate} hwnd={ctx.hwnd} onCoordOpen={() => setCoordOpen(true)} />
                    ) : (
                      <Input size="small" variant="borderless" className="flex-1 text-[12px]"
                        placeholder={key === "box" ? "例: [0, 0, 100, 200]" : ""} value={raw}
                        onChange={(e) => {
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
                  <Button type="text" size="small"
                    className="!text-[#d0d5dd] hover:!text-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { const p = { ...params }; delete p[key]; onUpdate("params", p); }}>×</Button>
                </div>
              </section>
            );
          })}
          {otherKeys.length === 0 && <div className="text-[11px] text-[#9ca3af]">暂无参数，点击下方按钮添加</div>}
          {allowed.filter((k) => !params[k]).length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-[#d0d5dd]" />
                <label className="text-[13px] font-bold text-[#1a1a2e]">添加参数</label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allowed.filter((k) => !params[k]).map((k) => {
                  const meta = PARAM_META[k];
                  return (
                    <button key={k} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border border-dashed border-[#d0d5dd] text-[#6b7280] hover:text-[#3b82f6] hover:border-[#3b82f6] hover:bg-[#eef2ff] transition-colors"
                      onClick={() => onUpdate("params", { ...params, [k]: "" })}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta?.color ?? "#9ca3af" }} />
                      {meta?.label ?? k}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
        {ctx.hwnd && <CoordPickerModal open={coordOpen} hwnd={ctx.hwnd}
          onClose={() => setCoordOpen(false)}
          onPick={(x, y) => onUpdate("params", { ...params, pos: [x, y] })} />}
      </Modal>
    </section>
  );
};

export default ParamsSection;
