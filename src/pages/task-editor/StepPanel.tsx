import { useState, type FC } from "react";
import { Button, Input, InputNumber, Select, Tooltip } from "antd";
import { CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { Step } from "@/types/task";
import type { EditorCtx } from "./constants";
import { ACTION_OPTS } from "./constants";
import FlowSection from "./FlowSection";
import ParamsSection from "./ParamsSection";
import SubList from "./SubList";

interface Props {
  stepName: string; step: Step; isCommon: boolean; ctx: EditorCtx;
  onClose: () => void; onRename: (name: string) => void;
  onUpdate: (field: string, value: unknown) => void; onDelete: () => void;
}

const SUB_LISTS = [
  { key: "prefix", label: "前置步骤", color: "#16a34a" },
  { key: "postfix", label: "后置步骤", color: "#f59e0b" },
  { key: "failure_extra", label: "失败附加", color: "#dc2626" },
  { key: "success_extra", label: "成功附加", color: "#2563eb" },
] as const;

const StepPanel: FC<Props> = ({ stepName, step, isCommon, ctx, onClose, onRename, onUpdate, onDelete }) => {
  const [nameEdit, setNameEdit] = useState(false);
  const [nameDraft, setNameDraft] = useState(stepName);
  const accent = isCommon ? "#f59e0b" : "#3b82f6";

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-5 py-4 flex items-center gap-2">
        {nameEdit ? (
          <Input size="small" autoFocus className="!font-semibold flex-1" value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => { if (nameDraft && nameDraft !== stepName) onRename(nameDraft); setNameEdit(false); }}
            onPressEnter={() => { if (nameDraft && nameDraft !== stepName) onRename(nameDraft); setNameEdit(false); }} />
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-1.5 group/name">
            <h3 className="text-[15px] font-bold text-[#1a1a2e] truncate cursor-pointer"
              onDoubleClick={() => { setNameDraft(stepName); setNameEdit(true); }}>{stepName}</h3>
            <Tooltip title="双击重命名">
              <EditOutlined className="text-[11px] text-[#d0d5dd] hover:text-[#6b7280] cursor-pointer opacity-0 group-hover/name:opacity-100 transition-opacity"
                onClick={() => { setNameDraft(stepName); setNameEdit(true); }} />
            </Tooltip>
          </div>
        )}
        <Tooltip title="删除步骤"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onDelete} /></Tooltip>
        <div className="w-px h-4 bg-[#e5e7eb]" />
        <Tooltip title="关闭面板"><Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} /></Tooltip>
      </div>
      <div className="h-px bg-[#f0f0f3] mx-5 shrink-0" />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[#3b82f6]" />
            <label className="text-[13px] font-bold text-[#1a1a2e]">动作类型</label>
          </div>
          <Select className="w-full" size="middle" allowClear showSearch placeholder="选择动作..."
            value={step.action || undefined} popupMatchSelectWidth={false}
            onChange={(v) => onUpdate("action", v ?? "")}
            options={ACTION_OPTS.map((o) => ({ ...o,
              label: <div className="flex items-center gap-2">
                <code className="text-[11px] font-semibold text-[#374151] bg-[#f0f2f5] px-1.5 py-0.5 rounded">{o.label}</code>
                <span className="text-[11px] text-[#9ca3af]">{o.desc}</span></div> }))} />
        </section>
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[#8b5cf6]" />
            <label className="text-[13px] font-bold text-[#1a1a2e]">描述</label>
          </div>
          <Input placeholder="步骤说明，会在补全提示中展示"
            value={step.description || ""}
            onChange={(e) => onUpdate("description", e.target.value || undefined)} />
        </section>
        <FlowSection step={step} stepKeys={ctx.stepKeys} stepName={stepName} onUpdate={onUpdate} />
        <ParamsSection step={step} ctx={ctx} onUpdate={onUpdate} />
        <section>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-[#9333ea]" />
                <label className="text-[13px] font-bold text-[#1a1a2e]">继承模板</label>
              </div>
              <Select className="w-full" size="small" allowClear showSearch placeholder="选择一个步骤作为模板"
                value={step.extends || undefined} popupMatchSelectWidth={false}
                options={ctx.stepKeys.filter((k) => k !== stepName).map((k) => ({ value: k, label: k }))}
                onChange={(v) => onUpdate("extends", v ?? "")} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-[#dc2626]" />
                <label className="text-[13px] font-bold text-[#1a1a2e]">失败重试</label>
              </div>
              <div className="rounded-lg border border-[#eef0f2] bg-white overflow-hidden">
                <div className="flex divide-x divide-[#eef0f2]">
                  <div className="flex items-center gap-2 px-3 py-2 flex-1">
                    <span className="text-[11px] font-medium text-[#6b7280] shrink-0">重试</span>
                    <InputNumber size="small" min={0} variant="borderless" className="flex-1"
                      value={step.retry?.times ?? 0}
                      onChange={(v) => onUpdate("retry", { times: v ?? 0, interval: step.retry?.interval ?? 0 })} />
                    <span className="text-[11px] text-[#9ca3af] shrink-0">次</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 flex-1">
                    <span className="text-[11px] font-medium text-[#6b7280] shrink-0">间隔</span>
                    <InputNumber size="small" min={0} step={100} variant="borderless" className="flex-1"
                      value={step.retry?.interval ?? 0}
                      onChange={(v) => onUpdate("retry", { times: step.retry?.times ?? 1, interval: v ?? 0 })} />
                    <span className="text-[11px] text-[#9ca3af] shrink-0">ms</span>
                  </div>
                </div>
              </div>
            </div>
            {SUB_LISTS.map(({ key, label, color }) => (
              <SubList key={key} label={label} color={color}
                list={step[key] ?? []} ctx={ctx}
                onChange={(v) => onUpdate(key, v)} />
            ))}
            <SubList label="set 变量" color="#3b82f6" list={step.set ?? []} ctx={ctx}
              onChange={(v) => onUpdate("set", v)} isKeyValue />
          </div>
        </section>
      </div>
    </div>
  );
};

export default StepPanel;
